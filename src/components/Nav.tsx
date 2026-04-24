import Link from "next/link";
import { auth } from "@/auth";

export default async function Nav() {
  const session = await auth();
  const isAuthed = !!session?.user;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span
            aria-hidden
            className="inline-block h-7 w-7 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]"
          />
          <span className="text-lg tracking-tight">ComfyMart</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-[var(--color-muted-foreground)] md:flex">
          <a href="#how" className="hover:text-[var(--color-foreground)]">
            How it works
          </a>
          <a href="#features" className="hover:text-[var(--color-foreground)]">
            Features
          </a>
          <a href="#waitlist" className="hover:text-[var(--color-foreground)]">
            Waitlist
          </a>
        </nav>

        {isAuthed ? (
          <Link
            href="/dashboard"
            className="rounded-full bg-[var(--color-foreground)] px-4 py-2 text-sm font-medium text-[var(--color-background)] transition hover:opacity-90"
          >
            Dashboard →
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-[var(--color-muted-foreground)] transition hover:text-[var(--color-foreground)] sm:inline-block"
            >
              Sign in
            </Link>
            <a
              href="#waitlist"
              className="rounded-full bg-[var(--color-foreground)] px-4 py-2 text-sm font-medium text-[var(--color-background)] transition hover:opacity-90"
            >
              Join waitlist
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
