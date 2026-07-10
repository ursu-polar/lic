import { getAllEnriched, getCapitole } from "@/lib/data";
import { loadState } from "@/lib/storage";

export type ProgressSummary = {
  attempted: number;
  total: number;
  pctAttempted: number;
  overallRate: number | null;
  weakestChapter: { name: string; rate: number } | null;
};

export function getProgressSummary(): ProgressSummary {
  const all = getAllEnriched();
  const capitole = getCapitole();
  const st = loadState();

  let attempted = 0;
  let totalAnswers = 0;
  let correctAnswers = 0;

  for (const q of all) {
    const s = st.perQuestion[String(q.numar)];
    if (s && s.total > 0) {
      attempted++;
      totalAnswers += s.total;
      correctAnswers += s.corect;
    }
  }

  const overallRate =
    totalAnswers > 0
      ? Math.round((correctAnswers / totalAnswers) * 100)
      : null;

  const pctAttempted =
    all.length === 0 ? 0 : Math.round((attempted / all.length) * 100);

  let weakestChapter: ProgressSummary["weakestChapter"] = null;

  for (const cap of capitole) {
    let chTotal = 0;
    let chCorrect = 0;
    let chAttempted = 0;

    for (const q of cap.intrebari) {
      const s = st.perQuestion[String(q.numar)];
      if (s && s.total > 0) {
        chAttempted++;
        chTotal += s.total;
        chCorrect += s.corect;
      }
    }

    if (chAttempted === 0) continue;

    const rate = Math.round((chCorrect / chTotal) * 100);
    if (
      !weakestChapter ||
      rate < weakestChapter.rate ||
      (rate === weakestChapter.rate && cap.nume < weakestChapter.name)
    ) {
      weakestChapter = { name: cap.nume, rate };
    }
  }

  return {
    attempted,
    total: all.length,
    pctAttempted,
    overallRate,
    weakestChapter,
  };
}
