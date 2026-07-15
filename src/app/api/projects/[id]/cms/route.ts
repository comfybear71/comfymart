import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { withUser } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hasCmsGithubToken } from "@/lib/cms/github";

export const runtime = "nodejs";

function clean(value: unknown, max = 200): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t) return null;
  return t.slice(0, max);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { id } = await context.params;

  const project = await withUser(userId, async (tx) => {
    const [row] = await tx
      .select({
        id: projects.id,
        cmsProvider: projects.cmsProvider,
        cmsRepo: projects.cmsRepo,
        cmsBranch: projects.cmsBranch,
        cmsGuidesPath: projects.cmsGuidesPath,
        notifyEmail: projects.notifyEmail,
        websiteUrl: projects.websiteUrl,
      })
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    return row ?? null;
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({
    ...project,
    tokenConfigured: hasCmsGithubToken(),
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const obj = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const cmsProvider = clean(obj.cmsProvider, 40) ?? "github";
  const cmsRepo = clean(obj.cmsRepo, 200);
  const cmsBranch = clean(obj.cmsBranch, 100) ?? "master";
  const cmsGuidesPath = clean(obj.cmsGuidesPath, 200) ?? "content/guides";
  const notifyEmail = clean(obj.notifyEmail, 200);

  if (obj.cmsRepo !== undefined && obj.cmsRepo !== null && obj.cmsRepo !== "" && !cmsRepo) {
    return NextResponse.json({ error: "cmsRepo is invalid." }, { status: 400 });
  }

  try {
    const updated = await withUser(userId, async (tx) => {
      const [row] = await tx
        .update(projects)
        .set({
          cmsProvider: cmsRepo ? cmsProvider : null,
          cmsRepo,
          cmsBranch: cmsRepo ? cmsBranch : null,
          cmsGuidesPath: cmsRepo ? cmsGuidesPath : null,
          ...(obj.notifyEmail !== undefined ? { notifyEmail } : {}),
          updatedAt: new Date(),
        })
        .where(eq(projects.id, id))
        .returning({
          id: projects.id,
          cmsProvider: projects.cmsProvider,
          cmsRepo: projects.cmsRepo,
          cmsBranch: projects.cmsBranch,
          cmsGuidesPath: projects.cmsGuidesPath,
          notifyEmail: projects.notifyEmail,
        });
      return row ?? null;
    });

    if (!updated) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      project: updated,
      tokenConfigured: hasCmsGithubToken(),
    });
  } catch (err) {
    console.error("[api/projects/cms]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save CMS settings." },
      { status: 500 },
    );
  }
}
