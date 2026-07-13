"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAllEnriched, getCapitole } from "@/lib/data";
import { shuffle } from "@/lib/quizEngine";
import { buildTest45, buildTest45Proportional } from "@/lib/testGenerator";
import {
  clearPausedSession,
  getSeenQuestionNums,
  loadPausedSession,
  loadState,
  recordTest50Session,
  savePausedSession,
  type SessionProgress,
} from "@/lib/storage";
import type { Capitol, EnrichedQuestion, QuizMode, SessionResult } from "@/lib/types";
import { GlobalStatsReport } from "@/components/GlobalStatsReport";
import { QuestionPatternsReport } from "@/components/QuestionPatternsReport";
import { HomeMenu } from "@/components/HomeMenu";
import { QuizView } from "@/components/QuizView";
import { SessionReport } from "@/components/SessionReport";
import { SimulationView } from "@/components/SimulationView";

type View =
  | "home"
  | "quiz"
  | "simulation"
  | "sessionReport"
  | "globalStats"
  | "questionPatterns";

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
  const [sessionProgress, setSessionProgress] = useState<
    SessionProgress | undefined
  >();

  const capitole = useMemo(() => getCapitole(), []);

  const [pausedSession, setPausedSession] = useState<ReturnType<
    typeof loadPausedSession
  >>(null);
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    setPausedSession(loadPausedSession());
    setWrongCount(loadState().wrongIds.length);
  }, [statsTick]);

  const bumpStats = useCallback(() => setStatsTick((t) => t + 1), []);

  function startSession(
    title: string,
    questions: EnrichedQuestion[],
    mode: QuizMode,
    progress?: SessionProgress
  ) {
    if (!progress) {
      clearPausedSession();
    }
    setSessionKey((k) => k + 1);
    setSessionTitle(title);
    setSessionQuestions(questions);
    setSessionMode(mode);
    setSessionProgress(progress);
    setView("quiz");
  }

  const handleSaveProgress = useCallback(
    (progress: SessionProgress) => {
      if (sessionQuestions.length === 0) return;
      savePausedSession({
        title: sessionTitle,
        mode: sessionMode,
        questionNums: sessionQuestions.map((q) => q.numar),
        savedAt: new Date().toISOString(),
        ...progress,
      });
    },
    [sessionTitle, sessionMode, sessionQuestions]
  );

  function handleChapter(c: Capitol) {
    const enriched: EnrichedQuestion[] = c.intrebari.map((q) => ({
      ...q,
      capitol: c.nume,
    }));
    startSession(c.nume, shuffle(enriched), "chapter");
  }

  function handleRandom() {
    const all = shuffle(getAllEnriched());
    startSession("Random — toate întrebările", all, "random");
  }

  function handleTest50() {
    const seen = getSeenQuestionNums();
    const sample = buildTest45(seen);
    startSession("Test 45 — întrebări aleatoare", sample, "test50");
  }

  function handleTest45Uniq() {
    const seen = getSeenQuestionNums();
    const sample = buildTest45Proportional(capitole, seen);
    startSession(
      "Test 45 Uniq — proporțional pe capitole",
      sample,
      "test45-uniq"
    );
  }

  function startSimulation(
    title: string,
    questions: EnrichedQuestion[]
  ) {
    clearPausedSession();
    setSessionKey((k) => k + 1);
    setSessionTitle(title);
    setSessionQuestions(questions);
    setSessionMode("simulation45");
    setSessionProgress(undefined);
    setSessionResults([]);
    setView("simulation");
  }

  function handleSimulation45() {
    const seen = getSeenQuestionNums();
    const sample = buildTest45Proportional(capitole, seen);
    startSimulation("Simulare 45 — proporțional pe capitole", sample);
  }

  function handleSimulationRetryWrong(results: SessionResult[]) {
    const wrongNums = new Set(
      results.filter((r) => !r.isCorrect).map((r) => r.numar)
    );
    if (wrongNums.size === 0) return;

    const byNum = new Map(getAllEnriched().map((q) => [q.numar, q]));
    const pool = [...wrongNums]
      .map((n) => byNum.get(n))
      .filter((q): q is EnrichedQuestion => q !== undefined);

    if (pool.length === 0) return;
    startSimulation(
      `Simulare — reia greșite (${pool.length})`,
      shuffle(pool)
    );
  }

  function handleSimulationComplete(results: SessionResult[]) {
    setSessionResults(results);
    recordTest50Session(results);
    bumpStats();
  }

  function handleWrongOnly() {
    const wrongIds = new Set(loadState().wrongIds);
    const pool = getAllEnriched().filter((q) => wrongIds.has(q.numar));
    if (pool.length === 0) return;
    startSession("Doar greșite", shuffle(pool), "wrong-only");
  }

  function handleResumeSession() {
    const paused = loadPausedSession();
    if (!paused) return;

    const byNum = new Map(getAllEnriched().map((q) => [q.numar, q]));
    const questions = paused.questionNums
      .map((n) => byNum.get(n))
      .filter((q): q is EnrichedQuestion => q !== undefined);

    if (questions.length === 0) {
      clearPausedSession();
      bumpStats();
      return;
    }

    const index = Math.min(paused.index, questions.length - 1);
    startSession(paused.title, questions, paused.mode, {
      index,
      results: paused.results,
      selected: paused.selected,
      verified: paused.verified,
    });
  }

  function handleQuizExit() {
    setView("home");
    bumpStats();
  }

  function handleRetrySessionWrong(results: SessionResult[]) {
    const wrongNums = new Set(
      results.filter((r) => !r.isCorrect).map((r) => r.numar)
    );
    if (wrongNums.size === 0) return;

    const byNum = new Map(getAllEnriched().map((q) => [q.numar, q]));
    const pool = [...wrongNums]
      .map((n) => byNum.get(n))
      .filter((q): q is EnrichedQuestion => q !== undefined);

    if (pool.length === 0) return;
    startSession(`Reia greșite — ${sessionTitle}`, shuffle(pool), "random");
  }

  function handleQuizComplete(results: SessionResult[]) {
    clearPausedSession();
    setSessionProgress(undefined);
    if (sessionMode === "test50" || sessionMode === "test45-uniq") {
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
          statsVersion={statsTick}
          pausedSession={pausedSession}
          onChapter={handleChapter}
          onRandom={handleRandom}
          onTest50={handleTest50}
          onTest45Uniq={handleTest45Uniq}
          onSimulation45={handleSimulation45}
          onWrongOnly={handleWrongOnly}
          onResumeSession={handleResumeSession}
          onGlobalStats={() => setView("globalStats")}
          onQuestionPatterns={() => setView("questionPatterns")}
        />
      )}
      {view === "simulation" && (
        <SimulationView
          key={sessionKey}
          title={sessionTitle}
          questions={sessionQuestions}
          onExit={handleQuizExit}
          onComplete={handleSimulationComplete}
          onRetryWrong={handleSimulationRetryWrong}
          onStatsUpdate={bumpStats}
        />
      )}
      {view === "quiz" && (
        <QuizView
          key={sessionKey}
          title={sessionTitle}
          questions={sessionQuestions}
          quizMode={sessionMode}
          initialProgress={sessionProgress}
          onSaveProgress={handleSaveProgress}
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
          onRetryWrong={() => handleRetrySessionWrong(sessionResults)}
        />
      )}
      {view === "globalStats" && (
        <GlobalStatsReport
          statsVersion={statsTick}
          onStatsUpdate={bumpStats}
          onBack={() => {
            setView("home");
            bumpStats();
          }}
        />
      )}
      {view === "questionPatterns" && (
        <QuestionPatternsReport
          onBack={() => {
            setView("home");
          }}
        />
      )}
    </main>
  );
}
