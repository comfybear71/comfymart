import type { BrandBrief } from "@/lib/ai/brief";

/** Ayrshare platform slug used in AYRSHARE_PLATFORMS / API `platforms`. */
export type AyrsharePlatformId =
  | "bluesky"
  | "facebook"
  | "gmb"
  | "instagram"
  | "linkedin"
  | "pinterest"
  | "reddit"
  | "snapchat"
  | "telegram"
  | "threads"
  | "tiktok"
  | "twitter"
  | "youtube";

export type SetupPriority = "must" | "recommended" | "optional" | "later";

export type SetupStep = {
  id: string;
  title: string;
  /** Exact actions. Keep short and verified. */
  how: string[];
  /**
   * Required for ComfyMart organic publish via Ayrshare.
   * false = optional / ads / later — never block onboarding.
   */
  required?: boolean;
};

export type PlatformSetupGuide = {
  id: AyrsharePlatformId;
  name: string;
  accountType: string;
  why: string;
  needsMedia: boolean;
  /** One-line acceptance test. */
  doneWhen: string;
  steps: SetupStep[];
  /** Things users should not attempt during setup (Meta dead-ends, etc.). */
  doNot: string[];
  ayrshareTips: string[];
  commonFails: string[];
};

/** Facts every customer sees before any network checklist. */
export const SETUP_FACTS = [
  "ComfyMart publishes through Ayrshare. Each network is linked separately in the Ayrshare dashboard.",
  "For Facebook + Instagram you do NOT need Meta Business Suite to “add Page and Instagram to a business account.” That flow often fails and is not required for organic posts.",
  "Meta ads restrictions (“not allowed to advertise”) block ads only — not Ayrshare organic posting.",
  "A network is done when: Ayrshare shows it Linked AND a ComfyMart Publish with the right media lands on that account.",
  "One brand = one Facebook Page + one Instagram (+ other accounts). Never reuse another product’s accounts.",
];

function s(
  id: string,
  title: string,
  how: string[],
  required = true,
): SetupStep {
  return { id, title, how, required };
}

/**
 * Factual Ayrshare-first setup. Optional Meta/ads steps stay marked required:false.
 */
export const AYRSHARE_PLATFORM_GUIDES: PlatformSetupGuide[] = [
  {
    id: "facebook",
    name: "Facebook",
    accountType: "Facebook Page (not a personal profile)",
    why: "Ayrshare posts to the Page you link.",
    needsMedia: false,
    doneWhen:
      "Ayrshare → Facebook shows your brand Page Linked, and a ComfyMart Publish appears on that Page.",
    steps: [
      s("fb-create", "Create a Facebook Page for this brand", [
        "facebook.com/pages/create",
        "Page name = brand name. Category = closest match (e.g. Product/service).",
        "Create Page. Do not use your personal profile as the destination.",
      ]),
      s("fb-about", "Add website on the Page", [
        "Page → About / Page info → Website = your product URL.",
        "Add profile + cover images when ready (can wait).",
      ]),
      s("fb-ayrshare", "Link the Page in Ayrshare", [
        "app.ayrshare.com → Social Accounts → Link Facebook.",
        "Sign in as a Page admin. Allow the brand Page (Pages permissions).",
        "Confirm the Ayrshare tile shows the Page name — not your personal name.",
      ]),
      s("fb-env", "Enable Facebook in ComfyMart", [
        "Add facebook to AYRSHARE_PLATFORMS (example: linkedin,facebook,instagram).",
        "Restart the app after changing env / redeploy on Vercel.",
      ]),
      s("fb-test", "Acceptance test", [
        "ComfyMart Content Studio → approve one social item → Publish now.",
        "Open the Facebook Page → confirm the post is there.",
      ]),
    ],
    doNot: [
      "Do not require Meta Business Suite “add assets to business portfolio” to finish Facebook setup.",
      "Do not link a personal profile instead of the Page.",
    ],
    ayrshareTips: [
      "Platform id: `facebook`.",
      "Text-only posts are fine on Facebook.",
    ],
    commonFails: [
      "Ayrshare linked personal profile instead of Page.",
      "Wrong Page selected when you admin multiple brands.",
    ],
  },
  {
    id: "instagram",
    name: "Instagram",
    accountType: "Professional account (Business or Creator — either OK)",
    why: "Image posts for the brand. ComfyMart always sends media for Instagram.",
    needsMedia: true,
    doneWhen:
      "Ayrshare → Instagram shows @yourbrand Linked, and a ComfyMart Publish with an image appears on that grid.",
    steps: [
      s("ig-create", "Create a brand Instagram (or use only this brand’s account)", [
        "Sign up a new IG for this product (example: @shademate.au). Do not reuse another brand’s IG.",
        "Email must be an inbox you can open (ImprovMX alias or personal email).",
        "If Meta makes it Professional automatically, keep it. Business or Creator both work.",
      ]),
      s("ig-profile", "Set name, bio, website", [
        "Edit profile → Name = brand. Bio = short USP. Website = product URL.",
        "Add a profile photo when you can.",
      ]),
      s("ig-ayrshare", "Link Instagram in Ayrshare (required)", [
        "Ayrshare → Social Accounts → Link Instagram.",
        "Approve while logged into the brand Instagram.",
        "Confirm the tile shows the correct @handle.",
      ]),
      s("ig-env", "Enable Instagram in ComfyMart", [
        "Add instagram to AYRSHARE_PLATFORMS.",
        "Restart / redeploy after env change.",
      ]),
      s("ig-test", "Acceptance test (this proves it works)", [
        "Approve a social item that has media (Grok/OG) → Publish now.",
        "Open the brand Instagram → post must appear on the grid.",
        "If it appears, Instagram setup is complete for ComfyMart.",
      ]),
      s(
        "ig-meta-page",
        "Optional later — connect IG to Facebook Page inside Meta",
        [
          "Only for Meta ads / Suite features. Not required for ComfyMart.",
          "If Meta shows errors (“Couldn't add Page and Instagram to a business account”, “not allowed to advertise”), stop. Those do not block Ayrshare.",
          "Leave Business/Creator as-is. Do not hunt for “Switch account type” on desktop — it is often missing.",
        ],
        false,
      ),
    ],
    doNot: [
      "Do not treat Meta Business Suite / ads errors as setup failures.",
      "Do not switch Business→Creator on desktop hunting for a button that isn’t there.",
      "Do not block onboarding on “link IG to Facebook Page” inside Meta.",
    ],
    ayrshareTips: [
      "Platform id: `instagram`.",
      "Instagram requires an image — ComfyMart attaches Grok/OG media on social items.",
      "Ayrshare links Facebook and Instagram as separate tiles. That is enough.",
    ],
    commonFails: [
      "Wrong @handle linked (another brand).",
      "instagram missing from AYRSHARE_PLATFORMS.",
      "Publishing text-only — Instagram skipped when no mediaUrls.",
      "Stuck on Meta portfolio/ads errors instead of Ayrshare Linked + test Publish.",
    ],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    accountType: "Company Page preferred (personal OK for early tests)",
    why: "Reliable text channel; good first network on free Ayrshare.",
    needsMedia: false,
    doneWhen:
      "Ayrshare → LinkedIn Linked to the intended Page/profile, and a ComfyMart post appears there.",
    steps: [
      s("li-page", "Create or open the LinkedIn destination", [
        "Company Page for the brand, or founder personal for testing.",
        "Add logo + website if it’s a Page.",
      ]),
      s("li-ayrshare", "Link in Ayrshare", [
        "Ayrshare → Link LinkedIn → choose Company Page if prompted.",
        "Confirm the tile matches the intended destination.",
      ]),
      s("li-env", "Enable + test", [
        "Add linkedin to AYRSHARE_PLATFORMS → restart.",
        "Publish one social item from ComfyMart → verify on LinkedIn.",
      ]),
    ],
    doNot: ["Do not assume personal LinkedIn if you meant a Company Page."],
    ayrshareTips: [
      "Platform id: `linkedin`.",
      "Free Ayrshare may prefix `[Sent with Free Plan]`.",
    ],
    commonFails: [
      "Authorized personal when you wanted Company Page.",
      "Missing Page admin rights on the linking user.",
    ],
  },
  {
    id: "twitter",
    name: "X / Twitter",
    accountType: "Brand X account",
    why: "Short posts. Linking often fails on X developer callback config.",
    needsMedia: false,
    doneWhen:
      "Ayrshare shows X/Twitter Linked and a ComfyMart post appears on the brand account.",
    steps: [
      s("x-account", "Create brand X account", [
        "x.com signup → brand handle + bio + website.",
      ]),
      s("x-ayrshare", "Link in Ayrshare", [
        "Ayrshare → Link X/Twitter.",
        "If link fails: Ayrshare docs → set exact callback URLs on your X Developer App (Production), permissions Read+Write.",
        "Optional ComfyMart env: X_CONSUMER_KEY / X_CONSUMER_SECRET (or AYRSHARE_TWITTER_*).",
      ]),
      s("x-env", "Enable + test", [
        "Add twitter (not x) to AYRSHARE_PLATFORMS → Publish test.",
      ]),
    ],
    doNot: [
      "Do not block the rest of onboarding if X linking fails — finish FB/IG/LinkedIn first.",
    ],
    ayrshareTips: ["Platform id: `twitter`."],
    commonFails: [
      "Callback URL mismatch.",
      "App is Read-only.",
    ],
  },
  {
    id: "threads",
    name: "Threads",
    accountType: "Threads on the brand Instagram",
    why: "Optional Meta text network after Instagram works.",
    needsMedia: false,
    doneWhen: "Ayrshare Threads Linked + test post visible.",
    steps: [
      s("th", "Enable Threads on brand IG, then link in Ayrshare", [
        "Activate Threads with the brand Instagram.",
        "Ayrshare → Link Threads → add threads to AYRSHARE_PLATFORMS → test Publish.",
      ]),
    ],
    doNot: ["Do not set up Threads before Instagram Ayrshare link works."],
    ayrshareTips: ["Platform id: `threads`."],
    commonFails: ["Instagram not Professional / not linked."],
  },
  {
    id: "pinterest",
    name: "Pinterest",
    accountType: "Pinterest Business + at least one board",
    why: "DIY / product discovery. Needs an image on every pin.",
    needsMedia: true,
    doneWhen: "Ayrshare Pinterest Linked + pin with image appears.",
    steps: [
      s("pin", "Business account + board + Ayrshare", [
        "Create Pinterest Business → create a board.",
        "Ayrshare → Link Pinterest → add pinterest to AYRSHARE_PLATFORMS.",
        "Publish a social item with media from ComfyMart.",
      ]),
    ],
    doNot: [],
    ayrshareTips: ["Platform id: `pinterest`."],
    commonFails: ["No image / no board."],
  },
  {
    id: "gmb",
    name: "Google Business",
    accountType: "Verified Google Business Profile",
    why: "Local search on Google Maps / Search. Only worth it if you can verify a location or service area.",
    needsMedia: false,
    doneWhen:
      "Profile is verified, Linked in Ayrshare (if your plan supports gmb), and a ComfyMart Publish appears on the GBP profile.",
    steps: [
      s("gmb-decide", "Decide: verify a location/service area, or skip GBP entirely", [
        "GBP helps only if you can verify a real address OR a service area on Google Maps.",
        "Online-only brands with no storefront and no public service area should skip GBP (leave gmb out of AYRSHARE_PLATFORMS) and use LinkedIn/Pinterest instead.",
        "Shade Mate–style AU product brands often use a service-area profile — only if you’re happy appearing on Maps.",
      ]),
      s("gmb-upsells", "Expect sales screens — almost always click Skip", [
        "After you create the profile, Google often shows extra offers. These are NOT required for ComfyMart or Ayrshare.",
        "“Claim your A$… advertising credit” / Google Ads → Skip (paid ads signup).",
        "“Get a custom email” / Google Workspace trial → Skip if you already have email (e.g. ImprovMX hello@yourdomain).",
        "Any other “Start a trial / Get premium / Boost with ads” → Skip unless you intentionally want that paid product.",
        "Rule of thumb: if it asks for a credit card or “start advertising,” it’s optional. Keep going until you see your Business Profile or a Verification step.",
      ]),
      s("gmb-create", "Create or claim the profile", [
        "Go to business.google.com → Add your business (or claim if it already exists).",
        "Business name = brand name (e.g. Shade Mate).",
        "Category = closest match from the brief suggestions on this page (not Home Builder unless you build homes).",
        "Location: physical shop → address; OR no shopfront → service-area business + regions you serve.",
        "Phone + website = your product URL (separate Website field — don’t put the URL in the description).",
        "Business description: paste the brief text on this page (no links, no “learn more at…”). Or Skip description and add later.",
      ]),
      s("gmb-verify", "Finish verification (this is the real finish line)", [
        "Complete verification however Google offers (postcard, phone, email, or video).",
        "Status must become verified/Active before Ayrshare linking counts as done.",
        "Postcard can take days — finish Facebook/Instagram/LinkedIn while you wait.",
      ]),
      s(
        "gmb-ads-credit",
        "Reminder: Ads credit screen → Skip",
        [
          "Paid Google Ads promo. Not needed for organic GBP or ComfyMart.",
          "Claim only if you deliberately want Google Ads now.",
        ],
        false,
      ),
      s(
        "gmb-workspace",
        "Reminder: Workspace / custom email trial → Skip",
        [
          "Paid Google email/Drive. Not needed if ImprovMX (or similar) already forwards hello@yourdomain.",
          "Start a trial only if you want Google Workspace as your mailbox.",
        ],
        false,
      ),
      s("gmb-ayrshare", "Link in Ayrshare only after verified", [
        "Ayrshare → Social Accounts → Link Google Business (platform id often gmb) when your plan offers it.",
        "Confirm the correct brand profile is selected.",
        "Add gmb to AYRSHARE_PLATFORMS only after it shows Linked.",
        "Restart / redeploy after env change.",
      ]),
      s("gmb-test", "Acceptance test", [
        "ComfyMart → Publish one social item → confirm it appears on the Google Business profile.",
      ]),
    ],
    doNot: [
      "Do not force GBP for online-only brands with no address and no service area.",
      "Do not add gmb to AYRSHARE_PLATFORMS before the profile is verified and Linked.",
      "Do not treat Ads credit, Workspace, or other Google upsells as required setup steps — Skip them.",
      "Do not put your website URL inside the business description (Google often shows Invalid value).",
      "Do not block the rest of onboarding while waiting on a verification postcard.",
    ],
    ayrshareTips: [
      "Platform id often `gmb` — confirm in Ayrshare for your plan.",
      "Verification delay is normal; organic social can go live without GBP.",
      "Google setup wizard = create profile + verify. Everything else in that flow is usually a sales pitch.",
    ],
    commonFails: [
      "Unverified profile — linking/posting blocked or useless.",
      "Stuck on Ads/Workspace screens thinking setup is broken — click Skip.",
      "Description Invalid value — remove URLs and “learn more” CTAs.",
      "gmb not available on your Ayrshare plan.",
      "Wrong business claimed (duplicate / old listing).",
    ],
  },
  {
    id: "tiktok",
    name: "TikTok",
    accountType: "Brand TikTok",
    why: "Needs video. Leave until you have video assets.",
    needsMedia: true,
    doneWhen: "Ayrshare Linked + video post succeeds.",
    steps: [
      s("tt", "Create account; link only when you have video", [
        "Create brand TikTok.",
        "Keep tiktok out of AYRSHARE_PLATFORMS until video URLs exist.",
      ]),
    ],
    doNot: ["Do not enable TikTok for still-image-only ComfyMart posts yet."],
    ayrshareTips: ["Platform id: `tiktok`."],
    commonFails: ["Still image / text-only rejected."],
  },
  {
    id: "youtube",
    name: "YouTube",
    accountType: "Brand Channel",
    why: "Needs video files. Later.",
    needsMedia: true,
    doneWhen: "Channel linked + video upload via Ayrshare works.",
    steps: [
      s("yt", "Create Brand Channel; defer Ayrshare until you have mp4s", [
        "YouTube Studio → Brand Channel.",
        "Keep youtube off AYRSHARE_PLATFORMS until video publish is ready.",
      ]),
    ],
    doNot: ["Do not send text SEO drafts to YouTube."],
    ayrshareTips: ["Platform id: `youtube`."],
    commonFails: ["No video file."],
  },
  {
    id: "bluesky",
    name: "Bluesky",
    accountType: "Brand Bluesky handle",
    why: "Optional extra text network.",
    needsMedia: false,
    doneWhen: "Ayrshare Linked + test post.",
    steps: [
      s("bsky", "Create handle → Link Ayrshare → add bluesky to env → test", [
        "bsky.app → brand handle.",
        "Ayrshare → Link → AYRSHARE_PLATFORMS includes bluesky → Publish test.",
      ]),
    ],
    doNot: [],
    ayrshareTips: ["Platform id: `bluesky`."],
    commonFails: ["Linked but missing from AYRSHARE_PLATFORMS."],
  },
  {
    id: "reddit",
    name: "Reddit",
    accountType: "Brand account (promo rules are strict)",
    why: "Community only. High ban risk if you spam.",
    needsMedia: false,
    doneWhen: "Manual/community posts that follow each sub’s rules.",
    steps: [
      s("reddit", "Account + read sub rules before any automation", [
        "Create account; build karma with helpful comments first.",
        "Prefer manual community drafts over blasting AYRSHARE_PLATFORMS.",
      ]),
    ],
    doNot: ["Do not auto-post the same launch promo to many subs."],
    ayrshareTips: ["Often keep Reddit out of default AYRSHARE_PLATFORMS."],
    commonFails: ["Promo spam bans."],
  },
  {
    id: "snapchat",
    name: "Snapchat",
    accountType: "Public Profile if available",
    why: "Usually later for this product type.",
    needsMedia: true,
    doneWhen: "Linked on a plan that supports Snapchat + successful post.",
    steps: [
      s("snap", "Only if you intentionally market there", [
        "Create Public Profile if eligible.",
        "Link in Ayrshare when your plan includes it.",
      ]),
    ],
    doNot: ["Do not enable during core FB/IG/LinkedIn onboarding."],
    ayrshareTips: ["Leave off AYRSHARE_PLATFORMS by default."],
    commonFails: ["Profile unavailable in region."],
  },
  {
    id: "telegram",
    name: "Telegram",
    accountType: "Public channel",
    why: "Broadcast list — niche unless you build a community.",
    needsMedia: false,
    doneWhen: "Public channel linked in Ayrshare + test message.",
    steps: [
      s("tg", "Public channel + Ayrshare bot/link flow", [
        "Create public channel.",
        "Follow Ayrshare’s Telegram link steps → add telegram to env only if this channel is the destination.",
      ]),
    ],
    doNot: ["Do not link a private group by mistake."],
    ayrshareTips: ["Platform id: `telegram`."],
    commonFails: ["Wrong chat vs channel."],
  },
];

export type RecommendedPlatform = PlatformSetupGuide & {
  priority: SetupPriority;
  reason: string;
};

export function recommendPlatforms(
  brief: BrandBrief | null,
): RecommendedPlatform[] {
  const channels = (brief?.channels ?? []).map((c) => c.toLowerCase());
  const blob = [
    brief?.summary,
    brief?.audience,
    brief?.usp,
    brief?.keywords?.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const productDtc =
    /homeowner|diy|aussie|australia|product|cover|shop|consumer|retail/.test(
      blob,
    );
  const local =
    /qld|nsw|vic|wa|nt|local|suburb|install|tradie|service area/.test(blob);
  const b2b = /b2b|agency|saas|enterprise|wholesale|supplier/.test(blob);
  const wantsSocial =
    channels.some((c) => c.includes("social")) || channels.length === 0;
  const wantsCommunity = channels.some((c) => c.includes("community"));

  const priorityFor = (
    id: AyrsharePlatformId,
  ): { priority: SetupPriority; reason: string } => {
    switch (id) {
      case "facebook":
        return wantsSocial && productDtc
          ? { priority: "must", reason: "Brand Page destination for Ayrshare." }
          : {
              priority: "recommended",
              reason: "Reliable Page destination for Ayrshare.",
            };
      case "instagram":
        return wantsSocial
          ? {
              priority: "must",
              reason: "Visual posts; ComfyMart attaches media.",
            }
          : { priority: "recommended", reason: "Pair with Facebook when ready." };
      case "linkedin":
        return b2b
          ? { priority: "must", reason: "B2B / company trust." }
          : {
              priority: "recommended",
              reason: "Solid text channel while other networks warm up.",
            };
      case "twitter":
        return {
          priority: "optional",
          reason: "Finish FB/IG first; X linking is often flaky.",
        };
      case "threads":
        return {
          priority: "optional",
          reason: "After Instagram Ayrshare link works.",
        };
      case "pinterest":
        return productDtc
          ? {
              priority: "recommended",
              reason: "DIY / home discovery fits this product class.",
            }
          : {
              priority: "later",
              reason: "Add when you have pin-ready creatives.",
            };
      case "gmb":
        return local
          ? {
              priority: "recommended",
              reason: "Audience looks local — GBP helps search.",
            }
          : {
              priority: "later",
              reason: "Skip if you have no verifiable location.",
            };
      case "tiktok":
      case "youtube":
        return { priority: "later", reason: "Needs video assets." };
      case "reddit":
        return wantsCommunity
          ? {
              priority: "optional",
              reason: "Value-first community only.",
            }
          : { priority: "later", reason: "High moderation risk." };
      case "bluesky":
        return {
          priority: "optional",
          reason: "Extra text network after core three.",
        };
      case "snapchat":
      case "telegram":
        return {
          priority: "later",
          reason: "Low priority for most product brands.",
        };
      default:
        return { priority: "later", reason: "" };
    }
  };

  const order: Record<SetupPriority, number> = {
    must: 0,
    recommended: 1,
    optional: 2,
    later: 3,
  };

  return AYRSHARE_PLATFORM_GUIDES.map((g) => {
    const { priority, reason } = priorityFor(g.id);
    return { ...g, priority, reason };
  }).sort(
    (a, b) =>
      order[a.priority] - order[b.priority] || a.name.localeCompare(b.name),
  );
}

export function suggestedPlatformsEnv(brief: BrandBrief | null): string {
  const rec = recommendPlatforms(brief);
  const ids = rec
    .filter((p) => p.priority === "must" || p.priority === "recommended")
    .filter((p) => p.id !== "tiktok" && p.id !== "youtube")
    .map((p) => p.id);
  return ids.join(",");
}

/** Required steps only (for progress auto-complete). */
export function requiredSteps(guide: PlatformSetupGuide): SetupStep[] {
  return guide.steps.filter((st) => st.required !== false);
}

export type BriefSetupHints = {
  categories: string[];
  primaryCategory: string;
  businessDescription: string;
  pageBio: string;
  serviceAreaHint: string | null;
};

/** Personalize setup copy from the project brand brief (GBP, FB bio, etc.). */
export function briefSetupHints(
  brief: BrandBrief | null,
  projectName: string,
  websiteUrl?: string | null,
): BriefSetupHints {
  const site =
    websiteUrl?.replace(/^https?:\/\//, "").replace(/\/$/, "") ||
    "your website";
  const usp = brief?.usp?.trim() || brief?.summary?.trim() || projectName;
  const audience = brief?.audience?.trim() || "local customers";
  const blob = [brief?.summary, brief?.usp, brief?.keywords?.join(" "), audience]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const categories: string[] = [];
  const push = (c: string) => {
    if (!categories.includes(c)) categories.push(c);
  };

  if (/aircon|air.?cond|hvac|outdoor unit|split.?system/.test(blob)) {
    push("Air conditioning repair service");
    push("Appliance store");
    push("Home improvement store");
    push("Hardware store");
  }
  if (/cover|accessory|diy|product|retail|shop|e-?commerce/.test(blob)) {
    push("Home goods store");
    push("Shopping service");
    push("Manufacturer");
  }
  if (/tradie|install|service|repair/.test(blob)) {
    push("Home improvement service");
  }
  // Safe defaults if brief is thin
  push("Home improvement store");
  push("Hardware store");
  push("Home goods store");
  push("Manufacturer");

  const primaryCategory =
    categories.find((c) => c === "Home improvement store") ||
    categories.find((c) => c === "Home goods store") ||
    categories[0];

  const serviceAreaHint = /qld|nt|wa|nsw|vic|australia|aussie|coastal/.test(
    blob,
  )
    ? "If no shopfront: choose service-area business and use regions from your audience (e.g. QLD, NT, coastal WA) — only if you want that on Maps."
    : "If no shopfront: service-area business for regions you actually serve, or skip GBP.";

  const plainUsp = usp
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b[\w.-]+\.(xyz|com|net|au|app|io)\b/gi, "")
    .replace(/[—–]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  const businessDescription = [
    `${projectName} provides ${plainUsp}`,
    `Made for ${audience}.`,
    "Reflective top cover for outdoor split-system units. Snaps on in under a minute with no tools. Helps units run cooler and last longer through harsh sun, dust, and bird mess while keeping airflow clear.",
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 740);

  const pageBio = `${usp.slice(0, 80)}${usp.length > 80 ? "…" : ""} ${site}`.slice(
    0,
    100,
  );

  return {
    categories: categories.slice(0, 6),
    primaryCategory,
    businessDescription,
    pageBio,
    serviceAreaHint,
  };
}

/**
 * Inject brief-based category + description into Google Business (and FB bio) steps.
 */
export function personalizeGuide<T extends PlatformSetupGuide>(
  guide: T,
  hints: BriefSetupHints,
  projectName: string,
  websiteUrl?: string | null,
): T {
  const site = websiteUrl?.trim() || "https://your-site.example";

  if (guide.id === "gmb") {
    return {
      ...guide,
      steps: guide.steps.map((st) => {
        if (st.id === "gmb-create") {
          return {
            ...st,
            how: [
              "Go to business.google.com → Add your business (or claim if it already exists).",
              `Business name = ${projectName}.`,
              `Try categories in this order (Google’s list is limited — pick the closest): ${hints.categories.join(" · ")}.`,
              `Primary suggestion: “${hints.primaryCategory}”. Avoid unrelated categories (e.g. Home Builder) unless you actually build homes.`,
              hints.serviceAreaHint ??
                "Location: shop address, OR service-area business if you have no storefront.",
              `Phone + website = ${site}.`,
              "On “Add business description”, paste the brief-based description shown above (no website URL, no phone, no “click here” — Google often rejects those as Invalid value). Or Skip and add later.",
            ],
          };
        }
        if (st.id === "gmb-decide") {
          return {
            ...st,
            how: [
              "GBP is worth it only if you can verify a real address OR a service area on Google Maps.",
              "Online-only brands with no storefront and no public service area should skip GBP and use LinkedIn/Pinterest instead.",
              hints.serviceAreaHint ?? "",
            ].filter(Boolean),
          };
        }
        return st;
      }),
    };
  }

  if (guide.id === "facebook") {
    return {
      ...guide,
      steps: guide.steps.map((st) => {
        if (st.id === "fb-create") {
          return {
            ...st,
            how: [
              "facebook.com/pages/create",
              `Page name = ${projectName}. Category = closest match (Product/service or Shopping).`,
              `Bio (optional): ${hints.pageBio}`,
              "Create Page. Do not use your personal profile as the destination.",
            ],
          };
        }
        if (st.id === "fb-about") {
          return {
            ...st,
            how: [
              "Page → About / Page info → Website = your product URL.",
              `Website: ${site}`,
              "Add profile + cover images when ready (can wait).",
            ],
          };
        }
        return st;
      }),
    };
  }

  if (guide.id === "instagram") {
    return {
      ...guide,
      steps: guide.steps.map((st) => {
        if (st.id === "ig-profile") {
          return {
            ...st,
            how: [
              "Profile → Edit profile.",
              `Name = ${projectName}.`,
              `Bio (short USP): ${hints.pageBio}`,
              `Website = ${site}.`,
              "Add a profile photo when you can.",
            ],
          };
        }
        return st;
      }),
    };
  }

  return guide;
}
