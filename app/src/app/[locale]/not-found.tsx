import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-4 gap-6">
      <h1 className="text-6xl font-bold text-text-primary">404</h1>
      <p className="text-xl text-text-secondary opacity-70">
        We couldn&apos;t find what you were looking for.
      </p>
      <div className="flex gap-4 mt-4 flex-wrap justify-center">
        <Link
          href="/"
          className="px-6 py-3 bg-accent text-bg-primary rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Home
        </Link>
        <Link
          href="/portfolio"
          className="px-6 py-3 border border-border text-text-primary rounded-lg font-medium hover:border-accent transition-colors"
        >
          Portfolio
        </Link>
      </div>
    </main>
  );
}
