import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "admin",
  "manager",
  "viewer",
]);

export const planEnum = pgEnum("plan", [
  "starter",
  "growth",
  "enterprise",
  "agency",
]);

export const outreachChannelEnum = pgEnum("outreach_channel", [
  "tiktok_dm",
  "tiktok_invite",
  "email",
]);

export const outreachStatusEnum = pgEnum("outreach_status", [
  "pending",
  "sent",
  "delivered",
  "opened",
  "replied",
  "failed",
  "bounced",
]);

export const pipelineStageEnum = pgEnum("pipeline_stage", [
  "discovered",
  "contacted",
  "negotiating",
  "active",
  "inactive",
]);

export const sparkCodeStatusEnum = pgEnum("spark_code_status", [
  "requested",
  "received",
  "active",
  "expired",
]);

// ─── Tenants ─────────────────────────────────────────────

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  plan: planEnum("plan").default("starter").notNull(),
  locale: varchar("locale", { length: 10 }).default("en").notNull(),
  timezone: varchar("timezone", { length: 50 }).default("UTC").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Users ───────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }),
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").default("viewer").notNull(),
    locale: varchar("locale", { length: 10 }).default("en").notNull(),
    avatarUrl: text("avatar_url"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    index("users_tenant_idx").on(table.tenantId),
  ]
);

// ─── Shops ───────────────────────────────────────────────

export const shops = pgTable(
  "shops",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    tiktokShopId: varchar("tiktok_shop_id", { length: 255 }),
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 100 }),
    apiKeyEncrypted: text("api_key_encrypted"),
    apiSecretEncrypted: text("api_secret_encrypted"),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("shops_tenant_idx").on(table.tenantId)]
);

// ─── Products ────────────────────────────────────────────

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    tiktokProductId: varchar("tiktok_product_id", { length: 255 }),
    name: varchar("name", { length: 500 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 255 }),
    price: decimal("price", { precision: 12, scale: 2 }),
    currency: varchar("currency", { length: 3 }).default("USD").notNull(),
    commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
    imageUrl: text("image_url"),
    targetGender: varchar("target_gender", { length: 20 }),
    targetAgeMin: integer("target_age_min"),
    targetAgeMax: integer("target_age_max"),
    targetKeywords: jsonb("target_keywords").$type<string[]>(),
    aiProfileData: jsonb("ai_profile_data"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("products_shop_idx").on(table.shopId),
    index("products_tenant_idx").on(table.tenantId),
    index("products_category_idx").on(table.category),
  ]
);

// ─── Creators ────────────────────────────────────────────

export const creators = pgTable(
  "creators",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tiktokId: varchar("tiktok_id", { length: 255 }),
    username: varchar("username", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 255 }),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    followers: integer("followers").default(0).notNull(),
    following: integer("following").default(0),
    totalVideos: integer("total_videos").default(0),
    avgViews: integer("avg_views").default(0),
    avgLikes: integer("avg_likes").default(0),
    engagementRate: decimal("engagement_rate", { precision: 6, scale: 4 }),
    gmv: decimal("gmv", { precision: 14, scale: 2 }).default("0"),
    totalSales: integer("total_sales").default(0),
    aov: decimal("aov", { precision: 10, scale: 2 }),
    category: varchar("category", { length: 100 }),
    subcategories: jsonb("subcategories").$type<string[]>(),
    country: varchar("country", { length: 2 }),
    language: varchar("language", { length: 10 }),
    email: varchar("email", { length: 255 }),
    trustScore: integer("trust_score"),
    audienceDemographics: jsonb("audience_demographics").$type<{
      genderSplit: { male: number; female: number; other: number };
      ageGroups: Record<string, number>;
      topCountries: Record<string, number>;
    }>(),
    contentStyles: jsonb("content_styles").$type<string[]>(),
    isTiktokShopCreator: boolean("is_tiktok_shop_creator").default(false),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
    dataUpdatedAt: timestamp("data_updated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("creators_tiktok_id_idx").on(table.tiktokId),
    index("creators_username_idx").on(table.username),
    index("creators_category_idx").on(table.category),
    index("creators_country_idx").on(table.country),
    index("creators_followers_idx").on(table.followers),
    index("creators_gmv_idx").on(table.gmv),
    index("creators_engagement_idx").on(table.engagementRate),
  ]
);

// ─── Creator Lists (Saved Searches) ─────────────────────

export const creatorLists = pgTable(
  "creator_lists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("creator_lists_tenant_idx").on(table.tenantId)]
);

export const creatorListMembers = pgTable(
  "creator_list_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listId: uuid("list_id")
      .references(() => creatorLists.id, { onDelete: "cascade" })
      .notNull(),
    creatorId: uuid("creator_id")
      .references(() => creators.id, { onDelete: "cascade" })
      .notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("creator_list_members_unique").on(table.listId, table.creatorId),
  ]
);

// ─── CRM: Creator-Tenant Relationship ───────────────────

export const creatorRelationships = pgTable(
  "creator_relationships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    creatorId: uuid("creator_id")
      .references(() => creators.id, { onDelete: "cascade" })
      .notNull(),
    stage: pipelineStageEnum("stage").default("discovered").notNull(),
    assignedTo: uuid("assigned_to").references(() => users.id),
    tags: jsonb("tags").$type<string[]>(),
    notes: text("notes"),
    lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("creator_relationships_unique").on(table.tenantId, table.creatorId),
    index("creator_relationships_stage_idx").on(table.stage),
    index("creator_relationships_tenant_idx").on(table.tenantId),
  ]
);

// ─── Outreach Templates ─────────────────────────────────

export const outreachTemplates = pgTable(
  "outreach_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    locale: varchar("locale", { length: 10 }).default("en").notNull(),
    channel: outreachChannelEnum("channel").notNull(),
    subject: text("subject"),
    body: text("body").notNull(),
    variables: jsonb("variables").$type<string[]>(),
    isDefault: boolean("is_default").default(false),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("outreach_templates_tenant_idx").on(table.tenantId),
    uniqueIndex("outreach_templates_name_locale_idx").on(
      table.tenantId,
      table.name,
      table.locale
    ),
  ]
);

// ─── Outreach Campaigns ─────────────────────────────────

export const outreachCampaigns = pgTable(
  "outreach_campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    shopId: uuid("shop_id").references(() => shops.id),
    name: varchar("name", { length: 255 }).notNull(),
    status: varchar("status", { length: 20 }).default("draft").notNull(),
    templateId: uuid("template_id").references(() => outreachTemplates.id),
    targetListId: uuid("target_list_id").references(() => creatorLists.id),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    config: jsonb("config"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("outreach_campaigns_tenant_idx").on(table.tenantId)]
);

// ─── Outreach Messages ──────────────────────────────────

export const outreachMessages = pgTable(
  "outreach_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    campaignId: uuid("campaign_id").references(() => outreachCampaigns.id),
    creatorId: uuid("creator_id")
      .references(() => creators.id)
      .notNull(),
    channel: outreachChannelEnum("channel").notNull(),
    status: outreachStatusEnum("status").default("pending").notNull(),
    subject: text("subject"),
    body: text("body").notNull(),
    locale: varchar("locale", { length: 10 }).default("en"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    repliedAt: timestamp("replied_at", { withTimezone: true }),
    failReason: text("fail_reason"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("outreach_messages_tenant_idx").on(table.tenantId),
    index("outreach_messages_creator_idx").on(table.creatorId),
    index("outreach_messages_campaign_idx").on(table.campaignId),
    index("outreach_messages_status_idx").on(table.status),
  ]
);

// ─── Content ─────────────────────────────────────────────

export const contents = pgTable(
  "contents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    creatorId: uuid("creator_id")
      .references(() => creators.id)
      .notNull(),
    productId: uuid("product_id").references(() => products.id),
    tiktokVideoId: varchar("tiktok_video_id", { length: 255 }),
    tiktokUrl: text("tiktok_url"),
    title: text("title"),
    views: integer("views").default(0),
    likes: integer("likes").default(0),
    comments: integer("comments").default(0),
    shares: integer("shares").default(0),
    conversions: integer("conversions").default(0),
    gmv: decimal("gmv", { precision: 14, scale: 2 }).default("0"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("contents_tenant_idx").on(table.tenantId),
    index("contents_creator_idx").on(table.creatorId),
    index("contents_product_idx").on(table.productId),
  ]
);

// ─── Spark Codes ─────────────────────────────────────────

export const sparkCodes = pgTable(
  "spark_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    contentId: uuid("content_id").references(() => contents.id),
    creatorId: uuid("creator_id")
      .references(() => creators.id)
      .notNull(),
    code: varchar("code", { length: 255 }).notNull(),
    status: sparkCodeStatusEnum("status").default("requested").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("spark_codes_tenant_idx").on(table.tenantId),
    index("spark_codes_creator_idx").on(table.creatorId),
  ]
);

// ─── Activity Log ────────────────────────────────────────

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").references(() => users.id),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    action: varchar("action", { length: 50 }).notNull(),
    details: jsonb("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("activity_logs_tenant_idx").on(table.tenantId),
    index("activity_logs_entity_idx").on(table.entityType, table.entityId),
  ]
);
