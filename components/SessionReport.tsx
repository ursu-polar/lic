"use client";

import type { SessionResult } from "@/lib/types";

type Props = {
  results: SessionResult[];
  title: string;
  onHome: () => void;
};

export function SessionReport({ results, title, onHome }: Props) {
  const corecte = results.filter((r) => r.isCorrect).length;
  const total = results.length;
  const procent =
    total === 0 ? 0 : Math.round((corecte / total) * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-white">Raport sesiune</h1>
      <p className="mt-1 text-muted">{title}</p>
      <p className="mt-4 text-lg">
        <span className="font-semibold text-success">{corecte}</span>
        <span className="text-muted"> / {total} corecte </span>
        <span className="text-muted">({procent}%)</span>
      </p>

      <ul className="mt-8 flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-1">
        {results.map((r, i) => (
          <li
            key={i}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                #{r.numar}
              </span>
              <span
                className={
                  r.isCorrect ? "text-sm font-medium text-success" : "text-sm font-medium text-danger"
                }
              >
                {r.isCorrect ? "Corect" : "Greșit"}
              </span>
            </div>
            <p
              className="mt-1 line-clamp-2 text-[0.65rem] leading-snug text-muted/55"
              title={r.capitol}
            >
              {r.capitol}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/90">{r.text}</p>
            <div className="mt-3 grid gap-1 text-xs text-muted sm:grid-cols-2">
              <p>
                <span className="text-white/60">Răspunsul tău: </span>
                <span className="font-medium uppercase text-white">
                  {r.selected}
                </span>
              </p>
              <p>
                <span className="text-white/60">Răspuns corect: </span>
                <span className="font-medium uppercase text-success">
                  {r.raspuns_corect}
                </span>
              </p>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onHome}
        className="mt-10 w-full rounded-xl bg-accent py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto sm:px-10"
      >
        Înapoi la meniu
      </button>
    </div>
  );
}
