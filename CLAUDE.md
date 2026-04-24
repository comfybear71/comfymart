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

## Planned integrations (not yet wired)

| Purpose           | Service              |
| ----------------- | -------------------- |
| Auth + DB         | Supabase             |
| Storage (assets)  | Supabase Storage     |
| LLM / content     | Anthropic Claude (`claude-sonnet-4-6` by default; `claude-opus-4-7` for heavy reasoning) |
| Social posting    | Ayrshare (unified)   |
| Transactional email | Resend             |
| SMS (later)       | Twilio               |
| Video (later)     | Runway / Kling AI    |

## Phase roadmap

1. **Phase 0** _(shipped)_ — Landing page, `/api/waitlist` stub (log-only), Vercel-ready.
2. **Phase 1** — Supabase auth, multi-tenant schema (strict RLS from day 1), Project Hub + onboarding wizard, AI brief analyzer.
3. **Phase 2** — Campaign Generator, Content Studio, human-approval queue.
4. **Phase 3** — Social scheduler (Ayrshare), email sequences (Resend), optimal-time AI.
5. **Phase 4+** — Analytics, agentic loops, white-label / agency mode, billing (Stripe).

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

## Current Phase 0 file map

```
src/
├── app/
│   ├── layout.tsx                 # Metadata + root shell
│   ├── page.tsx                   # Composes landing sections
│   ├── globals.css                # Tailwind v4 + @theme tokens
│   └── api/waitlist/route.ts      # POST /api/waitlist (log-only stub)
└── components/
    ├── Nav.tsx
    ├── Hero.tsx
    ├── HowItWorks.tsx
    ├── Features.tsx
    ├── Waitlist.tsx               # 'use client' — fetches /api/waitlist
    └── Footer.tsx
```

## How to continue

When you pick this up next:
1. Confirm Vercel is deployed and `comfymart.vercel.app` is live.
2. Ask the owner which Phase 1 slice to start first (likely auth + project wizard).
3. Before adding Supabase, set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel env vars.
4. Write RLS policies in the same commit that creates each tenant table.
