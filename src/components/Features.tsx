import {
  Sparkles,
  PenLine,
  CalendarDays,
  Mail,
  BarChart3,
  ShieldCheck,
  GitBranch,
  Building2,
  type LucideIcon,
} from "lucide-react";

const features: {
  title: string;
  body: string;
  icon: LucideIcon;
}[] = [
  {
    title: "One-click Campaign Builder",
    body: "Describe your project in plain English. Get a full 30-day multi-channel plan — posts, threads, emails, video briefs.",
    icon: Sparkles,
  },
  {
    title: "AI Content Studio",
    body: "Text, images, short-form video, voiceovers. Repurpose one blog into ten social posts without losing your voice.",
    icon: PenLine,
  },
  {
    title: "Unified Scheduling",
    body: "Post to X, LinkedIn, Instagram, TikTok, YouTube, Reddit, and more from one queue. Optimal-time AI tunes to your audience.",
    icon: CalendarDays,
  },
  {
    title: "Email & SMS Sequences",
    body: "Drip campaigns, welcome series, behavioral triggers. Personalized without the spreadsheet.",
    icon: Mail,
  },
  {
    title: "Analytics in Plain English",
    body: "No dashboards you can't read. Weekly briefs tell you what worked, why, and what to try next.",
    icon: BarChart3,
  },
  {
    title: "Brand-Safe by Default",
    body: "Human approval gate, tone guardrails, spam-score checks. Autonomy when you want it, veto when you need it.",
    icon: ShieldCheck,
  },
  {
    title: "Cross-Project Promotion",
    body: "Running multiple projects? ComfyMart finds audience overlap and lifts them together — organically.",
    icon: GitBranch,
  },
  {
    title: "White-Label Ready",
    body: "Agency mode lets you resell ComfyMart under your own brand. Your clients never see ours.",
    icon: Building2,
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="border-t border-[var(--color-border)] bg-[var(--color-muted)]/40"
    >
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-[var(--color-primary)]">
            Features
          </p>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            Everything you&apos;d hire an agency for. Running while you sleep.
          </h2>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 card-shadow transition hover:-translate-y-0.5"
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-white">
                  <Icon size={18} />
                </div>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-[var(--color-muted-foreground)]">
                  {f.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
