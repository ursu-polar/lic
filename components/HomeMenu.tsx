"use client";

import Link from "next/link";
import { HomeProgressSummary } from "@/components/HomeProgressSummary";
import { QuestionSearch } from "@/components/QuestionSearch";
import type { PausedSession } from "@/lib/storage";
import type { Capitol } from "@/lib/types";

type Props = {
  capitole: Capitol[];
  wrongCount: number;
  statsVersion: number;
  pausedSession: PausedSession | null;
  onChapter: (capitol: Capitol) => void;
  onRandom: () => void;
  onTest50: () => void;
  onWrongOnly: () => void;
  onResumeSession: () => void;
  onGlobalStats: () => void;
};

export function HomeMenu({
  capitole,
  wrongCount,
  statsVersion,
  pausedSession,
  onChapter,
  onRandom,
  onTest50,
  onWrongOnly,
  onResumeSession,
  onGlobalStats,
}: Props) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-12">
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Quiz licență
        </h1>
        <p className="mt-3 text-muted">
          Răspunsurile și statisticile sunt salvate doar în browserul tău
          (localStorage).
        </p>
      </header>

      <QuestionSearch />

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted">
          Moduri rapide
        </h2>
        {pausedSession && (
          <button
            type="button"
            onClick={onResumeSession}
            className="rounded-xl border border-accent bg-accent/10 px-5 py-3.5 text-left font-medium text-white transition hover:bg-accent/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Continuă sesiunea
            <span className="mt-1 block text-sm font-normal text-muted">
              {pausedSession.title} · întrebarea{" "}
              {Math.min(
                pausedSession.index + 1,
                pausedSession.questionNums.length
              )}{" "}
              / {pausedSession.questionNums.length}
            </span>
          </button>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={onRandom}
            className="rounded-xl border border-border bg-elevated px-5 py-3.5 text-left font-medium text-white transition hover:border-accent hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Random
            <span className="mt-1 block text-sm font-normal text-muted">
              Toate întrebările, ordine aleatoare
            </span>
          </button>
          <button
            type="button"
            onClick={onTest50}
            className="rounded-xl border border-border bg-elevated px-5 py-3.5 text-left font-medium text-white transition hover:border-accent hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Generează test 45
            <span className="mt-1 block text-sm font-normal text-muted">
              45 întrebări aleatoare
            </span>
          </button>
          <button
            type="button"
            onClick={onWrongOnly}
            disabled={wrongCount === 0}
            title={
              wrongCount === 0
                ? "Nu ai întrebări marcate greșite încă"
                : `${wrongCount} întrebări în listă`
            }
            className="rounded-xl border border-border bg-elevated px-5 py-3.5 text-left font-medium text-white transition hover:border-accent hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            Doar greșite
            <span className="mt-1 block text-sm font-normal text-muted">
              {wrongCount === 0
                ? "Lista e goală"
                : `${wrongCount} întrebări în listă`}
            </span>
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted">
          Capitole
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {capitole.map((c) => (
            <button
              key={c.nume}
              type="button"
              onClick={() => onChapter(c)}
              title={c.nume}
              className="rounded-xl border border-border bg-surface px-4 py-3 text-left text-sm font-medium text-white transition hover:border-accent/60 hover:bg-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="line-clamp-2">{c.nume}</span>
              <span className="mt-1 block text-xs font-normal text-muted">
                {c.intrebari.length} întrebări
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onGlobalStats}
          className="rounded-full border border-border bg-transparent px-6 py-2.5 text-sm font-medium text-muted transition hover:border-muted hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Statistici globale (toate întrebările)
        </button>
      </div>

      <div className="flex justify-center pt-2">
        <Link
          href="/about"
          className="rounded-full border border-border bg-transparent px-6 py-2.5 text-sm font-medium text-muted transition hover:border-muted hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          About
        </Link>
      </div>

      <HomeProgressSummary statsVersion={statsVersion} />
    </div>
  );
}
