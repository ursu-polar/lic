"use client";

import { useMemo, useState } from "react";
import {
  getPatternSummary,
  getQuestionPatterns,
  type PatternGroup,
  type PatternType,
} from "@/lib/questionPatterns";
import type { VariantaKey } from "@/lib/types";

type Props = {
  onBack: () => void;
};

type FilterType = "all" | PatternType;

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: "all", label: "Toate" },
  { key: "same_question_diff_answer", label: "Întrebare identică" },
  { key: "same_variants", label: "Variante identice" },
  { key: "same_answer", label: "Răspuns identic" },
  { key: "same_question_same_answer", label: "Duplicate" },
];

const severityBadge: Record<
  PatternGroup["severity"],
  { label: string; className: string }
> = {
  critical: {
    label: "Critic",
    className: "border-danger/50 bg-danger/10 text-danger",
  },
  warning: {
    label: "Atenție",
    className: "border-amber-500/50 bg-amber-500/10 text-amber-400",
  },
  info: {
    label: "Info",
    className: "border-border bg-elevated/60 text-muted",
  },
};

const detailsClass =
  "group rounded-xl border border-border bg-surface open:ring-1 open:ring-accent/30";
const summaryClass =
  "flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden";

function VariantList({
  variante,
  correct,
}: {
  variante: Record<VariantaKey, string>;
  correct: VariantaKey;
}) {
  return (
    <ul className="mt-2 flex flex-col gap-1.5 text-sm">
      {(["a", "b", "c", "d"] as const).map((k) => (
        <li
          key={k}
          className={
            k === correct
              ? "rounded-lg border border-success/40 bg-success/10 px-3 py-1.5 text-white/95"
              : "rounded-lg border border-border/50 bg-bg/50 px-3 py-1.5 text-white/75"
          }
        >
          <span
            className={
              k === correct
                ? "mr-2 font-semibold uppercase text-success"
                : "mr-2 font-medium uppercase text-muted"
            }
          >
            {k}
          </span>
          {variante[k]}
        </li>
      ))}
    </ul>
  );
}

function PatternGroupCard({ group }: { group: PatternGroup }) {
  const badge = severityBadge[group.severity];
  const sharedAnswer =
    group.type === "same_answer" ? group.questions[0].raspunsText : null;
  const sharedVariants =
    group.type === "same_variants" ? group.questions[0].variante : null;

  return (
    <details className={detailsClass}>
      <summary className={summaryClass}>
        <div className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${badge.className}`}
            >
              {badge.label}
            </span>
            <span className="text-sm font-medium text-white">{group.title}</span>
            <span className="text-xs text-muted">
              {group.questions.length} întrebări
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted line-clamp-2">
            {group.hint}
          </p>
        </div>
        <span
          className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        >
          ▼
        </span>
      </summary>

      <div className="space-y-4 border-t border-border px-4 pb-4 pt-3">
        <p className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-sm leading-relaxed text-white/90">
          {group.hint}
        </p>

        {sharedAnswer && (
          <div className="rounded-lg border border-border bg-elevated/40 px-3 py-2 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Răspuns comun
            </span>
            <p className="mt-1 text-white/90">{sharedAnswer}</p>
          </div>
        )}

        {sharedVariants && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Variante comune (litera corectă diferă)
            </p>
            <VariantList
              variante={sharedVariants}
              correct={group.questions[0].raspuns_corect}
            />
          </div>
        )}

        <div className="flex flex-col gap-3">
          {group.questions.map((q) => (
            <div
              key={q.numar}
              className="rounded-xl border border-border bg-elevated/30 p-3"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-xs text-accent">#{q.numar}</span>
                <span className="text-xs text-muted">{q.capitol}</span>
                <span className="ml-auto rounded-md border border-success/40 bg-success/10 px-2 py-0.5 text-xs font-semibold uppercase text-success">
                  {q.raspuns_corect}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/90">{q.text}</p>
              {(group.type === "same_question_diff_answer" ||
                group.type === "same_question_same_answer") && (
                <VariantList variante={q.variante} correct={q.raspuns_corect} />
              )}
              {group.type === "same_answer" && (
                <p className="mt-2 text-sm text-white/80">
                  <span className="font-semibold uppercase text-success">
                    {q.raspuns_corect}
                  </span>
                  <span className="text-muted"> — </span>
                  {q.raspunsText}
                </p>
              )}
              {group.type === "same_variants" && (
                <p className="mt-2 text-sm">
                  <span className="text-muted">Răspuns corect: </span>
                  <span className="font-semibold uppercase text-success">
                    {q.raspuns_corect}
                  </span>
                  <span className="text-muted"> — </span>
                  <span className="text-white/80">{q.raspunsText}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}

export function QuestionPatternsReport({ onBack }: Props) {
  const [filter, setFilter] = useState<FilterType>("all");

  const { patterns, summary } = useMemo(() => {
    const all = getQuestionPatterns();
    return {
      patterns: all,
      summary: getPatternSummary(),
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return patterns;
    return patterns.filter((p) => p.type === filter);
  }, [patterns, filter]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Capcane &amp; pattern-uri
          </h1>
          <p className="mt-1 text-sm text-muted">
            Grupuri de întrebări cu formulări sau răspunsuri similare. Ignoră
            diferențele de punctuație finală (; sau .).
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-border px-5 py-2 text-sm font-medium text-muted transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Înapoi
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 rounded-xl border border-border bg-elevated/50 px-4 py-3 text-sm">
        <span className="text-white/90">
          <strong className="text-accent">{summary.totalGroups}</strong> grupuri
        </span>
        <span className="text-danger">
          {summary.critical} critice
        </span>
        <span className="text-amber-400">
          {summary.warning} atenție
        </span>
        <span className="text-muted">
          {summary.affectedQuestions} întrebări afectate
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition hover:text-white ${
              filter === key
                ? "border-accent text-accent"
                : "border-border text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center text-sm text-muted">
          Niciun grup în această categorie.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {filtered.map((group) => (
            <PatternGroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
