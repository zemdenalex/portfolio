import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-4 gap-6">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-xl opacity-70">Page not found.</p>
      <Link
        href="/en"
        className="px-6 py-3 border border-border rounded-lg font-medium hover:opacity-90 transition-opacity"
      >
        Home
      </Link>
    </main>
  );
}
