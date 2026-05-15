import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Quiz licență",
  description: "Despre autor",
};

export default function AboutPage() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-white">About</h1>
      <p className="mt-8 text-lg text-white/90">
        <span className="text-muted">Author:</span>{" "}
        <span className="font-medium">Ursu Polar</span>
      </p>
      <p className="mt-6">
        <a
          href="https://iamawesome.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline decoration-accent/40 underline-offset-4 transition hover:text-accent-hover hover:decoration-accent"
        >
          https://iamawesome.com/
        </a>
      </p>
      <Link
        href="/"
        className="mt-14 rounded-full border border-border px-6 py-2.5 text-sm font-medium text-muted transition hover:border-muted hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        ← Înapoi la meniu
      </Link>
    </div>
  );
}
