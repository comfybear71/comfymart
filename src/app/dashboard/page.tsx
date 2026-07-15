import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { withUser } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Plug } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  const list = await withUser(session.user.id, async (tx) => {
    return tx
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        websiteUrl: projects.websiteUrl,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .orderBy(desc(projects.createdAt));
  });

  return (
    <div>
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
            Dashboard
          </p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Welcome, {firstName}.
          </h1>
        </div>
        {list.length > 0 && (
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-foreground)] px-5 py-2.5 text-sm font-medium text-[var(--color-background)] transition hover:opacity-90"
          >
            Plug new project
          </Link>
        )}
      </div>

      {list.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-10 text-center md:p-16">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-white">
            <Plug size={24} />
          </div>
          <h2 className="mt-6 text-balance text-2xl font-semibold tracking-tight">
            Plug your first project in.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[var(--color-muted-foreground)]">
            Drop your website, a short description, and any brand notes.
            ComfyMart builds a brief you can approve before campaigns start.
          </p>
          <Link
            href="/dashboard/projects/new"
            className="mt-8 inline-flex rounded-full bg-[var(--color-foreground)] px-6 py-3 text-sm font-medium text-[var(--color-background)] transition hover:opacity-90"
          >
            Start the wizard →
          </Link>
        </section>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {list.map((p) => (
            <li key={p.id}>
              <Link
                href={`/dashboard/projects/${p.id}`}
                className="block rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 card-shadow transition hover:-translate-y-0.5"
              >
                <h2 className="text-lg font-semibold">{p.name}</h2>
                {p.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--color-muted-foreground)]">
                    {p.description}
                  </p>
                )}
                <p className="mt-4 text-xs text-[var(--color-muted-foreground)]">
                  Open brief →
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
