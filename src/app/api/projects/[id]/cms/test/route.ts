import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { withUser } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { testGithubConnection } from "@/lib/cms/github";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { id } = await context.params;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    /* optional body — fall back to saved settings */
  }

  const obj = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const saved = await withUser(userId, async (tx) => {
    const [row] = await tx
      .select({
        cmsRepo: projects.cmsRepo,
        cmsBranch: projects.cmsBranch,
      })
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    return row ?? null;
  });

  if (!saved) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const repo =
    (typeof obj.cmsRepo === "string" && obj.cmsRepo.trim()) ||
    saved.cmsRepo ||
    "";
  const branch =
    (typeof obj.cmsBranch === "string" && obj.cmsBranch.trim()) ||
    saved.cmsBranch ||
    "master";

  if (!repo) {
    return NextResponse.json(
      { ok: false, error: "Set a GitHub repo (owner/name) first." },
      { status: 400 },
    );
  }

  const result = await testGithubConnection({ repo, branch });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
