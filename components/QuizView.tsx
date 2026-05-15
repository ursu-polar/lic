"use client";

import { useRef, useState } from "react";
import type {
  EnrichedQuestion,
  QuizMode,
  SessionResult,
  VariantaKey,
} from "@/lib/types";
import { recordVerifiedAnswer } from "@/lib/storage";

const VARIANTE: VariantaKey[] = ["a", "b", "c", "d"];

type Props = {
  title: string;
  questions: EnrichedQuestion[];
  quizMode: QuizMode;
  onExit: () => void;
  onComplete: (results: SessionResult[]) => void;
  onStatsUpdate: () => void;
};

export function QuizView({
  title,
  questions,
  quizMode,
  onExit,
  onComplete,
  onStatsUpdate,
}: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<VariantaKey | null>(null);
  const [verified, setVerified] = useState(false);
  const resultsRef = useRef<SessionResult[]>([]);

  const q = questions[index];
  const total = questions.length;
  const isLast = index >= total - 1;

  if (!q || total === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted">Nu există întrebări în această sesiune.</p>
        <button
          type="button"
          onClick={onExit}
          className="mt-6 rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-white hover:bg-elevated"
        >
          Înapoi
        </button>
      </div>
    );
  }

  function handleVerify() {
    if (!selected) return;
    const isCorrect = selected === q.raspuns_corect;
    recordVerifiedAnswer(
      q.numar,
      isCorrect,
      quizMode === "wrong-only" ? "wrong-only" : "other"
    );
    const result: SessionResult = {
      numar: q.numar,
      capitol: q.capitol,
      text: q.text,
      selected,
      raspuns_corect: q.raspuns_corect,
      isCorrect,
    };
    resultsRef.current = [...resultsRef.current, result];
    setVerified(true);
    onStatsUpdate();
  }

  function handleNextOrFinish() {
    if (!isLast) {
      setIndex((i) => i + 1);
      setSelected(null);
      setVerified(false);
    } else {
      onComplete(resultsRef.current);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="text-sm text-muted transition hover:text-white"
        >
          ← Renunță
        </button>
        <span className="text-sm text-muted">
          {index + 1} / {total}
        </span>
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-accent">
        {title}
      </p>
      <p
        className="mt-1.5 line-clamp-2 text-[0.7rem] leading-snug text-muted/60 sm:text-xs sm:text-muted/65"
        title={q.capitol}
      >
        {q.capitol}
      </p>
      <h1 className="mt-3 text-lg font-semibold leading-snug text-white sm:text-xl">
        {q.text}
      </h1>

      <div
        className="mt-8 flex flex-col gap-3"
        role="radiogroup"
        aria-label="Variante de răspuns"
      >
        {VARIANTE.map((key) => {
          const label = q.variante[key];
          const isSel = selected === key;
          const isCorrect = verified && key === q.raspuns_corect;
          const isWrongPick =
            verified && isSel && key !== q.raspuns_corect;

          let boxClass =
            "rounded-xl border px-4 py-3 text-left transition cursor-pointer ";
          if (!verified) {
            boxClass += isSel
              ? "border-accent bg-accent/15 ring-1 ring-accent"
              : "border-border bg-surface hover:border-border hover:bg-elevated";
          } else {
            if (isCorrect)
              boxClass +=
                "cursor-default border-emerald-500/90 bg-emerald-500/35 ring-2 ring-emerald-400/50";
            else if (isWrongPick)
              boxClass += "cursor-default border-danger/70 bg-danger/10";
            else
              boxClass +=
                "cursor-default border-border/50 bg-surface/40 opacity-30";
          }

          return (
            <label key={key} className={boxClass}>
              <input
                type="radio"
                name="varianta"
                value={key}
                checked={isSel}
                disabled={verified}
                onChange={() => !verified && setSelected(key)}
                className="sr-only"
              />
              <span
                className={`font-semibold uppercase ${
                  verified && key === q.raspuns_corect
                    ? "text-emerald-200"
                    : "text-accent"
                }`}
              >
                {key}.
              </span>{" "}
              <span className="text-sm leading-relaxed text-white/90">{label}</span>
            </label>
          );
        })}
      </div>

      <div
        className="mt-6 min-h-[1.5rem] text-sm"
        aria-live="polite"
      >
        {verified && (
          <p className={selected === q.raspuns_corect ? "text-success" : "text-danger"}>
            {selected === q.raspuns_corect
              ? "Foarte bine — răspuns corect."
              : "Răspuns greșit. Varianta corectă este evidențiată."}
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {!verified ? (
          <button
            type="button"
            disabled={!selected}
            onClick={handleVerify}
            className="rounded-xl bg-accent px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            Verifică
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNextOrFinish}
            className="rounded-xl bg-white px-8 py-3 text-sm font-semibold text-bg transition hover:bg-white/90"
          >
            {isLast ? "Finalizează" : "Întrebarea următoare"}
          </button>
        )}
      </div>

      <div className="mt-10 h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${((index + (verified ? 1 : 0)) / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
