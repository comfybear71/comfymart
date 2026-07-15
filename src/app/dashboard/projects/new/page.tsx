import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ProjectWizardForm from "@/components/ProjectWizardForm";

export default async function NewProjectPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/dashboard/projects/new");

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
          Plug new project
        </p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Tell us about the project.
        </h1>
        <p className="mt-3 max-w-xl text-[var(--color-muted-foreground)]">
          Drop a URL and a short description. ComfyMart builds a brand brief you
          can approve before any campaign work starts.
        </p>
      </div>

      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 md:p-10 card-shadow">
        <ProjectWizardForm />
      </div>
    </div>
  );
}
