import Link from "next/link";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { withUser } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { BrandBrief } from "@/lib/ai/brief";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const project = await withUser(session.user.id, async (tx) => {
    const [row] = await tx
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    return row ?? null;
  });

  if (!project) notFound();

  const brief = project.brandTone as BrandBrief | null;

  return (
    <div>
      <div className="mb-10">
        <Link
          href="/dashboard"
          className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          ← Dashboard
        </Link>
        <p className="mt-4 text-sm font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Project
        </p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          {project.name}
        </h1>
        {project.websiteUrl && (
          <a
            href={project.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-[var(--color-primary)] hover:underline"
          >
            {project.websiteUrl}
          </a>
        )}
        {project.description && (
          <p className="mt-4 max-w-2xl text-[var(--color-muted-foreground)]">
            {project.description}
          </p>
        )}
      </div>

      {brief ? (
        <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 md:p-10 card-shadow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">Brand brief</h2>
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-1 text-xs font-medium text-[var(--color-muted-foreground)]">
              {brief.source === "ai" ? "AI analyzed" : "Draft brief"}
            </span>
          </div>

          <dl className="mt-8 grid gap-6 sm:grid-cols-2">
            <BriefField label="Summary" value={brief.summary} wide />
            <BriefField label="Audience" value={brief.audience} />
            <BriefField label="Voice" value={brief.voice} />
            <BriefField label="USP" value={brief.usp} />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Channels
              </dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {brief.channels.map((c) => (
                  <span
                    key={c}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/50 px-3 py-1 text-sm"
                  >
                    {c}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Keywords
              </dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {brief.keywords.map((k) => (
                  <span
                    key={k}
                    className="rounded-lg border border-[var(--color-border)] px-3 py-1 text-sm text-[var(--color-muted-foreground)]"
                  >
                    {k}
                  </span>
                ))}
              </dd>
            </div>
          </dl>

          <p className="mt-8 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/40 px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
            Campaign generator lands in Phase 2. Your brief is saved and ready.
          </p>
        </section>
      ) : (
        <p className="text-[var(--color-muted-foreground)]">
          No brief yet for this project.
        </p>
      )}
    </div>
  );
}

function BriefField({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
        {label}
      </dt>
      <dd className="mt-2 text-sm leading-relaxed">{value}</dd>
    </div>
  );
}
