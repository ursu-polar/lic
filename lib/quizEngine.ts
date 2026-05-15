/** Fisher–Yates shuffle (copie nouă). */
export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Eșantion aleatoriu fără repetare (max `n` elemente). */
export function sampleWithoutReplacement<T>(items: T[], n: number): T[] {
  return shuffle(items).slice(0, Math.min(n, items.length));
}
