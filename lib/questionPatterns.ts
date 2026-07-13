import { getAllEnriched } from "@/lib/data";
import type { EnrichedQuestion, VariantaKey, Variante } from "@/lib/types";

/** Normalize for comparison: trim, lowercase, strip trailing ; or . */
export function normalizeForCompare(text: string): string {
  return text.trim().replace(/[;.]+\s*$/, "").toLowerCase();
}

export type PatternType =
  | "same_question_diff_answer"
  | "same_question_same_answer"
  | "same_answer"
  | "same_variants";

export type PatternQuestion = {
  numar: number;
  capitol: string;
  text: string;
  raspuns_corect: VariantaKey;
  raspunsText: string;
  variante: Variante;
};

export type PatternGroup = {
  id: string;
  type: PatternType;
  severity: "critical" | "warning" | "info";
  title: string;
  hint: string;
  questions: PatternQuestion[];
};

const PATTERN_META: Record<
  PatternType,
  { title: string; severity: PatternGroup["severity"] }
> = {
  same_question_diff_answer: {
    title: "Aceeași întrebare, răspunsuri diferite",
    severity: "critical",
  },
  same_question_same_answer: {
    title: "Întrebări duplicate (identice)",
    severity: "info",
  },
  same_answer: {
    title: "Același răspuns corect, întrebări diferite",
    severity: "warning",
  },
  same_variants: {
    title: "Aceleași variante, întrebări diferite",
    severity: "warning",
  },
};

function toPatternQuestion(q: EnrichedQuestion): PatternQuestion {
  return {
    numar: q.numar,
    capitol: q.capitol,
    text: q.text,
    raspuns_corect: q.raspuns_corect,
    raspunsText: q.variante[q.raspuns_corect],
    variante: q.variante,
  };
}

function variantSetKey(variante: Variante): string {
  return (["a", "b", "c", "d"] as const)
    .map((k) => normalizeForCompare(variante[k]))
    .join("|||");
}

function buildHint(type: PatternType, questions: PatternQuestion[]): string {
  switch (type) {
    case "same_question_diff_answer":
      return (
        "Atenție: formularea este identică, dar variantele și răspunsul corect diferă. " +
        "La examen, identifică întrebarea după număr sau citește variantele afișate — " +
        "nu te baza doar pe textul întrebării."
      );
    case "same_question_same_answer":
      return (
        "Întrebări duplicate din bancă — oricare variantă are același răspuns corect " +
        `(${questions[0].raspuns_corect.toUpperCase()}).`
      );
    case "same_answer": {
      const generic =
        questions.some((q) =>
          /toate variantele|niciun răspuns/i.test(q.raspunsText)
        );
      if (generic) {
        return (
          "Răspuns generic („toate variantele” / „niciun răspuns”) — memorează-l " +
          "pentru fiecare întrebare în parte, nu doar pentru textul răspunsului."
        );
      }
      return (
        "Același text de răspuns, dar întrebări diferite — asociază răspunsul cu " +
        "formularea completă a întrebării, nu doar cu cuvintele cheie din răspuns."
      );
    }
    case "same_variants": {
      const letters = [...new Set(questions.map((q) => q.raspuns_corect))];
      if (letters.length > 1) {
        const mapping = questions
          .map(
            (q) =>
              `#${q.numar} → ${q.raspuns_corect.toUpperCase()}`
          )
          .join(", ");
        return (
          "Capcană frecventă: aceleași 4 variante, dar litera corectă se schimbă. " +
          `Mapare: ${mapping}. Citește cu atenție subiectul întrebării.`
        );
      }
      return (
        "Variantele sunt identice; răspunsul corect este același, dar subiectul " +
        "întrebării diferă — verifică formularea completă."
      );
    }
    default:
      return "";
  }
}

function groupBy<T>(
  items: T[],
  keyFn: (item: T) => string
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const list = map.get(key);
    if (list) list.push(item);
    else map.set(key, [item]);
  }
  return map;
}

let cachedPatterns: PatternGroup[] | null = null;

export function getQuestionPatterns(): PatternGroup[] {
  if (cachedPatterns) return cachedPatterns;

  const all = getAllEnriched();
  const groups: PatternGroup[] = [];
  let groupId = 0;

  const byQuestion = groupBy(all, (q) => normalizeForCompare(q.text));
  for (const [, qs] of byQuestion) {
    if (qs.length < 2) continue;
    const answers = new Set(
      qs.map((q) => normalizeForCompare(q.variante[q.raspuns_corect]))
    );
    const type: PatternType =
      answers.size === 1
        ? "same_question_same_answer"
        : "same_question_diff_answer";
    const meta = PATTERN_META[type];
    const questions = qs.map(toPatternQuestion);
    groups.push({
      id: `q-${++groupId}`,
      type,
      severity: meta.severity,
      title: meta.title,
      hint: buildHint(type, questions),
      questions,
    });
  }

  const byAnswer = groupBy(all, (q) =>
    normalizeForCompare(q.variante[q.raspuns_corect])
  );
  for (const [, qs] of byAnswer) {
    if (qs.length < 2) continue;
    const texts = new Set(qs.map((q) => normalizeForCompare(q.text)));
    if (texts.size < 2) continue;
    const meta = PATTERN_META.same_answer;
    const questions = qs.map(toPatternQuestion);
    groups.push({
      id: `a-${++groupId}`,
      type: "same_answer",
      severity: meta.severity,
      title: meta.title,
      hint: buildHint("same_answer", questions),
      questions,
    });
  }

  const byVariants = groupBy(all, (q) => variantSetKey(q.variante));
  for (const [, qs] of byVariants) {
    if (qs.length < 2) continue;
    const texts = new Set(qs.map((q) => normalizeForCompare(q.text)));
    if (texts.size < 2) continue;
    const meta = PATTERN_META.same_variants;
    const questions = qs.map(toPatternQuestion);
    groups.push({
      id: `v-${++groupId}`,
      type: "same_variants",
      severity: meta.severity,
      title: meta.title,
      hint: buildHint("same_variants", questions),
      questions,
    });
  }

  const severityOrder = { critical: 0, warning: 1, info: 2 };
  groups.sort((a, b) => {
    const sd = severityOrder[a.severity] - severityOrder[b.severity];
    if (sd !== 0) return sd;
    return b.questions.length - a.questions.length;
  });

  cachedPatterns = groups;
  return groups;
}

export function getPatternSummary(): {
  totalGroups: number;
  critical: number;
  warning: number;
  info: number;
  affectedQuestions: number;
} {
  const patterns = getQuestionPatterns();
  const nums = new Set<number>();
  for (const g of patterns) {
    for (const q of g.questions) nums.add(q.numar);
  }
  return {
    totalGroups: patterns.length,
    critical: patterns.filter((p) => p.severity === "critical").length,
    warning: patterns.filter((p) => p.severity === "warning").length,
    info: patterns.filter((p) => p.severity === "info").length,
    affectedQuestions: nums.size,
  };
}
