-- ═══════════════════════════════════════════════════════════
-- Row Level Security (RLS) Policies
-- Apply after initial schema migration
-- ═══════════════════════════════════════════════════════════

-- Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE spark_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy (uses SELECT subquery for per-statement caching)
-- The app sets: SET app.current_tenant_id = '<uuid>' before each request

CREATE POLICY tenant_isolation_users ON users
  FOR ALL USING (tenant_id = (SELECT current_setting('app.current_tenant_id', true)::uuid));

CREATE POLICY tenant_isolation_shops ON shops
  FOR ALL USING (tenant_id = (SELECT current_setting('app.current_tenant_id', true)::uuid));

CREATE POLICY tenant_isolation_products ON products
  FOR ALL USING (tenant_id = (SELECT current_setting('app.current_tenant_id', true)::uuid));

CREATE POLICY tenant_isolation_subscriptions ON subscriptions
  FOR ALL USING (tenant_id = (SELECT current_setting('app.current_tenant_id', true)::uuid));

CREATE POLICY tenant_isolation_creator_lists ON creator_lists
  FOR ALL USING (tenant_id = (SELECT current_setting('app.current_tenant_id', true)::uuid));

CREATE POLICY tenant_isolation_creator_list_members ON creator_list_members
  FOR ALL USING (tenant_id = (SELECT current_setting('app.current_tenant_id', true)::uuid));

CREATE POLICY tenant_isolation_creator_relationships ON creator_relationships
  FOR ALL USING (tenant_id = (SELECT current_setting('app.current_tenant_id', true)::uuid));

CREATE POLICY tenant_isolation_outreach_templates ON outreach_templates
  FOR ALL USING (tenant_id = (SELECT current_setting('app.current_tenant_id', true)::uuid));

CREATE POLICY tenant_isolation_outreach_campaigns ON outreach_campaigns
  FOR ALL USING (tenant_id = (SELECT current_setting('app.current_tenant_id', true)::uuid));

CREATE POLICY tenant_isolation_outreach_messages ON outreach_messages
  FOR ALL USING (tenant_id = (SELECT current_setting('app.current_tenant_id', true)::uuid));

CREATE POLICY tenant_isolation_contents ON contents
  FOR ALL USING (tenant_id = (SELECT current_setting('app.current_tenant_id', true)::uuid));

CREATE POLICY tenant_isolation_samples ON samples
  FOR ALL USING (tenant_id = (SELECT current_setting('app.current_tenant_id', true)::uuid));

CREATE POLICY tenant_isolation_notifications ON notifications
  FOR ALL USING (tenant_id = (SELECT current_setting('app.current_tenant_id', true)::uuid));

-- Creators table: global shared data — read access for all, no tenant filter
CREATE POLICY creators_read_all ON creators FOR SELECT USING (true);

-- Webhook events: no tenant scope — system-level table
-- (no RLS needed, accessed by service role only)
