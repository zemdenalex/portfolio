DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
DROP TRIGGER IF EXISTS trg_blocks_updated_at ON content_blocks;
DROP TRIGGER IF EXISTS trg_portfolio_updated_at ON portfolio_projects;
DROP FUNCTION IF EXISTS update_updated_at();

DROP TABLE IF EXISTS site_content;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS quiz_results;
DROP TABLE IF EXISTS service_packages;
DROP TABLE IF EXISTS style_references;
DROP TABLE IF EXISTS quiz_styles;
DROP TABLE IF EXISTS quiz_options;
DROP TABLE IF EXISTS quiz_nodes;
DROP TABLE IF EXISTS content_blocks;
DROP TABLE IF EXISTS portfolio_projects;
DROP TABLE IF EXISTS admins;

DROP TYPE IF EXISTS lead_status;
DROP TYPE IF EXISTS currency;
DROP TYPE IF EXISTS ref_type;
DROP TYPE IF EXISTS node_type;
DROP TYPE IF EXISTS block_type;
DROP TYPE IF EXISTS project_status;
DROP TYPE IF EXISTS project_type;
