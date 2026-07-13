export type VariantaKey = "a" | "b" | "c" | "d";

export type Variante = Record<VariantaKey, string>;

export type Intrebare = {
  numar: number;
  text: string;
  variante: Variante;
  raspuns_corect: VariantaKey;
};

export type Capitol = {
  nume: string;
  intrebari: Intrebare[];
};

export type IntrebariRoot = {
  capitole: Capitol[];
};

export type EnrichedQuestion = Intrebare & { capitol: string };

export type QuizMode =
  | "chapter"
  | "random"
  | "test50"
  | "test45-uniq"
  | "simulation45"
  | "wrong-only";

export type SessionResult = {
  numar: number;
  capitol: string;
  text: string;
  selected: VariantaKey;
  raspuns_corect: VariantaKey;
  isCorrect: boolean;
};
