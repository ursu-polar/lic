import type { EnrichedQuestion } from "@/lib/types";

/** Normalize text for search: lowercase + fold Romanian diacritics. */
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ăâ]/g, "a")
    .replace(/î/g, "i")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t");
}

type IndexedQuestion = EnrichedQuestion & { normalizedText: string };

let cachedIndex: IndexedQuestion[] | null = null;

function getIndexedQuestions(questions: EnrichedQuestion[]): IndexedQuestion[] {
  if (!cachedIndex) {
    cachedIndex = questions.map((q) => ({
      ...q,
      normalizedText: normalizeForSearch(q.text),
    }));
  }
  return cachedIndex;
}

export function searchQuestions(
  query: string,
  questions: EnrichedQuestion[],
  limit = 8
): EnrichedQuestion[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const indexed = getIndexedQuestions(questions);

  const numMatch = /^\d+$/.test(trimmed);
  if (numMatch) {
    const num = parseInt(trimmed, 10);
    const byNum = indexed.find((q) => q.numar === num);
    if (byNum) return [byNum];
  }

  const normalizedQuery = normalizeForSearch(trimmed);
  const words = normalizedQuery.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const matches = indexed.filter((q) =>
    words.every((word) => q.normalizedText.includes(word))
  );

  return matches.slice(0, limit);
}
