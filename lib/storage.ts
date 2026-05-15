import type { SessionResult } from "@/lib/types";

const STORAGE_KEY = "quiz-licenta-v1";

export type PerQuestionStats = {
  total: number;
  corect: number;
  gresit: number;
};

/** Rezultatul unui test „50 de întrebări” finalizat (pentru istoric). */
export type Test50Session = {
  id: string;
  finishedAt: string;
  total: number;
  corect: number;
  gresit: number;
  /** Câte întrebări din fiecare capitol au intrat în acel test */
  countByChapter: Record<string, number>;
};

export type StoredStateV1 = {
  version: 1;
  perQuestion: Record<string, PerQuestionStats>;
  wrongIds: number[];
  test50Sessions?: Test50Session[];
};

const MAX_TEST50_SESSIONS = 100;

function defaultState(): StoredStateV1 {
  return { version: 1, perQuestion: {}, wrongIds: [], test50Sessions: [] };
}

export function loadState(): StoredStateV1 {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<StoredStateV1>;
    if (parsed.version !== 1) return defaultState();
    const sessionsRaw = parsed.test50Sessions;
    const test50Sessions: Test50Session[] = Array.isArray(sessionsRaw)
      ? sessionsRaw.filter(isValidTest50Session)
      : [];

    return {
      version: 1,
      perQuestion:
        parsed.perQuestion && typeof parsed.perQuestion === "object"
          ? parsed.perQuestion
          : {},
      wrongIds: Array.isArray(parsed.wrongIds)
        ? parsed.wrongIds.filter((x) => typeof x === "number")
        : [],
      test50Sessions,
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state: StoredStateV1): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** `wrong-only` = quiz „Doar greșite” — răspuns corect scoate din listă. */
export type StorageQuizMode = "wrong-only" | "other";

export function recordVerifiedAnswer(
  numar: number,
  isCorrect: boolean,
  mode: StorageQuizMode
): void {
  const s = loadState();
  const key = String(numar);
  const cur = s.perQuestion[key] ?? { total: 0, corect: 0, gresit: 0 };
  cur.total += 1;
  if (isCorrect) cur.corect += 1;
  else cur.gresit += 1;
  s.perQuestion[key] = cur;

  const wrong = new Set(s.wrongIds);
  if (!isCorrect) {
    wrong.add(numar);
  } else if (mode === "wrong-only") {
    wrong.delete(numar);
  }
  s.wrongIds = [...wrong].sort((a, b) => a - b);
  saveState(s);
}

export function getWrongIds(): number[] {
  return loadState().wrongIds;
}

function isValidTest50Session(x: unknown): x is Test50Session {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.finishedAt === "string" &&
    typeof o.total === "number" &&
    typeof o.corect === "number" &&
    typeof o.gresit === "number" &&
    o.countByChapter !== null &&
    typeof o.countByChapter === "object"
  );
}

/** Salvează un test 50 finalizat (apelat o singură dată la Finalizează). */
export function recordTest50Session(results: SessionResult[]): void {
  if (results.length === 0) return;
  const s = loadState();
  const countByChapter: Record<string, number> = {};
  for (const r of results) {
    countByChapter[r.capitol] = (countByChapter[r.capitol] ?? 0) + 1;
  }
  const corect = results.filter((r) => r.isCorrect).length;
  const session: Test50Session = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    finishedAt: new Date().toISOString(),
    total: results.length,
    corect,
    gresit: results.length - corect,
    countByChapter,
  };
  const prev = s.test50Sessions ?? [];
  s.test50Sessions = [session, ...prev].slice(0, MAX_TEST50_SESSIONS);
  saveState(s);
}
