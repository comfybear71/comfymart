import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div>
      <div className="mb-10">
        <p className="text-sm font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Dashboard
        </p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Welcome, {firstName}.
        </h1>
      </div>

      <section className="rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-10 text-center md:p-16">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-white">
          <PlugIcon />
        </div>
        <h2 className="mt-6 text-balance text-2xl font-semibold tracking-tight">
          Plug your first project in.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[var(--color-muted-foreground)]">
          Drop your website, a short description, and any brand assets.
          ComfyMart&apos;s AI takes it from there.
        </p>
        <p className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-2 text-xs font-medium text-[var(--color-muted-foreground)]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
          Project wizard lands in the next release
        </p>
      </section>
    </div>
  );
}

function PlugIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 2v6" />
      <path d="M15 2v6" />
      <path d="M6 8h12v4a6 6 0 0 1-12 0V8z" />
      <path d="M12 18v4" />
    </svg>
  );
}
