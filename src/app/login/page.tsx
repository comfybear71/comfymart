import Link from "next/link";
import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const session = await auth();
  const { next, error } = await searchParams;

  if (session?.user) {
    redirect(next ?? "/dashboard");
  }

  const redirectTo = next?.startsWith("/") ? next : "/dashboard";

  return (
    <main className="glow flex min-h-screen items-center justify-center px-6 py-20">
      <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-10 card-shadow">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 font-semibold"
        >
          <span
            aria-hidden
            className="inline-block h-7 w-7 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]"
          />
          <span className="text-lg tracking-tight">ComfyMart</span>
        </Link>

        <h1 className="mt-8 text-center text-2xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--color-muted-foreground)]">
          Sign in to plug a project in and launch its campaign.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700"
          >
            Sign-in failed. Try again or use another method.
          </p>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo });
          }}
          className="mt-8"
        >
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-5 py-3 text-sm font-medium transition hover:bg-[var(--color-muted)]"
          >
            <GoogleMark />
            Continue with Google
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--color-border)]" />
          <span className="text-xs text-[var(--color-muted-foreground)]">
            or
          </span>
          <div className="h-px flex-1 bg-[var(--color-border)]" />
        </div>

        <form
          action={async (formData) => {
            "use server";
            const email = String(formData.get("email") ?? "").trim();
            if (!email) return;
            await signIn("resend", {
              email,
              redirectTo,
            });
          }}
          className="space-y-3"
        >
          <label className="block text-left text-sm font-medium" htmlFor="email">
            Email magic link
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@yourproject.com"
            className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-5 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
          />
          <button
            type="submit"
            className="w-full rounded-full bg-[var(--color-foreground)] px-5 py-3 text-sm font-medium text-[var(--color-background)] transition hover:opacity-90"
          >
            Email me a link
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--color-muted-foreground)]">
          We&apos;ll email a one-time sign-in link. No password needed.
        </p>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg
      aria-hidden
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}
