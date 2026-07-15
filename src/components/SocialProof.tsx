const projects = [
  "Comfybear",
  "Product #1–11",
  "New launches",
  "Agency clients",
];

const quotes = [
  {
    body: "We needed one place to promote every project without hiring a full marketing team. ComfyMart is that place.",
    name: "Stu",
    role: "Founder, Comfybear",
  },
  {
    body: "Human approval by default is the difference between AI marketing and reckless auto-posting. That gate stays on.",
    name: "Early beta note",
    role: "Product principle",
  },
];

export default function SocialProof() {
  return (
    <section
      id="proof"
      className="border-t border-[var(--color-border)]"
    >
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-[var(--color-primary)]">
            Social proof
          </p>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            Built for the Comfybear stack. Ready to resell.
          </h2>
          <p className="mt-4 text-lg text-[var(--color-muted-foreground)]">
            First tenants are our own projects. Agency mode is on the roadmap
            for teams who want to onsell under their brand.
          </p>
        </div>

        <ul className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {projects.map((p) => (
            <li
              key={p}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-3 text-sm font-medium text-[var(--color-muted-foreground)] card-shadow"
            >
              {p}
            </li>
          ))}
        </ul>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {quotes.map((q) => (
            <blockquote
              key={q.name}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 card-shadow"
            >
              <p className="text-pretty text-lg leading-relaxed text-[var(--color-foreground)]">
                &ldquo;{q.body}&rdquo;
              </p>
              <footer className="mt-5 text-sm">
                <span className="font-semibold">{q.name}</span>
                <span className="text-[var(--color-muted-foreground)]">
                  {" "}
                  · {q.role}
                </span>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
