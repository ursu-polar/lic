import { getAllEnriched } from "@/lib/data";
import type { Capitol, EnrichedQuestion } from "@/lib/types";
import { shuffle } from "@/lib/quizEngine";

/** Largest-remainder allocation, capped per chapter size. */
function allocateProportionalWithCaps(
  chapterSizes: number[],
  total: number
): number[] {
  const weightSum = chapterSizes.reduce((a, b) => a + b, 0);
  if (weightSum === 0) return chapterSizes.map(() => 0);

  const exact = chapterSizes.map((w) => (total * w) / weightSum);
  const allocation = exact.map((e, i) =>
    Math.min(Math.floor(e), chapterSizes[i])
  );

  let current = allocation.reduce((a, b) => a + b, 0);
  const remainders = exact
    .map((e, i) => ({ i, fraction: e - Math.floor(e) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (const { i } of remainders) {
    if (current >= total) break;
    if (allocation[i] < chapterSizes[i]) {
      allocation[i]++;
      current++;
    }
  }

  while (current < total) {
    let best = -1;
    let bestRoom = 0;
    for (let i = 0; i < chapterSizes.length; i++) {
      const room = chapterSizes[i] - allocation[i];
      if (room > bestRoom) {
        bestRoom = room;
        best = i;
      }
    }
    if (best === -1) break;
    allocation[best]++;
    current++;
  }

  return allocation;
}

/** Pick up to `n` items, prioritising questions not yet seen. */
export function sampleWithUnseenPriority<T extends { numar: number }>(
  items: T[],
  n: number,
  seenNums: Set<number>
): T[] {
  if (n <= 0 || items.length === 0) return [];

  const unseen = shuffle(items.filter((q) => !seenNums.has(q.numar)));
  const seen = shuffle(items.filter((q) => seenNums.has(q.numar)));
  return [...unseen, ...seen].slice(0, Math.min(n, items.length));
}

/** 45 random questions, unseen first. */
export function buildTest45(
  seenNums: Set<number>,
  n = 45
): EnrichedQuestion[] {
  const picked = sampleWithUnseenPriority(getAllEnriched(), n, seenNums);
  return shuffle(picked);
}

/** 45 questions proportional to chapter sizes, unseen first per chapter. */
export function buildTest45Proportional(
  capitole: Capitol[],
  seenNums: Set<number>,
  n = 45
): EnrichedQuestion[] {
  const sizes = capitole.map((c) => c.intrebari.length);
  const targets = allocateProportionalWithCaps(sizes, n);

  const picked: EnrichedQuestion[] = [];
  const pickedNums = new Set<number>();

  for (let i = 0; i < capitole.length; i++) {
    const cap = capitole[i];
    const pool: EnrichedQuestion[] = cap.intrebari.map((q) => ({
      ...q,
      capitol: cap.nume,
    }));
    const available = pool.filter((q) => !pickedNums.has(q.numar));
    const sample = sampleWithUnseenPriority(
      available,
      targets[i],
      seenNums
    );
    for (const q of sample) {
      picked.push(q);
      pickedNums.add(q.numar);
    }
  }

  if (picked.length < n) {
    const remaining = getAllEnriched().filter((q) => !pickedNums.has(q.numar));
    const extra = sampleWithUnseenPriority(remaining, n - picked.length, seenNums);
    for (const q of extra) {
      picked.push(q);
      pickedNums.add(q.numar);
    }
  }

  return shuffle(picked.slice(0, n));
}
