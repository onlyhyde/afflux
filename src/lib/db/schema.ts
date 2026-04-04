import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
  check,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════

export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "admin",
  "manager",
  "viewer",
]);

export const planEnum = pgEnum("plan", [
  "free",
  "starter",
  "growth",
  "enterprise",
  "agency",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "cancelled",
  "trialing",
  "paused",
]);

export const outreachChannelEnum = pgEnum("outreach_channel", [
  "tiktok_dm",
  "tiktok_invite",
  "email",
]);

export const outreachStatusEnum = pgEnum("outreach_status", [
  "pending",
  "queued",
  "sent",
  "delivered",
  "opened",
  "replied",
  "failed",
  "bounced",
]);

export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "scheduled",
  "running",
  "paused",
  "completed",
  "cancelled",
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

export const targetGenderEnum = pgEnum("target_gender", [
  "male",
  "female",
  "all",
]);

export const activityActionEnum = pgEnum("activity_action", [
  "create",
  "update",
  "delete",
  "view",
  "send",
  "approve",
  "reject",
  "login",
  "logout",
]);

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "expired",
  "revoked",
]);

export const sampleStatusEnum = pgEnum("sample_status", [
  "requested",
  "approved",
  "rejected",
  "shipped",
  "delivered",
  "content_pending",
  "completed",
]);

export const contestStatusEnum = pgEnum("contest_status", [
  "draft",
  "active",
  "ended",
  "settled",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "system",
  "campaign",
  "creator_reply",
  "sample_request",
  "content_uploaded",
  "spark_code_expiring",
  "billing",
]);

export const webhookStatusEnum = pgEnum("webhook_status", [
  "received",
  "processing",
  "processed",
  "failed",
]);

// ═══════════════════════════════════════════════════════════
// CORE: TENANTS & USERS
// ═══════════════════════════════════════════════════════════

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    plan: planEnum("plan").default("free").notNull(),
    locale: varchar("locale", { length: 10 }).default("en").notNull(),
    timezone: text("timezone").default("UTC").notNull(),
    currency: varchar("currency", { length: 3 }).default("USD").notNull(),
    logoUrl: text("logo_url"),
    isActive: boolean("is_active").default(true).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("tenants_currency_check", sql`char_length(${table.currency}) = 3`),
  ]
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").default("viewer").notNull(),
    locale: varchar("locale", { length: 10 }).default("en").notNull(),
    avatarUrl: text("avatar_url"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    lastLoginIp: text("last_login_ip"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email).where(sql`${table.deletedAt} IS NULL`),
    index("users_tenant_idx").on(table.tenantId),
  ]
);

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    email: text("email").notNull(),
    role: userRoleEnum("role").default("viewer").notNull(),
    status: invitationStatusEnum("status").default("pending").notNull(),
    invitedBy: uuid("invited_by")
      .references(() => users.id, { onDelete: "set null" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("invitations_tenant_idx").on(table.tenantId),
    uniqueIndex("invitations_token_idx").on(table.token),
  ]
);

// Admin users — separate from tenant users for security isolation
export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    lastLoginIp: text("last_login_ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("admin_users_email_idx").on(table.email)]
);

// ═══════════════════════════════════════════════════════════
// BILLING & SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    plan: planEnum("plan").notNull(),
    status: subscriptionStatusEnum("status").default("active").notNull(),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("subscriptions_tenant_idx").on(table.tenantId),
    index("subscriptions_stripe_customer_idx").on(table.stripeCustomerId),
  ]
);

export const billingEvents = pgTable(
  "billing_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    subscriptionId: uuid("subscription_id")
      .references(() => subscriptions.id, { onDelete: "set null" }),
    stripeEventId: text("stripe_event_id"),
    eventType: text("event_type").notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }),
    currency: varchar("currency", { length: 3 }).default("USD"),
    details: jsonb("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("billing_events_tenant_idx").on(table.tenantId),
    uniqueIndex("billing_events_stripe_event_idx").on(table.stripeEventId),
  ]
);

// ═══════════════════════════════════════════════════════════
// SHOPS & PRODUCTS
// ═══════════════════════════════════════════════════════════

export const shops = pgTable(
  "shops",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    tiktokShopId: text("tiktok_shop_id"),
    name: text("name").notNull(),
    category: text("category"),
    apiKeyEncrypted: text("api_key_encrypted"),
    apiSecretEncrypted: text("api_secret_encrypted"),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
    isActive: boolean("is_active").default(true).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("shops_tenant_idx").on(table.tenantId),
    uniqueIndex("shops_tiktok_shop_id_idx").on(table.tiktokShopId).where(sql`${table.tiktokShopId} IS NOT NULL`),
  ]
);

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
    tiktokProductId: text("tiktok_product_id"),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category"),
    price: decimal("price", { precision: 12, scale: 2 }),
    currency: varchar("currency", { length: 3 }).default("USD").notNull(),
    commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
    imageUrl: text("image_url"),
    targetGender: targetGenderEnum("target_gender"),
    targetAgeMin: integer("target_age_min"),
    targetAgeMax: integer("target_age_max"),
    targetKeywords: jsonb("target_keywords").$type<string[]>(),
    aiProfileData: jsonb("ai_profile_data"),
    isActive: boolean("is_active").default(true).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("products_shop_idx").on(table.shopId).where(sql`${table.deletedAt} IS NULL`),
    index("products_tenant_idx").on(table.tenantId),
    index("products_category_idx").on(table.category),
    check("products_price_positive", sql`${table.price} > 0 OR ${table.price} IS NULL`),
    check("products_commission_range", sql`${table.commissionRate} BETWEEN 0 AND 100 OR ${table.commissionRate} IS NULL`),
    check("products_age_range", sql`${table.targetAgeMin} < ${table.targetAgeMax} OR ${table.targetAgeMin} IS NULL OR ${table.targetAgeMax} IS NULL`),
  ]
);

// ═══════════════════════════════════════════════════════════
// CREATORS (Global shared table — no tenantId)
// ═══════════════════════════════════════════════════════════

export const creators = pgTable(
  "creators",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tiktokId: text("tiktok_id"),
    username: text("username").notNull(),
    displayName: text("display_name"),
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
    category: text("category"),
    subcategories: jsonb("subcategories").$type<string[]>(),
    country: varchar("country", { length: 2 }),
    language: varchar("language", { length: 10 }),
    email: text("email"),
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
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("creators_tiktok_id_idx").on(table.tiktokId).where(sql`${table.tiktokId} IS NOT NULL`),
    uniqueIndex("creators_username_idx").on(table.username).where(sql`${table.deletedAt} IS NULL`),
    index("creators_category_idx").on(table.category),
    index("creators_country_idx").on(table.country),
    index("creators_followers_idx").on(table.followers),
    index("creators_gmv_idx").on(table.gmv),
    index("creators_engagement_idx").on(table.engagementRate),
    check("creators_followers_positive", sql`${table.followers} >= 0`),
    check("creators_engagement_positive", sql`${table.engagementRate} >= 0 OR ${table.engagementRate} IS NULL`),
    check("creators_gmv_positive", sql`${table.gmv} >= 0 OR ${table.gmv} IS NULL`),
    check("creators_trust_score_range", sql`${table.trustScore} BETWEEN 0 AND 100 OR ${table.trustScore} IS NULL`),
    // GIN indexes for JSONB columns (AI matching engine filters)
    // Note: These are added via raw SQL migration since Drizzle doesn't support USING gin
  ]
);

// ═══════════════════════════════════════════════════════════
// CREATOR LISTS
// ═══════════════════════════════════════════════════════════

export const creatorLists = pgTable(
  "creator_lists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("creator_lists_tenant_idx").on(table.tenantId)]
);

export const creatorListMembers = pgTable(
  "creator_list_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
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
    index("creator_list_members_list_idx").on(table.listId),
    index("creator_list_members_creator_idx").on(table.creatorId),
    index("creator_list_members_tenant_idx").on(table.tenantId),
  ]
);

// ═══════════════════════════════════════════════════════════
// CRM: CREATOR-TENANT RELATIONSHIPS
// ═══════════════════════════════════════════════════════════

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
    assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
    tags: jsonb("tags").$type<string[]>(),
    notes: text("notes"),
    commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
    lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("creator_relationships_unique").on(table.tenantId, table.creatorId),
    index("creator_relationships_tenant_stage_idx").on(table.tenantId, table.stage),
    index("creator_relationships_assigned_idx").on(table.assignedTo),
  ]
);

// ═══════════════════════════════════════════════════════════
// OUTREACH: TEMPLATES, CAMPAIGNS, MESSAGES
// ═══════════════════════════════════════════════════════════

export const outreachTemplates = pgTable(
  "outreach_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    locale: varchar("locale", { length: 10 }).default("en").notNull(),
    channel: outreachChannelEnum("channel").notNull(),
    subject: text("subject"),
    body: text("body").notNull(),
    variables: jsonb("variables").$type<string[]>(),
    isDefault: boolean("is_default").default(false),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("outreach_templates_tenant_idx").on(table.tenantId),
    uniqueIndex("outreach_templates_name_locale_idx").on(
      table.tenantId,
      table.name,
      table.locale
    ).where(sql`${table.deletedAt} IS NULL`),
  ]
);

export const outreachCampaigns = pgTable(
  "outreach_campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    status: campaignStatusEnum("status").default("draft").notNull(),
    templateId: uuid("template_id").references(() => outreachTemplates.id, { onDelete: "set null" }),
    targetListId: uuid("target_list_id").references(() => creatorLists.id, { onDelete: "set null" }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    config: jsonb("config"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("outreach_campaigns_tenant_idx").on(table.tenantId),
    index("outreach_campaigns_tenant_status_idx").on(table.tenantId, table.status),
  ]
);

export const outreachMessages = pgTable(
  "outreach_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "set null" }),
    campaignId: uuid("campaign_id").references(() => outreachCampaigns.id, { onDelete: "set null" }),
    creatorId: uuid("creator_id")
      .references(() => creators.id, { onDelete: "set null" })
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
    index("outreach_messages_tenant_status_idx").on(table.tenantId, table.status),
    index("outreach_messages_tenant_sent_idx").on(table.tenantId, table.sentAt),
    index("outreach_messages_creator_idx").on(table.creatorId),
    index("outreach_messages_campaign_idx").on(table.campaignId),
  ]
);

// ═══════════════════════════════════════════════════════════
// SAMPLES (F4)
// ═══════════════════════════════════════════════════════════

export const samples = pgTable(
  "samples",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    creatorId: uuid("creator_id")
      .references(() => creators.id, { onDelete: "set null" })
      .notNull(),
    status: sampleStatusEnum("status").default("requested").notNull(),
    shippingAddress: jsonb("shipping_address"),
    trackingNumber: text("tracking_number"),
    trackingUrl: text("tracking_url"),
    contentDueAt: timestamp("content_due_at", { withTimezone: true }),
    approvedBy: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("samples_tenant_idx").on(table.tenantId),
    index("samples_tenant_status_idx").on(table.tenantId, table.status),
    index("samples_creator_idx").on(table.creatorId),
    index("samples_product_idx").on(table.productId),
  ]
);

// ═══════════════════════════════════════════════════════════
// CONTENT & SPARK CODES
// ═══════════════════════════════════════════════════════════

export const contents = pgTable(
  "contents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    creatorId: uuid("creator_id")
      .references(() => creators.id, { onDelete: "set null" })
      .notNull(),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    campaignId: uuid("campaign_id").references(() => outreachCampaigns.id, { onDelete: "set null" }),
    tiktokVideoId: text("tiktok_video_id"),
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
    index("contents_tenant_published_idx").on(table.tenantId, table.publishedAt),
    index("contents_creator_idx").on(table.creatorId),
    index("contents_product_idx").on(table.productId),
    index("contents_campaign_idx").on(table.campaignId),
  ]
);

export const sparkCodes = pgTable(
  "spark_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    contentId: uuid("content_id").references(() => contents.id, { onDelete: "set null" }),
    creatorId: uuid("creator_id")
      .references(() => creators.id, { onDelete: "set null" })
      .notNull(),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    code: text("code").notNull(),
    status: sparkCodeStatusEnum("status").default("requested").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("spark_codes_tenant_idx").on(table.tenantId),
    index("spark_codes_creator_idx").on(table.creatorId),
    index("spark_codes_content_idx").on(table.contentId),
    index("spark_codes_status_expires_idx").on(table.status, table.expiresAt),
    uniqueIndex("spark_codes_code_idx").on(table.code),
  ]
);

// ═══════════════════════════════════════════════════════════
// CONTESTS (F10)
// ═══════════════════════════════════════════════════════════

export const contests = pgTable(
  "contests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    status: contestStatusEnum("status").default("draft").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    rules: jsonb("rules"),
    prizes: jsonb("prizes"),
    rankingMetric: text("ranking_metric").default("gmv"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("contests_tenant_idx").on(table.tenantId),
    index("contests_tenant_status_idx").on(table.tenantId, table.status),
  ]
);

export const contestParticipants = pgTable(
  "contest_participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contestId: uuid("contest_id")
      .references(() => contests.id, { onDelete: "cascade" })
      .notNull(),
    creatorId: uuid("creator_id")
      .references(() => creators.id, { onDelete: "cascade" })
      .notNull(),
    gmv: decimal("gmv", { precision: 14, scale: 2 }).default("0"),
    contentCount: integer("content_count").default(0),
    totalViews: integer("total_views").default(0),
    rank: integer("rank"),
    prizeAmount: decimal("prize_amount", { precision: 12, scale: 2 }),
    settledAt: timestamp("settled_at", { withTimezone: true }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("contest_participants_unique").on(table.contestId, table.creatorId),
    index("contest_participants_contest_idx").on(table.contestId),
    index("contest_participants_creator_idx").on(table.creatorId),
  ]
);

// ═══════════════════════════════════════════════════════════
// COMPETITOR MONITORING (F9)
// ═══════════════════════════════════════════════════════════

export const competitorBrands = pgTable(
  "competitor_brands",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    tiktokShopUrl: text("tiktok_shop_url"),
    category: text("category"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("competitor_brands_tenant_idx").on(table.tenantId)]
);

// ═══════════════════════════════════════════════════════════
// SYSTEM: NOTIFICATIONS, WEBHOOKS, CONFIG, AI USAGE
// ═══════════════════════════════════════════════════════════

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_unread_idx").on(table.userId, table.isRead),
    index("notifications_tenant_idx").on(table.tenantId),
  ]
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: text("source").notNull(),
    eventType: text("event_type").notNull(),
    status: webhookStatusEnum("status").default("received").notNull(),
    payload: jsonb("payload").notNull(),
    errorMessage: text("error_message"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    retryCount: integer("retry_count").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("webhook_events_source_type_idx").on(table.source, table.eventType),
    index("webhook_events_status_idx").on(table.status),
  ]
);

export const systemConfigs = pgTable(
  "system_configs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: jsonb("value").notNull(),
    description: text("description"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("system_configs_tenant_key_idx").on(table.tenantId, table.key),
  ]
);

export const aiUsageLogs = pgTable(
  "ai_usage_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    feature: text("feature").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").default(0),
    outputTokens: integer("output_tokens").default(0),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("ai_usage_logs_tenant_idx").on(table.tenantId),
    index("ai_usage_logs_tenant_feature_idx").on(table.tenantId, table.feature),
    index("ai_usage_logs_created_idx").on(table.createdAt),
  ]
);

export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    bucketKey: text("bucket_key").notNull(),
    count: integer("count").default(0).notNull(),
    limit: integer("limit").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    windowEnd: timestamp("window_end", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("rate_limit_buckets_tenant_key_idx").on(table.tenantId, table.bucketKey),
  ]
);

// ═══════════════════════════════════════════════════════════
// ACTIVITY LOGS (Audit Trail)
// ═══════════════════════════════════════════════════════════

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    action: activityActionEnum("action").notNull(),
    details: jsonb("details"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("activity_logs_tenant_idx").on(table.tenantId),
    index("activity_logs_entity_idx").on(table.entityType, table.entityId),
    index("activity_logs_user_idx").on(table.userId),
    index("activity_logs_created_idx").on(table.createdAt),
  ]
);
