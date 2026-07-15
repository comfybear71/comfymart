"use server";

import { auth } from "@/auth";
import { withUser } from "@/lib/db/client";
import { organizations, projects, memberships } from "@/lib/db/schema";
import { analyzeBrief } from "@/lib/ai/brief";
import { slugify, uniqueSlug } from "@/lib/slug";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";

export type CreateProjectState = {
  error?: string;
};

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const withProto = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

async function resolveOwnerOrgId(
  tx: Parameters<Parameters<typeof withUser>[1]>[0],
  userId: string,
  projectName: string,
): Promise<string> {
  const existing = await tx
    .select({ orgId: memberships.orgId })
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.role, "owner")))
    .limit(1);

  if (existing[0]?.orgId) return existing[0].orgId;

  const orgSlug = `${slugify(projectName)}-${crypto.randomUUID().slice(0, 8)}`;
  await tx.execute(
    sql`SELECT id FROM create_organization(${projectName}, ${orgSlug})`,
  );

  const [org] = await tx
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, orgSlug))
    .limit(1);

  if (!org?.id) {
    throw new Error("Organization was created but could not be loaded.");
  }
  return org.id;
}

export async function createProjectAction(
  _prev: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { error: "You must be signed in." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const websiteRaw = String(formData.get("websiteUrl") ?? "").trim();

  if (name.length < 2) {
    return { error: "Give your project a name (at least 2 characters)." };
  }
  if (description.length < 10) {
    return { error: "Add a short description so we can analyze the brief." };
  }

  const websiteUrl = websiteRaw ? normalizeUrl(websiteRaw) : null;
  if (websiteRaw && !websiteUrl) {
    return { error: "Website URL looks invalid." };
  }

  const brief = await analyzeBrief({
    name,
    description,
    websiteUrl,
    notes: notes || null,
  });

  let projectId: string;

  try {
    projectId = await withUser(userId, async (tx) => {
      const orgId = await resolveOwnerOrgId(tx, userId, name);

      const existingProjects = await tx
        .select({ slug: projects.slug })
        .from(projects)
        .where(eq(projects.orgId, orgId));

      const taken = new Set(existingProjects.map((p) => p.slug));
      const projectSlug = uniqueSlug(slugify(name), taken);

      const [project] = await tx
        .insert(projects)
        .values({
          orgId,
          name,
          slug: projectSlug,
          description,
          websiteUrl,
          brandTone: brief,
          createdBy: userId,
        })
        .returning({ id: projects.id });

      if (!project?.id) throw new Error("Failed to create project");
      return project.id;
    });
  } catch (err) {
    console.error("[createProject]", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "Could not create the project. Try again.",
    };
  }

  redirect(`/dashboard/projects/${projectId}`);
}
