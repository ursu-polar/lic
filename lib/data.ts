import type { Capitol, EnrichedQuestion, IntrebariRoot } from "@/lib/types";
import raw from "@/data/intrebari.json";

const data = raw as IntrebariRoot;

let cachedEnriched: EnrichedQuestion[] | null = null;

export function getCapitole(): Capitol[] {
  return data.capitole;
}

/** Toate întrebările, fiecare cu numele capitolului sursă (memoizat). */
export function getAllEnriched(): EnrichedQuestion[] {
  if (!cachedEnriched) {
    cachedEnriched = [];
    for (const c of data.capitole) {
      for (const q of c.intrebari) {
        cachedEnriched.push({ ...q, capitol: c.nume });
      }
    }
  }
  return cachedEnriched;
}

export function getChapterByName(nume: string): Capitol | undefined {
  return data.capitole.find((c) => c.nume === nume);
}
