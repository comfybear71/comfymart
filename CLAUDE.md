# CLAUDE.md — ComfyMart project memory

Context for future Claude sessions working on this repo.

## What this is

**ComfyMart** is a multi-tenant SaaS marketing platform. Plug any project in (wizard) → AI generates + runs campaigns across social, email, content, SEO → clients get a "set and forget" dashboard, owner gets agency-style backend.

Product #12 in the Comfybear family. The first 11 projects are the initial tenants.

## Branch + deploy conventions

- Develop on `claude/<slug>` branches. **Never push directly to `master`.**
- The human owner handles PRs, merges, and releases.
- Deploys run on **Vercel**. Domain will be `comfymart.xyz` (not yet purchased at the time Phase 0 shipped — live preview is `comfymart.vercel.app`).
- Package manager: **npm**.

## Stack decisions (locked in Phase 0)

- **Next.js 15** App Router + **React 19** + **TypeScript strict**.
- **Tailwind CSS v4** — CSS-first `@theme` tokens live in `src/app/globals.css`. No `tailwind.config.js`.
- Brand palette (warm cream + deep violet + coral accent):
  - `--color-background: #faf7f2`
  - `--color-foreground: #1a1625`
  - `--color-primary: #6d3aff`
  - `--color-accent: #ff8c5a`
- Font stack: Inter / system sans.

## Integrations

| Purpose             | Service                                    | Status  |
| ------------------- | ------------------------------------------ | ------- |
| Database            | Neon Postgres (via Vercel integration)     | ✅ wired |
| ORM / migrations    | Drizzle ORM + Drizzle Kit                  | ✅ wired |
| Auth                | Auth.js v5 (Drizzle adapter)               | schema only (runtime lands in Option B) |
| Storage             | Vercel Blob                                | Phase 1-C |
| LLM / content       | Anthropic Claude (`claude-sonnet-4-6` default; `claude-opus-4-7` for heavy reasoning) | Phase 1-C brief (needs `ANTHROPIC_API_KEY`) / Phase 2 campaigns |
| Social posting      | Ayrshare (unified)                         | Phase 3 |
| Transactional email | Resend                                     | ✅ Phase 1-C (magic links) |
| SMS (later)         | Twilio                                     | Phase 4+ |
| Video (later)       | Runway / Kling AI                          | Phase 4+ |

## Multi-tenancy: how it's enforced

**Postgres RLS, not app-layer checks.** Tenant safety is a database invariant.

- Three tables are RLS-protected with `FORCE ROW LEVEL SECURITY`: `organizations`, `memberships`, `projects`. Even the DB owner role is subject to policy.
- Auth.js tables (`users`, `accounts`, `sessions`, `verification_tokens`) are deliberately NOT RLS-protected — only the trusted server-side Auth.js adapter touches them. RLS there would break login without adding safety.
- Every policy reads `app_current_user_id()`, which returns `current_setting('app.user_id', true)`.
- The runtime injects that setting via `withUser(userId, fn)` in `src/lib/db/client.ts` — it runs `fn` inside a transaction after `SELECT set_config('app.user_id', userId, true)`.
- **Never use the bare `db` export in user-facing code paths.** Only use `db` for Auth.js adapter / server-side admin. User requests must go through `withUser()`.
- Atomic org creation uses the `create_organization(name, slug)` SECURITY DEFINER function, which creates the org + owner membership in one statement.
- Helper functions (`is_org_member`, `is_org_owner`) are `SECURITY DEFINER` to bypass their own recursive RLS.

## Phase roadmap

1. **Phase 0** _(shipped, v0.1.0)_ — Landing page, `/api/waitlist` stub (log-only), Vercel-ready.
2. **Phase 1-A** _(shipped, v0.2.0)_ — Neon Postgres, Drizzle schema, RLS on tenant tables, `withUser()` helper.
3. **Phase 1-B** _(shipped)_ — Auth.js v5 Google OAuth, `/login`, `/dashboard` empty state, session-aware Nav.
4. **Phase 1-C** _(shipped)_ — Magic-link login (Resend), "Plug New Project" wizard, AI brief analyzer.
5. **Phase 2** _(shipped on branch)_ — Campaign Generator, Content Studio, human-approval queue.
6. **Phase 3** _(in progress)_ — Social scheduler (Ayrshare), email sequences (Resend), optimal-time AI.
7. **Phase 4+** — Analytics, agentic loops, white-label / agency mode, billing (Stripe).

## Auth pattern

- **Auth.js v5** (`next-auth@beta`) with **Google OAuth** + **Resend magic link**, and the **Drizzle adapter** pointed at the Phase 1-A tables.
- Session strategy: **database** — the sessions row is the source of truth; revocable server-side.
- **No middleware.** Route protection is done via server-component guards (`const s = await auth(); if (!s?.user) redirect("/login")`). Middleware pulls the full adapter into the edge bundle, which breaks because Neon's WebSocket driver needs `ws` (Node-only). Page-level guards are cheap, and we can revisit when we need cross-route routing rules.
- `trustHost: true` because Vercel preview deploys use ephemeral hostnames that don't match `AUTH_URL`.
- Auth.js tables are NOT RLS-protected (see Phase 1-A notes) — only the server-side adapter touches them.

## Hard rules

- **Multi-tenancy safety**: when Supabase lands in Phase 1, every table that holds tenant data must have RLS policies tested with two fake tenants before merging.
- **Brand safety**: AI content publishing must default to human-approval gate. Autonomous posting is opt-in per channel.
- **No unauthorized auto-posting** to platforms with anti-automation TOS (X, IG). Always respect rate limits + provide an approval toggle.
- **API keys** live in Vercel env vars only. Never commit secrets. `.env*` is gitignored.

## Code style notes

- Prefer editing existing files over creating new ones.
- Comments only for non-obvious "why" — avoid narration.
- Error handling only at real boundaries (user input, external APIs).
- Keep components small and presentational where possible.

## File map

```
src/
├── auth.ts                            # Auth.js v5 config (Google + Drizzle adapter)
├── app/
│   ├── layout.tsx                     # Metadata + root shell
│   ├── page.tsx                       # Landing page
│   ├── globals.css                    # Tailwind v4 + @theme tokens
│   ├── login/page.tsx                 # Google sign-in, redirects if already authed
│   ├── dashboard/
│   │   ├── layout.tsx                 # Authed shell (avatar, sign out)
│   │   └── page.tsx                   # Empty state "Plug your first project"
│   └── api/
│       ├── auth/[...nextauth]/route.ts  # Auth.js handler
│       └── waitlist/route.ts           # POST /api/waitlist (log-only stub)
├── components/
│   ├── Nav.tsx                        # Auth-aware landing nav
│   ├── Hero.tsx                       # Truthful channel visual (no fake data)
│   ├── HowItWorks.tsx
│   ├── Features.tsx
│   ├── Waitlist.tsx                   # 'use client' — fetches /api/waitlist
│   └── Footer.tsx
└── lib/db/
    ├── client.ts                      # Drizzle + Neon + withUser()
    ├── schema.ts                      # All tables
    └── migrations/                    # Drizzle-Kit generated + RLS policies
```

## Env vars in Vercel

| Name | Source | Used by |
| --- | --- | --- |
| `DATABASE_URL` | Neon Vercel integration | Runtime queries |
| `DATABASE_URL_UNPOOLED` | Neon Vercel integration | Migrations |
| `AUTH_SECRET` | `openssl rand -base64 32` | Auth.js session signing |
| `AUTH_URL` | e.g. `https://comfymart.vercel.app` | Auth.js callback base |
| `AUTH_GOOGLE_ID` | Google Cloud Console OAuth client | Google sign-in |
| `AUTH_GOOGLE_SECRET` | Google Cloud Console OAuth client | Google sign-in |
| `RESEND_API_KEY` | Resend dashboard | Magic-link email (`AUTH_RESEND_KEY` also accepted) |
| `EMAIL_FROM` | e.g. `ComfyMart <noreply@comfymart.xyz>` | Sender identity |
| `ANTHROPIC_API_KEY` | Anthropic console | AI brief + campaign generator |
| `AYRSHARE_API_KEY` | Ayrshare dashboard | Live social publish (dry-run without it) |
| `AYRSHARE_PROFILE_KEY` | Ayrshare (optional) | Multi-profile / business plans |
| `AYRSHARE_PLATFORMS` | e.g. `linkedin,facebook` | Default social targets |

## How to continue

1. Confirm: `/login` has Google + magic link; `/dashboard/projects/new` creates org+project+brief.
2. Phase 2 scope: Campaign Generator, Content Studio, human-approval queue.
3. The wizard creates orgs via the `create_organization()` RPC (see Phase 1-A RLS migration).
4. All tenant reads/writes MUST go through `withUser(userId, fn)` in `src/lib/db/client.ts`.
5. When adding new tenant tables: enable RLS + FORCE, add policies using `is_org_member()`.
