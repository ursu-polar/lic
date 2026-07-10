"use client";

import { useMemo, useState } from "react";
import { getAllEnriched, getCapitole } from "@/lib/data";
import { loadState, type Test50Session } from "@/lib/storage";

type SortKey = "numar" | "total" | "corect" | "gresit" | "rata";

type QuestionRow = {
  numar: number;
  capitol: string;
  total: number;
  corect: number;
  gresit: number;
  rata: number | null;
};

type Props = {
  statsVersion: number;
  onBack: () => void;
};

function formatRoDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ro-RO", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function sortQuestionRows(
  rows: QuestionRow[],
  sortKey: SortKey,
  sortAsc: boolean
): QuestionRow[] {
  const copy = [...rows];
  const dir = sortAsc ? 1 : -1;
  copy.sort((a, b) => {
    let va: string | number = 0;
    let vb: string | number = 0;
    switch (sortKey) {
      case "numar":
        va = a.numar;
        vb = b.numar;
        break;
      case "total":
        va = a.total;
        vb = b.total;
        break;
      case "corect":
        va = a.corect;
        vb = b.corect;
        break;
      case "gresit":
        va = a.gresit;
        vb = b.gresit;
        break;
      case "rata":
        va = a.rata ?? -1;
        vb = b.rata ?? -1;
        break;
      default:
        break;
    }
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });
  return copy;
}

const detailsClass =
  "group rounded-xl border border-border bg-surface open:ring-1 open:ring-accent/30";
const summaryClass =
  "flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden";

export function GlobalStatsReport({ statsVersion, onBack }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("numar");
  const [sortAsc, setSortAsc] = useState(true);

  const { allRows, capitole, test50Sessions, test50Summary } = useMemo(() => {
    void statsVersion;
    const all = getAllEnriched();
    const caps = getCapitole();
    const st = loadState();
    const rows: QuestionRow[] = all.map((q) => {
      const s = st.perQuestion[String(q.numar)] ?? {
        total: 0,
        corect: 0,
        gresit: 0,
      };
      const rata = s.total === 0 ? null : Math.round((s.corect / s.total) * 100);
      return {
        numar: q.numar,
        capitol: q.capitol,
        total: s.total,
        corect: s.corect,
        gresit: s.gresit,
        rata,
      };
    });
    const sessions = st.test50Sessions ?? [];
    let test50Summary: { count: number; avgPct: number } | null = null;
    if (sessions.length > 0) {
      const avgPct = Math.round(
        sessions.reduce((acc, s) => acc + (s.corect / Math.max(s.total, 1)) * 100, 0) /
          sessions.length
      );
      test50Summary = { count: sessions.length, avgPct };
    }
    return {
      allRows: rows,
      capitole: caps,
      test50Sessions: sessions,
      test50Summary,
    };
  }, [statsVersion]);

  const rowsByChapter = useMemo(() => {
    const map = new Map<string, QuestionRow[]>();
    for (const c of capitole) {
      map.set(c.nume, []);
    }
    for (const r of allRows) {
      const list = map.get(r.capitol);
      if (list) list.push(r);
    }
    return map;
  }, [allRows, capitole]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((x) => !x);
    else {
      setSortKey(key);
      setSortAsc(key === "numar");
    }
  }

  function chapterSummary(rows: QuestionRow[]): string {
    const withAnswers = rows.filter((r) => r.total > 0).length;
    const sumT = rows.reduce((a, r) => a + r.total, 0);
    const sumC = rows.reduce((a, r) => a + r.corect, 0);
    const pct = sumT === 0 ? null : Math.round((sumC / sumT) * 100);
    return `${rows.length} întrebări · ${withAnswers} cu răspunsuri · ${sumT} verificări${pct !== null ? ` · ${pct}% corect` : ""}`;
  }

  function chapterBreakdownLines(sess: Test50Session): { name: string; count: number }[] {
    return Object.entries(sess.countByChapter)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Statistici globale</h1>
          <p className="mt-1 text-sm text-muted">
            Răspunsuri înregistrate la Verifică, grupate pe capitole. Istoric pentru testele
            de 45 de întrebări.
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

      {/* Teste 45 */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Teste „45 de întrebări”</h2>
        <p className="mt-1 text-sm text-muted">
          După fiecare test finalizat, se salvează componența pe capitole (câte întrebări au
          intrat în acel set de 45).
        </p>

        {test50Sessions.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center text-sm text-muted">
            Încă nu ai finalizat niciun test 45. Folosește „Generează test 45” din meniu.
          </p>
        ) : (
          <>
            {test50Summary && (
              <div className="mt-4 flex flex-wrap gap-4 rounded-xl border border-border bg-elevated/50 px-4 py-3 text-sm">
                <span className="text-white/90">
                  <strong className="text-accent">{test50Summary.count}</strong> teste finalizate
                </span>
                <span className="text-muted">
                  Medie scor per test:{" "}
                  <strong className="text-success">{test50Summary.avgPct}%</strong> corecte
                </span>
              </div>
            )}
            <div className="mt-4 flex flex-col gap-2">
              {test50Sessions.map((sess) => {
                const pct = Math.round((sess.corect / Math.max(sess.total, 1)) * 100);
                const lines = chapterBreakdownLines(sess);
                return (
                  <details key={sess.id} className={detailsClass}>
                    <summary className={summaryClass}>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">
                          {formatRoDateTime(sess.finishedAt)}
                        </p>
                        <p className="mt-0.5 text-sm text-muted">
                          <span className="text-success">{sess.corect}</span>
                          <span className="text-muted"> / {sess.total} corecte</span>
                          <span className="text-muted"> · {pct}%</span>
                          <span className="text-muted"> · {lines.length} capitole reprezentate</span>
                        </p>
                      </div>
                      <span
                        className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
                        aria-hidden
                      >
                        ▼
                      </span>
                    </summary>
                    <div className="border-t border-border px-4 pb-4 pt-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted">
                        Întrebări din fiecare capitol (în acest test)
                      </p>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {lines.map(({ name, count }) => (
                          <li
                            key={name}
                            className="rounded-lg border border-border bg-bg/80 px-3 py-1.5 text-sm"
                          >
                            <span className="font-medium text-white/90" title={name}>
                              {name.length > 42 ? `${name.slice(0, 40)}…` : name}
                            </span>
                            <span className="ml-2 tabular-nums text-accent">{count}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* După capitol */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold text-white">Statistici pe capitole</h2>
        <p className="mt-1 text-sm text-muted">
          Deschide un capitol pentru tabelul cu toate întrebările și numărul de verificări
          corecte / greșite.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
          <span>Sortare tabel (aceeași pentru toate capitolele):</span>
          {(
            [
              ["numar", "Nr"],
              ["total", "Răspunsuri"],
              ["corect", "Corect"],
              ["gresit", "Greșit"],
              ["rata", "Rată %"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleSort(key)}
              className={`rounded-full border px-2.5 py-1 transition hover:text-white ${
                sortKey === key ? "border-accent text-accent" : "border-border"
              }`}
            >
              {label}
              {sortKey === key && (sortAsc ? " ↑" : " ↓")}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {capitole.map((cap) => {
            const rawRows = rowsByChapter.get(cap.nume) ?? [];
            const sorted = sortQuestionRows(rawRows, sortKey, sortAsc);
            return (
              <details key={cap.nume} className={detailsClass}>
                <summary className={summaryClass}>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-medium text-white">{cap.nume}</p>
                    <p className="mt-0.5 text-sm text-muted">{chapterSummary(rawRows)}</p>
                  </div>
                  <span
                    className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
                    aria-hidden
                  >
                    ▼
                  </span>
                </summary>
                <div className="overflow-x-auto border-t border-border">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="bg-elevated/60">
                        <th className="p-2.5 font-medium text-muted">Nr</th>
                        <th className="p-2.5 text-right font-medium text-muted">Răspunsuri</th>
                        <th className="p-2.5 text-right font-medium text-muted">Corect</th>
                        <th className="p-2.5 text-right font-medium text-muted">Greșit</th>
                        <th className="p-2.5 text-right font-medium text-muted">Rată</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((r) => (
                        <tr
                          key={r.numar}
                          className="border-t border-border/50 hover:bg-elevated/40"
                        >
                          <td className="p-2.5 font-mono text-xs text-muted">{r.numar}</td>
                          <td className="p-2.5 text-right tabular-nums text-white/90">
                            {r.total}
                          </td>
                          <td className="p-2.5 text-right tabular-nums text-success">
                            {r.corect}
                          </td>
                          <td className="p-2.5 text-right tabular-nums text-danger">
                            {r.gresit}
                          </td>
                          <td className="p-2.5 text-right tabular-nums text-muted">
                            {r.rata === null ? "—" : `${r.rata}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}
