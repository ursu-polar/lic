"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllEnriched } from "@/lib/data";
import { getProgressSummary, type ProgressSummary } from "@/lib/progress";

type Props = {
  statsVersion: number;
};

export function HomeProgressSummary({ statsVersion }: Props) {
  const total = useMemo(() => getAllEnriched().length, []);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);

  useEffect(() => {
    setSummary(getProgressSummary());
  }, [statsVersion]);

  const attempted = summary?.attempted ?? 0;
  const pctAttempted = summary?.pctAttempted ?? 0;
  const overallRate = summary?.overallRate ?? null;
  const weakestChapter = summary?.weakestChapter ?? null;

  return (
    <section className="rounded-xl border border-border bg-surface/80 px-5 py-4">
      <p className="text-sm text-white">
        Ai răspuns la{" "}
        <strong className="font-semibold text-accent">{attempted}</strong>
        <span className="text-muted"> / {total} întrebări</span>
        <span className="text-muted"> ({pctAttempted}%)</span>
      </p>

      {overallRate !== null && (
        <p className="mt-1.5 text-sm text-muted">
          Rată globală:{" "}
          <span className="font-medium text-success">{overallRate}%</span>{" "}
          corecte
        </p>
      )}

      {weakestChapter && (
        <p
          className="mt-1.5 line-clamp-2 text-sm text-muted"
          title={weakestChapter.name}
        >
          Capitol slab:{" "}
          <span className="font-medium text-white/90">
            {weakestChapter.name}
          </span>{" "}
          <span>({weakestChapter.rate}%)</span>
        </p>
      )}

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={attempted}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Progres întrebări exersate"
      >
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${pctAttempted}%` }}
        />
      </div>
    </section>
  );
}
