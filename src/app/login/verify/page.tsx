import Link from "next/link";

export default function VerifyRequestPage() {
  return (
    <main className="glow flex min-h-screen items-center justify-center px-6 py-20">
      <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-10 text-center card-shadow">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 font-semibold"
        >
          <span
            aria-hidden
            className="inline-block h-7 w-7 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]"
          />
          <span className="text-lg tracking-tight">ComfyMart</span>
        </Link>

        <h1 className="mt-8 text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          We sent a magic link. Open it on this device to finish signing in.
          The link expires soon — request a new one if needed.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          ← Back to sign in
        </Link>
      </div>
    </main>
  );
}
