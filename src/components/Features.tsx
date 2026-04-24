const features = [
  {
    title: "One-click Campaign Builder",
    body: "Describe your project in plain English. Get a full 30-day multi-channel plan — posts, threads, emails, video briefs.",
  },
  {
    title: "AI Content Studio",
    body: "Text, images, short-form video, voiceovers. Repurpose one blog into ten social posts without losing your voice.",
  },
  {
    title: "Unified Scheduling",
    body: "Post to X, LinkedIn, Instagram, TikTok, YouTube, Reddit, and more from one queue. Optimal-time AI tunes to your audience.",
  },
  {
    title: "Email & SMS Sequences",
    body: "Drip campaigns, welcome series, behavioral triggers. Personalized without the spreadsheet.",
  },
  {
    title: "Analytics in Plain English",
    body: "No dashboards you can't read. Weekly briefs tell you what worked, why, and what to try next.",
  },
  {
    title: "Brand-Safe by Default",
    body: "Human approval gate, tone guardrails, spam-score checks. Autonomy when you want it, veto when you need it.",
  },
  {
    title: "Cross-Project Promotion",
    body: "Running multiple projects? ComfyMart finds audience overlap and lifts them together — organically.",
  },
  {
    title: "White-Label Ready",
    body: "Agency mode lets you resell ComfyMart under your own brand. Your clients never see ours.",
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
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 card-shadow transition hover:-translate-y-0.5"
            >
              <div className="mb-4 h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]" />
              <h3 className="text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-[var(--color-muted-foreground)]">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
