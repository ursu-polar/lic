"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAllEnriched, getCapitole } from "@/lib/data";
import { sampleWithoutReplacement, shuffle } from "@/lib/quizEngine";
import { loadState, recordTest50Session } from "@/lib/storage";
import type { Capitol, EnrichedQuestion, QuizMode, SessionResult } from "@/lib/types";
import { GlobalStatsReport } from "@/components/GlobalStatsReport";
import { HomeMenu } from "@/components/HomeMenu";
import { QuizView } from "@/components/QuizView";
import { SessionReport } from "@/components/SessionReport";

type View =
  | "home"
  | "quiz"
  | "sessionReport"
  | "globalStats";

export function QuizApp() {
  const [view, setView] = useState<View>("home");
  const [statsTick, setStatsTick] = useState(0);
  const [sessionKey, setSessionKey] = useState(0);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionQuestions, setSessionQuestions] = useState<EnrichedQuestion[]>(
    []
  );
  const [sessionMode, setSessionMode] = useState<QuizMode>("chapter");
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);

  const capitole = useMemo(() => getCapitole(), []);

  const [wrongCount, setWrongCount] = useState(0);
  useEffect(() => {
    setWrongCount(loadState().wrongIds.length);
  }, [statsTick]);

  const bumpStats = useCallback(() => setStatsTick((t) => t + 1), []);

  function startSession(
    title: string,
    questions: EnrichedQuestion[],
    mode: QuizMode
  ) {
    setSessionKey((k) => k + 1);
    setSessionTitle(title);
    setSessionQuestions(questions);
    setSessionMode(mode);
    setView("quiz");
  }

  function handleChapter(c: Capitol) {
    const enriched: EnrichedQuestion[] = c.intrebari.map((q) => ({
      ...q,
      capitol: c.nume,
    }));
    startSession(c.nume, enriched, "chapter");
  }

  function handleRandom() {
    const all = shuffle(getAllEnriched());
    startSession("Random — toate întrebările", all, "random");
  }

  function handleTest50() {
    const sample = sampleWithoutReplacement(getAllEnriched(), 50);
    startSession("Test 50 — întrebări aleatoare", sample, "test50");
  }

  function handleWrongOnly() {
    const wrongIds = new Set(loadState().wrongIds);
    const pool = getAllEnriched().filter((q) => wrongIds.has(q.numar));
    if (pool.length === 0) return;
    startSession("Doar greșite", shuffle(pool), "wrong-only");
  }

  function handleQuizExit() {
    setView("home");
    bumpStats();
  }

  function handleQuizComplete(results: SessionResult[]) {
    if (sessionMode === "test50") {
      recordTest50Session(results);
    }
    setSessionResults(results);
    setView("sessionReport");
    bumpStats();
  }

  return (
    <main className="min-h-screen">
      {view === "home" && (
        <HomeMenu
          capitole={capitole}
          wrongCount={wrongCount}
          onChapter={handleChapter}
          onRandom={handleRandom}
          onTest50={handleTest50}
          onWrongOnly={handleWrongOnly}
          onGlobalStats={() => setView("globalStats")}
        />
      )}
      {view === "quiz" && (
        <QuizView
          key={sessionKey}
          title={sessionTitle}
          questions={sessionQuestions}
          quizMode={sessionMode}
          onExit={handleQuizExit}
          onComplete={handleQuizComplete}
          onStatsUpdate={bumpStats}
        />
      )}
      {view === "sessionReport" && (
        <SessionReport
          results={sessionResults}
          title={sessionTitle}
          onHome={() => {
            setView("home");
            bumpStats();
          }}
        />
      )}
      {view === "globalStats" && (
        <GlobalStatsReport
          statsVersion={statsTick}
          onBack={() => {
            setView("home");
            bumpStats();
          }}
        />
      )}
    </main>
  );
}
