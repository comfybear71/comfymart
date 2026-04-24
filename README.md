# ComfyMart

**Marketing on autopilot.** Plug any project in — ComfyMart's AI writes, schedules, posts, and optimizes your entire campaign across social, email, content, and SEO. Set it and forget it.

Project #12 in the Comfybear family. Built for the 11 sibling projects first, then opened up to any project owner who needs a "plug-and-play" marketing engine.

- 🌐 Production: [comfymart.xyz](https://comfymart.xyz) _(coming soon)_
- 🧪 Preview: `comfymart.vercel.app`

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (CSS-first theming via `@theme`)
- Deployment target: **Vercel**
- Planned: Supabase (auth + Postgres + storage), Anthropic Claude (content AI), Ayrshare (unified social posting), Resend (email)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script              | What it does                      |
| ------------------- | --------------------------------- |
| `npm run dev`       | Start the Next.js dev server      |
| `npm run build`     | Production build                  |
| `npm run start`     | Serve the production build        |
| `npm run lint`      | Run ESLint (next/core-web-vitals) |
| `npm run typecheck` | Type-check with `tsc --noEmit`    |

## Roadmap

- **Phase 0** _(current)_ — Marketing landing page + waitlist capture + Vercel deploy.
- **Phase 1** — Supabase auth, multi-tenant project hub, "Plug New Project" wizard, AI brief analyzer.
- **Phase 2** — AI Campaign Generator (Claude Sonnet 4.6), Content Studio, approval queue.
- **Phase 3** — Unified social scheduler (Ayrshare), email sequences (Resend), optimal-time AI.
- **Phase 4+** — Analytics + insights, agentic optimization, white-label / agency mode.

## Project layout

```
src/
├── app/
│   ├── layout.tsx          # Root layout + metadata
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Tailwind v4 theme tokens
│   └── api/
│       └── waitlist/       # POST /api/waitlist
└── components/             # Landing page sections
```
