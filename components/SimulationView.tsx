"use client";

import { useMemo, useState } from "react";
import type {
  EnrichedQuestion,
  SessionResult,
  VariantaKey,
} from "@/lib/types";
import { recordVerifiedAnswer } from "@/lib/storage";

const VARIANTE: VariantaKey[] = ["a", "b", "c", "d"];

type Props = {
  title: string;
  questions: EnrichedQuestion[];
  onExit: () => void;
  onComplete: (results: SessionResult[]) => void;
  onRetryWrong: (results: SessionResult[]) => void;
  onStatsUpdate: () => void;
};

export function SimulationView({
  title,
  questions,
  onExit,
  onComplete,
  onRetryWrong,
  onStatsUpdate,
}: Props) {
  const [answers, setAnswers] = useState<Record<number, VariantaKey>>({});
  const [verified, setVerified] = useState(false);
  const [results, setResults] = useState<SessionResult[]>([]);

  const total = questions.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === total;

  const corecte = results.filter((r) => r.isCorrect).length;
  const gresite = results.length - corecte;
  const procent =
    results.length === 0 ? 0 : Math.round((corecte / results.length) * 100);

  const unansweredNums = useMemo(
    () =>
      questions
        .filter((q) => answers[q.numar] === undefined)
        .map((q) => q.numar),
    [questions, answers]
  );

  function handleSelect(numar: number, key: VariantaKey) {
    if (verified) return;
    setAnswers((prev) => ({ ...prev, [numar]: key }));
  }

  function handleVerify() {
    if (!allAnswered) return;

    const computed: SessionResult[] = questions.map((q) => {
      const selected = answers[q.numar]!;
      const isCorrect = selected === q.raspuns_corect;
      recordVerifiedAnswer(q.numar, isCorrect, "other");
      return {
        numar: q.numar,
        capitol: q.capitol,
        text: q.text,
        selected,
        raspuns_corect: q.raspuns_corect,
        isCorrect,
      };
    });

    setResults(computed);
    setVerified(true);
    onStatsUpdate();
    onComplete(computed);
  }

  function scrollToFirstUnanswered() {
    const first = unansweredNums[0];
    if (first === undefined) return;
    document
      .getElementById(`sim-q-${first}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (total === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted">Nu există întrebări în această simulare.</p>
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-40">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="text-sm text-muted transition hover:text-white"
        >
          ← Renunță
        </button>
        <span className="text-sm text-muted">
          {answeredCount} / {total} răspunsuri
        </span>
      </div>

      <p className="text-xs font-medium uppercase tracking-wide text-accent">
        {title}
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-white">
        Simulare — toate întrebările
      </h1>
      <p className="mt-2 text-sm text-muted">
        Răspunde la toate întrebările, apoi apasă Verifică la final.
      </p>

      {verified && (
        <div
          className="mt-6 rounded-xl border border-border bg-surface p-5"
          role="status"
        >
          <p className="text-lg font-semibold text-white">Rezultat simulare</p>
          <p className="mt-2 text-lg">
            <span className="font-semibold text-success">{corecte}</span>
            <span className="text-muted"> / {total} corecte </span>
            <span className="text-muted">({procent}%)</span>
          </p>
          {gresite > 0 && (
            <p className="mt-1 text-sm text-danger">
              {gresite} răspuns{gresite === 1 ? "" : "uri"} greșite
            </p>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-10">
        {questions.map((q, i) => {
          const selected = answers[q.numar] ?? null;

          return (
            <section
              key={q.numar}
              id={`sim-q-${q.numar}`}
              className="scroll-mt-24 rounded-xl border border-border bg-surface p-5"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Întrebarea {i + 1} · #{q.numar}
              </p>
              <p
                className="mt-1 line-clamp-2 text-[0.7rem] leading-snug text-muted/60"
                title={q.capitol}
              >
                {q.capitol}
              </p>
              <h2 className="mt-3 text-base font-semibold leading-snug text-white sm:text-lg">
                {q.text}
              </h2>

              <div
                className="mt-4 flex flex-col gap-2"
                role="radiogroup"
                aria-label={`Variante întrebarea ${i + 1}`}
              >
                {VARIANTE.map((key) => {
                  const label = q.variante[key];
                  const isSel = selected === key;
                  const isCorrect =
                    verified && key === q.raspuns_corect;
                  const isWrongPick =
                    verified && isSel && key !== q.raspuns_corect;

                  let boxClass =
                    "rounded-lg border px-3 py-2.5 text-left text-sm transition ";
                  if (!verified) {
                    boxClass += isSel
                      ? "cursor-pointer border-accent bg-accent/15 ring-1 ring-accent"
                      : "cursor-pointer border-border bg-elevated/50 hover:border-border hover:bg-elevated";
                  } else {
                    if (isCorrect)
                      boxClass +=
                        "border-emerald-500/90 bg-emerald-500/35 ring-2 ring-emerald-400/50";
                    else if (isWrongPick)
                      boxClass += "border-danger/70 bg-danger/10";
                    else
                      boxClass += "border-border/50 bg-elevated/30 opacity-30";
                  }

                  return (
                    <label key={key} className={boxClass}>
                      <input
                        type="radio"
                        name={`sim-${q.numar}`}
                        value={key}
                        checked={isSel}
                        disabled={verified}
                        onChange={() => handleSelect(q.numar, key)}
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
                      <span className="text-white/90">{label}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-bg/95 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {!verified ? (
            <>
              <p className="text-sm text-muted">
                {allAnswered
                  ? "Toate întrebările au răspuns."
                  : `${total - answeredCount} întrebări fără răspuns`}
              </p>
              <div className="flex flex-wrap gap-3">
                {!allAnswered && unansweredNums.length > 0 && (
                  <button
                    type="button"
                    onClick={scrollToFirstUnanswered}
                    className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-white hover:bg-elevated"
                  >
                    Prima fără răspuns
                  </button>
                )}
                <button
                  type="button"
                  disabled={!allAnswered}
                  onClick={handleVerify}
                  className="rounded-xl bg-accent px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Verifică toate
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm">
                <span className="font-semibold text-success">{corecte}</span>
                <span className="text-muted"> / {total} corecte ({procent}%)</span>
              </p>
              <div className="flex flex-wrap gap-3">
                {gresite > 0 && (
                  <button
                    type="button"
                    onClick={() => onRetryWrong(results)}
                    className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover"
                  >
                    Reia doar greșite ({gresite})
                  </button>
                )}
                <button
                  type="button"
                  onClick={onExit}
                  className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-white hover:bg-elevated"
                >
                  Înapoi la meniu
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
