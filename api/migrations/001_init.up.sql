-- P002 Portfolio Platform — Initial Schema
-- Translates from Prisma schema to raw PostgreSQL

-- ─── Enums ──────────────────────────────────────────

CREATE TYPE project_type AS ENUM ('LANDING', 'CORPORATE', 'STORE', 'BOT', 'WEBAPP', 'API', 'FIXES');
CREATE TYPE project_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE block_type AS ENUM ('TEXT', 'GALLERY', 'EMBED', 'CODE', 'METRICS', 'TESTIMONIAL');
CREATE TYPE node_type AS ENUM ('QUESTION', 'RESULT');
CREATE TYPE ref_type AS ENUM ('OWN_PROJECT', 'DEMO', 'EXTERNAL');
CREATE TYPE currency AS ENUM ('RUB', 'USD', 'EUR');
CREATE TYPE lead_status AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- ─── Admin ──────────────────────────────────────────

CREATE TABLE admins (
    id            BIGSERIAL PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Portfolio ──────────────────────────────────────

CREATE TABLE portfolio_projects (
    id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    slug           TEXT NOT NULL UNIQUE,
    title_en       TEXT NOT NULL,
    title_ru       TEXT NOT NULL,
    description_en TEXT NOT NULL,
    description_ru TEXT NOT NULL,
    type           project_type NOT NULL,
    status         project_status NOT NULL DEFAULT 'DRAFT',
    thumbnail_url  TEXT,
    live_url       TEXT,
    featured       BOOLEAN NOT NULL DEFAULT FALSE,
    tech_stack     TEXT[] NOT NULL DEFAULT '{}',
    sort_order     INT NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE content_blocks (
    id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT NOT NULL REFERENCES portfolio_projects(id) ON DELETE CASCADE,
    type       block_type NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    content    JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_blocks_project ON content_blocks(project_id);

-- ─── Quiz Tree ──────────────────────────────────────

CREATE TABLE quiz_nodes (
    id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    parent_id    TEXT REFERENCES quiz_nodes(id) ON DELETE CASCADE,
    type         node_type NOT NULL,
    question_en  TEXT,
    question_ru  TEXT,
    project_type project_type,
    sort_order   INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_quiz_nodes_parent ON quiz_nodes(parent_id);

CREATE TABLE quiz_options (
    id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    node_id      TEXT NOT NULL REFERENCES quiz_nodes(id) ON DELETE CASCADE,
    label_en     TEXT NOT NULL,
    label_ru     TEXT NOT NULL,
    next_node_id TEXT REFERENCES quiz_nodes(id) ON DELETE SET NULL,
    sort_order   INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_quiz_options_node ON quiz_options(node_id);
CREATE INDEX idx_quiz_options_next ON quiz_options(next_node_id);

-- ─── Styles & Packages ──────────────────────────────

CREATE TABLE quiz_styles (
    id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    slug           TEXT NOT NULL UNIQUE,
    name_en        TEXT NOT NULL,
    name_ru        TEXT NOT NULL,
    description_en TEXT NOT NULL,
    description_ru TEXT NOT NULL
);

CREATE TABLE style_references (
    id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    style_id   TEXT NOT NULL REFERENCES quiz_styles(id) ON DELETE CASCADE,
    url        TEXT NOT NULL,
    label_en   TEXT NOT NULL,
    label_ru   TEXT NOT NULL,
    type       ref_type NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_style_refs_style ON style_references(style_id);

CREATE TABLE service_packages (
    id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    slug           TEXT NOT NULL UNIQUE,
    name_en        TEXT NOT NULL,
    name_ru        TEXT NOT NULL,
    project_type   project_type NOT NULL,
    description_en TEXT NOT NULL,
    description_ru TEXT NOT NULL,
    price_from     INT NOT NULL,
    price_to       INT NOT NULL,
    currency       currency NOT NULL DEFAULT 'RUB',
    features_en    TEXT[] NOT NULL DEFAULT '{}',
    features_ru    TEXT[] NOT NULL DEFAULT '{}',
    delivery_days  INT,
    sort_order     INT NOT NULL DEFAULT 0,
    active         BOOLEAN NOT NULL DEFAULT TRUE
);

-- ─── Quiz Results ───────────────────────────────────

CREATE TABLE quiz_results (
    id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    node_id        TEXT NOT NULL UNIQUE REFERENCES quiz_nodes(id) ON DELETE CASCADE,
    style_id       TEXT NOT NULL REFERENCES quiz_styles(id),
    package_id     TEXT NOT NULL REFERENCES service_packages(id),
    description_en TEXT,
    description_ru TEXT
);

-- ─── Leads ──────────────────────────────────────────

CREATE TABLE leads (
    id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name              TEXT NOT NULL,
    email             TEXT NOT NULL,
    phone             TEXT,
    message           TEXT,
    answers           JSONB NOT NULL DEFAULT '[]',
    result_style_id   TEXT REFERENCES quiz_styles(id) ON DELETE SET NULL,
    result_package_id TEXT REFERENCES service_packages(id) ON DELETE SET NULL,
    status            lead_status NOT NULL DEFAULT 'NEW',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at DESC);

-- ─── Site Content ───────────────────────────────────

CREATE TABLE site_content (
    id       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key      TEXT NOT NULL UNIQUE,
    value_en TEXT NOT NULL,
    value_ru TEXT NOT NULL
);

-- ─── Updated At Trigger ─────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_portfolio_updated_at BEFORE UPDATE ON portfolio_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_blocks_updated_at BEFORE UPDATE ON content_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
