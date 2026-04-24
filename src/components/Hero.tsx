export default function Hero() {
  return (
    <section className="glow relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1 text-xs font-medium text-[var(--color-muted-foreground)] card-shadow">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            Project #12 — now in private beta
          </span>
          <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight md:text-6xl lg:text-7xl">
            Marketing on{" "}
            <span className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
              autopilot.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-[var(--color-muted-foreground)] md:text-xl">
            Plug any project in. ComfyMart&apos;s AI writes, schedules, posts,
            and optimizes your entire campaign — social, email, content, SEO.
            Set it and forget it.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#waitlist"
              className="rounded-full bg-[var(--color-foreground)] px-6 py-3 text-sm font-medium text-[var(--color-background)] transition hover:opacity-90"
            >
              Join the waitlist
            </a>
            <a
              href="#how"
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-6 py-3 text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-muted)]"
            >
              See how it works →
            </a>
          </div>
        </div>

        <div className="relative mx-auto mt-16 max-w-3xl">
          <div className="rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-card)] to-[var(--color-muted)]/50 p-10 card-shadow md:p-14">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {["Social", "Email", "Content", "SEO", "Community"].map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-sm font-medium"
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-center">
              <div className="h-px w-16 bg-[var(--color-border)]" />
              <span className="mx-3 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white">
                AI
              </span>
              <div className="h-px w-16 bg-[var(--color-border)]" />
            </div>
            <p className="mt-8 text-balance text-center text-xl font-medium md:text-2xl">
              One brain. Every channel. Always on brand.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
