-- Mark demo projects as iframe-friendly.
-- These are projects with live deployments that can be safely embedded in iframes.
-- Actual slugs from 002_seed.up.sql: itam-landing, neuroboost, 2211-cosmetics, stankiobruch, flowtech
-- Note: helvexa-clean, dev-portfolio, swiss-typography, product-showcase do not exist in the seed.
UPDATE portfolio_projects SET is_iframe_friendly = TRUE
  WHERE slug IN ('neuroboost', 'itam-landing');

-- Null out live_url for projects with no public URL.
-- FlowTech and ITAM Landing have no public live_url — already NULL in seed,
-- but guard against any manually-set localhost or placeholder URLs.
UPDATE portfolio_projects SET live_url = NULL
  WHERE slug IN ('flowtech', 'itam-landing')
    AND (live_url IS NULL OR live_url = '' OR live_url LIKE 'http://localhost%');
