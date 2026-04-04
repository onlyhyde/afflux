-- ═══════════════════════════════════════════════════════════
-- GIN Indexes for JSONB columns
-- Required for AI matching engine filter performance
-- ═══════════════════════════════════════════════════════════

-- Creator JSONB fields (AI matching filters these extensively)
CREATE INDEX IF NOT EXISTS creators_subcategories_gin
  ON creators USING gin (subcategories jsonb_path_ops);

CREATE INDEX IF NOT EXISTS creators_content_styles_gin
  ON creators USING gin (content_styles jsonb_path_ops);

-- Product JSONB fields (AI product profiler uses these)
CREATE INDEX IF NOT EXISTS products_keywords_gin
  ON products USING gin (target_keywords jsonb_path_ops);

-- CRM tags (filtered in pipeline view)
CREATE INDEX IF NOT EXISTS creator_relationships_tags_gin
  ON creator_relationships USING gin (tags jsonb_path_ops);

-- ═══════════════════════════════════════════════════════════
-- Full-text search vector (tsvector) for creator search
-- Replaces ILIKE '%keyword%' with indexed full-text search
-- ═══════════════════════════════════════════════════════════

-- Note: Generated columns are not supported by all Drizzle migration tools.
-- Apply this migration manually or via Supabase SQL editor.

ALTER TABLE creators ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(username, '') || ' ' ||
      coalesce(display_name, '') || ' ' ||
      coalesce(bio, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS creators_search_vector_idx
  ON creators USING gin (search_vector);

-- ═══════════════════════════════════════════════════════════
-- updatedAt auto-refresh trigger
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at'
      AND table_schema = 'public'
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t
    );
  END LOOP;
END $$;
