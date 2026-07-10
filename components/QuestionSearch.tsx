"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getAllEnriched } from "@/lib/data";
import { searchQuestions } from "@/lib/search";
import type { EnrichedQuestion, VariantaKey } from "@/lib/types";

const VARIANTE: VariantaKey[] = ["a", "b", "c", "d"];

export function QuestionSearch() {
  const allQuestions = useMemo(() => getAllEnriched(), []);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<EnrichedQuestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [result, setResult] = useState<EnrichedQuestion | null>(null);
  const [notFound, setNotFound] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    setSuggestions(searchQuestions(query, allQuestions));
  }, [query, allQuestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function performSearch(searchQuery?: string) {
    const q = (searchQuery ?? query).trim();
    if (!q) {
      setResult(null);
      setNotFound(false);
      return;
    }

    const matches = searchQuestions(q, allQuestions, 1);
    if (matches.length > 0) {
      setResult(matches[0]);
      setNotFound(false);
    } else {
      setResult(null);
      setNotFound(true);
    }
    setShowDropdown(false);
  }

  function selectSuggestion(q: EnrichedQuestion) {
    setQuery(q.text);
    setResult(q);
    setNotFound(false);
    setShowDropdown(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    performSearch();
  }

  function resetSearch() {
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    setResult(null);
    setNotFound(false);
  }

  const hasSearchState = query.trim() !== "" || result !== null || notFound;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-medium uppercase tracking-wider text-muted">
        Caută întrebare
      </h2>

      <div ref={containerRef} className="relative">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
              setNotFound(false);
            }}
            onFocus={() => query.trim() && setShowDropdown(true)}
            placeholder="Scrie textul întrebării sau numărul..."
            className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-white placeholder:text-muted/60 focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            autoComplete="off"
            role="combobox"
            aria-expanded={showDropdown && suggestions.length > 0}
            aria-controls="search-suggestions"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Caută
          </button>
          {hasSearchState && (
            <button
              type="button"
              onClick={resetSearch}
              className="shrink-0 rounded-xl border border-border bg-transparent px-4 py-3 text-sm font-medium text-muted transition hover:border-muted hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Reset
            </button>
          )}
        </form>

        {showDropdown && suggestions.length > 0 && (
          <ul
            id="search-suggestions"
            role="listbox"
            className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-elevated shadow-lg shadow-black/40"
          >
            {suggestions.map((q) => (
              <li key={q.numar} role="option" aria-selected={result?.numar === q.numar}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(q)}
                  className="w-full px-4 py-3 text-left transition hover:bg-surface focus:bg-surface focus:outline-none"
                >
                  <span className="flex gap-2 text-sm text-white">
                    <span className="shrink-0 font-medium text-accent">
                      {q.numar}.
                    </span>
                    <span className="line-clamp-2">{q.text}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {notFound && (
        <p className="text-sm text-muted">
          Nu s-a găsit nicio întrebare potrivită.
        </p>
      )}

      {result && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {result.capitol}
          </p>
          <h3 className="mt-2 text-base font-semibold leading-snug text-white sm:text-lg">
            <span className="text-accent">{result.numar}.</span> {result.text}
          </h3>

          <div className="mt-5 flex flex-col gap-2">
            {VARIANTE.map((key) => {
              const isCorrect = key === result.raspuns_corect;
              return (
                <div
                  key={key}
                  className={`rounded-xl border px-4 py-3 text-left text-sm ${
                    isCorrect
                      ? "border-emerald-500/90 bg-emerald-500/35 ring-2 ring-emerald-400/50"
                      : "border-border/50 bg-surface/40 opacity-40"
                  }`}
                >
                  <span
                    className={`font-semibold uppercase ${
                      isCorrect ? "text-emerald-200" : "text-accent"
                    }`}
                  >
                    {key}.
                  </span>{" "}
                  <span className="text-white/90">{result.variante[key]}</span>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-sm text-success">
            Răspuns corect:{" "}
            <span className="font-semibold uppercase">
              {result.raspuns_corect}
            </span>
          </p>
        </div>
      )}
    </section>
  );
}
