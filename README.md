# Afflux

AI-powered TikTok Shop affiliate marketing platform. Automates creator discovery, outreach, relationship management, and performance analytics.

## Tech Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: tRPC (12 routers), Better Auth
- **Database**: Supabase PostgreSQL (27 tables), Drizzle ORM
- **Queue**: BullMQ (9 queues), Redis
- **AI**: Claude API, 10-dimension matching engine
- **i18n**: 5 locales (en, ko, ja, id, th)

## Quick Start

```bash
pnpm install
cp .env.example .env.local     # Configure environment variables
pnpm docker:up                  # Start PostgreSQL + Redis
pnpm db:push                    # Apply 27-table schema
pnpm db:custom                  # Apply RLS, GIN indexes, triggers
pnpm db:seed:dev                # Seed development data
pnpm dev                        # http://localhost:3000
```

## Features

- **Creator Search**: Filter creators by category, followers, engagement, GMV with tsvector full-text search
- **AI Matching**: 10-dimension scoring (audience fit, category expertise, conversion history, content style, price alignment, brand safety, saturation, competitive conflict, activity health, response likelihood)
- **Outreach Automation**: TikTok DM, email campaigns with dedup and rate limiting
- **CRM Pipeline**: Kanban board (discovered → contacted → negotiating → active)
- **Analytics**: GMV dashboard, creator performance rankings
- **Campaigns**: Sample management, contests, competitor monitoring
- **Content**: Video performance tracking, Spark Code management, AI script generation
- **Billing**: Plan-based feature limits (free/starter/growth/enterprise/agency)
- **Notifications**: 7 event types with in-app + email delivery
- **Admin**: System health, queue monitor, tenant/user/creator DB management

## Testing

```bash
pnpm test:run    # 110 unit tests (Vitest)
pnpm test:e2e    # 11 E2E tests (Playwright)
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm db:push` | Apply schema to database |
| `pnpm db:custom` | Apply RLS policies, GIN indexes, triggers |
| `pnpm db:seed:dev` | Seed development data |
| `pnpm db:reset` | Drop and recreate schema |
| `pnpm db:verify` | Verify database connection and tables |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm worker:dev` | Start BullMQ worker process |
| `pnpm docker:up` | Start PostgreSQL + Redis containers |
| `pnpm test:e2e` | Run Playwright E2E tests |
