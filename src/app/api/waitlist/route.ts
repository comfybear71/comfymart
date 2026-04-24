import { NextResponse } from "next/server";

export const runtime = "edge";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email =
    typeof body === "object" && body && "email" in body
      ? (body as { email: unknown }).email
      : null;

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email." },
      { status: 400 },
    );
  }

  // Phase 0: log-only. Phase 1 wires Supabase persistence + double opt-in.
  console.log(`[waitlist] ${email} @ ${new Date().toISOString()}`);

  return NextResponse.json({ ok: true });
}
