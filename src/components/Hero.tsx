import {
  CheckCircle2,
  Clock,
  Mail,
  Share2,
  FileText,
  Search,
} from "lucide-react";

const queue = [
  {
    channel: "Social",
    icon: Share2,
    title: "Launch thread — plug your project",
    status: "Ready for approval",
    tone: "approval" as const,
  },
  {
    channel: "Email",
    icon: Mail,
    title: "Welcome sequence · Day 1",
    status: "Scheduled · Tue 9:00",
    tone: "scheduled" as const,
  },
  {
    channel: "Content",
    icon: FileText,
    title: "Blog outline → 5 social cuts",
    status: "Drafting",
    tone: "draft" as const,
  },
  {
    channel: "SEO",
    icon: Search,
    title: "Keyword brief for landing page",
    status: "Queued",
    tone: "queued" as const,
  },
];

const toneClass = {
  approval: "text-[var(--color-accent)]",
  scheduled: "text-[var(--color-primary)]",
  draft: "text-[var(--color-muted-foreground)]",
  queued: "text-[var(--color-muted-foreground)]",
};

export default function Hero() {
  return (
    <section className="glow relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="animate-fade-rise text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
            ComfyMart
          </p>
          <h1 className="animate-fade-rise mt-4 text-balance text-5xl font-semibold tracking-tight md:text-6xl lg:text-7xl [animation-delay:80ms]">
            Marketing on{" "}
            <span className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
              autopilot.
            </span>
          </h1>
          <p className="animate-fade-rise mx-auto mt-6 max-w-2xl text-pretty text-lg text-[var(--color-muted-foreground)] md:text-xl [animation-delay:160ms]">
            Plug any project in. ComfyMart&apos;s AI writes, schedules, posts,
            and optimizes your entire campaign — social, email, content, SEO.
            Set it and forget it.
          </p>
          <div className="animate-fade-rise mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row [animation-delay:240ms]">
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

        <div className="animate-fade-rise relative mx-auto mt-16 max-w-2xl [animation-delay:320ms]">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 blur-2xl"
          />
          <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] card-shadow">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                <span className="text-sm font-medium">Campaign queue</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
                <Clock size={12} />
                Human approval on
              </span>
            </div>
            <ul className="divide-y divide-[var(--color-border)]">
              {queue.map((item) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.title}
                    className="flex items-start gap-3 px-5 py-3.5"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-muted)] text-[var(--color-foreground)]">
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                          {item.channel}
                        </span>
                        {item.tone === "approval" && (
                          <CheckCircle2
                            size={12}
                            className="text-[var(--color-accent)]"
                          />
                        )}
                      </div>
                      <p className="truncate text-sm font-medium">
                        {item.title}
                      </p>
                      <p className={`text-xs ${toneClass[item.tone]}`}>
                        {item.status}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="border-t border-[var(--color-border)] bg-[var(--color-muted)]/40 px-5 py-3 text-center text-xs text-[var(--color-muted-foreground)]">
              Illustrative queue — no live metrics. Your brand, every channel.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
