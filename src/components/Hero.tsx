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

        <div className="relative mx-auto mt-16 max-w-4xl">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 card-shadow md:p-6">
            <div className="flex items-center gap-1.5 pb-4">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-muted)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-muted)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-muted)]" />
              <span className="ml-auto text-xs text-[var(--color-muted-foreground)]">
                comfymart.xyz / dashboard
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <MockStat label="Campaigns live" value="7" trend="+2 this week" />
              <MockStat label="Impressions" value="184k" trend="+38% vs last" />
              <MockStat label="Signups driven" value="412" trend="+91 today" />
            </div>
            <div className="mt-4 rounded-xl bg-[var(--color-muted)] p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                This week&apos;s AI brief
              </p>
              <p className="mt-2 text-sm text-[var(--color-foreground)]">
                Your launch thread on X outperformed the baseline by 3×. I&apos;ve
                queued 4 follow-ups in the same format and paused the
                underperforming LinkedIn variant.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MockStat({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-[var(--color-accent)]">{trend}</p>
    </div>
  );
}
