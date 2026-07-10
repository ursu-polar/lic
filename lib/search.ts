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

export type HighlightSegment = { text: string; highlight: boolean };

/** Normalized query words for highlighting (empty for numeric-only queries). */
export function getSearchWords(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed || /^\d+$/.test(trimmed)) return [];
  return normalizeForSearch(trimmed).split(/\s+/).filter(Boolean);
}

/** Split text into segments, marking chars that match any query word. */
export function getHighlightSegments(
  text: string,
  words: string[]
): HighlightSegment[] {
  if (words.length === 0) return [{ text, highlight: false }];

  const normalized = normalizeForSearch(text);
  const ranges: Array<[number, number]> = [];

  for (const word of words) {
    let start = 0;
    while (start <= normalized.length - word.length) {
      const idx = normalized.indexOf(word, start);
      if (idx === -1) break;
      ranges.push([idx, idx + word.length]);
      start = idx + word.length;
    }
  }

  if (ranges.length === 0) return [{ text, highlight: false }];

  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const [s, e] of ranges) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) {
      last[1] = Math.max(last[1], e);
    } else {
      merged.push([s, e]);
    }
  }

  const segments: HighlightSegment[] = [];
  let pos = 0;
  for (const [s, e] of merged) {
    if (pos < s) segments.push({ text: text.slice(pos, s), highlight: false });
    segments.push({ text: text.slice(s, e), highlight: true });
    pos = e;
  }
  if (pos < text.length) {
    segments.push({ text: text.slice(pos), highlight: false });
  }
  return segments;
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
  limit?: number
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

  return limit !== undefined ? matches.slice(0, limit) : matches;
}
