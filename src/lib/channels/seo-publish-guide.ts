/** Beginner-friendly paths for getting ComfyMart SEO Markdown onto a live URL. */

export type SitePlatformId =
  | "unknown"
  | "wordpress"
  | "shopify"
  | "webflow"
  | "squarespace"
  | "wix"
  | "framer"
  | "custom";

export type SeoPublishPath = {
  id: SitePlatformId;
  name: string;
  bestFor: string;
  steps: string[];
  tips: string[];
};

export const SEO_PUBLISH_PATHS: SeoPublishPath[] = [
  {
    id: "wordpress",
    name: "WordPress",
    bestFor: "Most small business sites and blogs",
    steps: [
      "In ComfyMart Content Studio, approve the SEO item → Publish (downloads a .md file).",
      "Open the .md in Notepad / TextEdit. Copy everything below the --- front matter (or the whole file).",
      "WordPress Admin → Posts → Add New (or Pages → Add New if you prefer a permanent Guide page).",
      "Paste the title into the post title. Paste the body into the editor (use Code/HTML view if formatting looks odd).",
      "Set a simple URL slug, e.g. why-outdoor-aircon-needs-shade-cover.",
      "Add a Featured image if you have one (product photo is fine).",
      "Yoast / Rank Math (if installed): paste a short meta description from the brief.",
      "Click Publish. Visit the public URL and confirm it loads without login.",
    ],
    tips: [
      "You do not need a fancy “blog theme” — one useful Guide page is enough to start.",
      "Link to your product page from the article (“Grab yours at …”).",
    ],
  },
  {
    id: "shopify",
    name: "Shopify",
    bestFor: "Stores selling the product online",
    steps: [
      "Publish the SEO item in ComfyMart to download the .md file.",
      "Shopify Admin → Online Store → Blog posts → Add blog post (create a Blog first if none exists).",
      "Paste title + body. Keep the URL handle short and readable.",
      "Add the product in the post (product card / link to the product).",
      "Save → view on the storefront URL.",
    ],
    tips: [
      "Shopify SEO lives on the post URL under /blogs/…. That URL is what Google indexes.",
      "If you only have a product page today, you can also paste a shortened version into the product description — still better than nothing.",
    ],
  },
  {
    id: "webflow",
    name: "Webflow",
    bestFor: "Designed marketing sites with a CMS Collection",
    steps: [
      "Download the .md from ComfyMart Publish.",
      "Webflow Designer → CMS → your Blog/Guides Collection → New Item.",
      "Paste Name, Slug, and Body (Rich Text). Map meta title/description fields if you have them.",
      "Set item to Published / staged → Publish site.",
      "Open the live URL on your custom domain.",
    ],
    tips: [
      "If you have no CMS Collection yet: add a static page under /guides/… and paste there — same SEO effect for one article.",
    ],
  },
  {
    id: "squarespace",
    name: "Squarespace",
    bestFor: "All-in-one small business sites",
    steps: [
      "Download the .md from ComfyMart.",
      "Pages → Blog (or create a Blog page) → Add post.",
      "Paste title and body. Set a clean URL slug.",
      "SEO panel: title + description.",
      "Save & Publish. Open the live link.",
    ],
    tips: ["One Blog page with a few posts is enough — you are not building a magazine."],
  },
  {
    id: "wix",
    name: "Wix",
    bestFor: "Drag-and-drop sites",
    steps: [
      "Download the .md from ComfyMart.",
      "Wix Editor → Blog (add Wix Blog if missing) → Create Post.",
      "Paste title and content. Publish the post.",
      "Confirm the URL works on your live domain.",
    ],
    tips: ["Turn the post “visible” / published — drafts are invisible to Google."],
  },
  {
    id: "framer",
    name: "Framer",
    bestFor: "Modern marketing sites",
    steps: [
      "Download the .md from ComfyMart.",
      "Use a CMS Collection for articles, or a static page route like /guides/aircon-shade-cover.",
      "Paste content into the page / CMS fields → Publish.",
    ],
    tips: ["Static guide pages are fine for newbies; CMS is optional until you have many articles."],
  },
  {
    id: "custom",
    name: "Custom / Next.js / developer site",
    bestFor: "Sites like ShadeMate built in code",
    steps: [
      "Download the .md from ComfyMart (Publish or Download .md button).",
      "Open the website repo (e.g. shademate). There is often NO content/ folder yet — that is normal.",
      "Create a new App Router page, e.g. src/app/guides/why-outdoor-aircon-needs-shade-cover/page.tsx (or /blog/…). Do not drop the .md in the project root with nowhere to render it.",
      "Paste the article title + body into that page (or add a content/ folder later and load Markdown from there if you prefer).",
      "Add the URL to src/app/sitemap.ts if the site has one.",
      "Deploy (Vercel). Confirm https://yoursite.com/guides/... returns 200.",
      "Optional: Google Search Console → request indexing.",
    ],
    tips: [
      "ComfyMart does not push into your repo yet — that is a later CMS sync feature.",
      "New customers without a developer: use WordPress/Shopify first, or hire a one-off “add one guide page” task.",
      "One guide page is enough; you do not need a full blog system on day one.",
    ],
  },
  {
    id: "unknown",
    name: "I only have a one-page site",
    bestFor: "Landing page only — no blog yet",
    steps: [
      "You still do not need a full blog. You need one public URL with the article text.",
      "Easiest: add a second page called Guides or Learn on whatever builder you use.",
      "Publish the ComfyMart .md onto that page.",
      "From the homepage, link “Why your aircon needs shade” → that page.",
      "Later you can turn Guides into a real blog — Google already has something to index.",
    ],
    tips: [
      "SEO is not “install a blog plugin.” It is “helpful text on a public URL.”",
      "If you cannot add any page yet, keep drafts in ComfyMart and publish social/email until the site can host a guide.",
    ],
  },
];

export const SEO_PUBLISH_OVERVIEW = {
  title: "Put SEO content on your website",
  summary:
    "ComfyMart writes the article. Google only sees it after it lives on your domain at a normal public link. You do not need a big blog — one Guide page is enough to start.",
  checklist: [
    "In Content Studio: Publish the SEO item — the browser downloads a .md automatically (or click Download .md on the card if you missed it)",
    "Create a page or post on your site builder / CMS",
    "Paste title + body; choose a short URL slug",
    "Publish live (not draft) and open the URL in a private window",
    "Link to it from your homepage or product page",
    "Optional later: Google Search Console → URL inspection → Request indexing",
  ],
  myths: [
    {
      myth: "I must build a full blog.",
      truth: "One useful guide page with a real URL is enough to begin.",
    },
    {
      myth: "Publishing in ComfyMart puts it on Google.",
      truth: "ComfyMart stores the draft and downloads Markdown. Your website is what Google crawls. Auto-push to a CMS/repo is Phase 4 — not required for social publishing.",
    },
    {
      myth: "SEO is only for experts.",
      truth: "Clear titles, helpful answers, and a public page get you most of the early win.",
    },
  ],
};
