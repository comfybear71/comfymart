import { Plug, BookOpen, Armchair, type LucideIcon } from "lucide-react";

const steps: {
  n: string;
  title: string;
  body: string;
  icon: LucideIcon;
}[] = [
  {
    n: "01",
    title: "Plug your project in",
    body: "Drop your URL, a short description, and any assets. The AI learns your brand voice, personas, and USPs in under a minute.",
    icon: Plug,
  },
  {
    n: "02",
    title: "Pick a playbook",
    body: "Startup Launch. Product Update. Lead Gen. B2B Outreach. One click generates a full 30-day plan across every channel you want.",
    icon: BookOpen,
  },
  {
    n: "03",
    title: "Sit back",
    body: "ComfyMart writes, schedules, posts, and reports. Approve in one tap or let it run. Weekly plain-English summaries land in your inbox.",
    icon: Armchair,
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-[var(--color-primary)]">
            How it works
          </p>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            From zero to campaign in three steps.
          </h2>
          <p className="mt-4 text-lg text-[var(--color-muted-foreground)]">
            No marketing knowledge required. If you can write one sentence
            about your project, you&apos;re ready.
          </p>
        </div>

        <ol className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <li
                key={s.n}
                className="group relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 card-shadow transition hover:-translate-y-1 hover:border-[var(--color-primary)]/30"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-white transition group-hover:scale-105">
                    <Icon size={20} />
                  </span>
                  <span className="text-sm font-semibold text-[var(--color-muted-foreground)]">
                    {s.n}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-[var(--color-muted-foreground)]">
                  {s.body}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
