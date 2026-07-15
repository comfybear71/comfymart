import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  jsonb,
  pgEnum,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// Auth.js v5 adapter schema — do not rename these columns.
// The email-verification date column is camelCased by convention.

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// App tables

export const membershipRole = pgEnum("membership_role", ["owner", "member"]);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("organizations_slug_unique").on(t.slug)],
);

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: membershipRole("role").notNull().default("member"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("memberships_org_user_unique").on(t.orgId, t.userId),
    index("memberships_user_idx").on(t.userId),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    websiteUrl: text("website_url"),
    brandTone: jsonb("brand_tone"),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("projects_org_slug_unique").on(t.orgId, t.slug),
    index("projects_org_idx").on(t.orgId),
  ],
);

export const campaignStatus = pgEnum("campaign_status", [
  "draft",
  "generating",
  "ready",
  "archived",
]);

export const campaignItemStatus = pgEnum("campaign_item_status", [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "scheduled",
  "published",
  "failed",
]);

export const campaignChannel = pgEnum("campaign_channel", [
  "social",
  "email",
  "content",
  "seo",
  "community",
]);

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    playbook: text("playbook").notNull().default("startup_launch"),
    status: campaignStatus("status").notNull().default("draft"),
    briefSnapshot: jsonb("brief_snapshot"),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("campaigns_project_idx").on(t.projectId)],
);

export const campaignItems = pgTable(
  "campaign_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    channel: campaignChannel("channel").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    dayOffset: integer("day_offset").notNull().default(0),
    status: campaignItemStatus("status").notNull().default("pending_approval"),
    metadata: jsonb("metadata"),
    scheduledFor: timestamp("scheduled_for", { mode: "date" }),
    publishedAt: timestamp("published_at", { mode: "date" }),
    publishError: text("publish_error"),
    externalId: text("external_id"),
    reviewedAt: timestamp("reviewed_at", { mode: "date" }),
    reviewedBy: text("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("campaign_items_campaign_idx").on(t.campaignId),
    index("campaign_items_status_idx").on(t.status),
  ],
);

export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type CampaignItem = typeof campaignItems.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type NewMembership = typeof memberships.$inferInsert;
export type NewProject = typeof projects.$inferInsert;
export type NewCampaign = typeof campaigns.$inferInsert;
export type NewCampaignItem = typeof campaignItems.$inferInsert;
