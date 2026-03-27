-- Reverse seed data (order matters due to foreign keys)
DELETE FROM quiz_results WHERE id LIKE 'res-%';
DELETE FROM quiz_options WHERE id LIKE 'opt-%';
DELETE FROM quiz_nodes WHERE id LIKE 'quiz-%';
DELETE FROM content_blocks WHERE id LIKE 'block-%';
DELETE FROM portfolio_projects WHERE id LIKE 'proj-%';
DELETE FROM style_references WHERE id LIKE 'ref-%';
DELETE FROM service_packages WHERE id LIKE 'pkg-%';
DELETE FROM quiz_styles WHERE id LIKE 'style-%';
DELETE FROM site_content WHERE id LIKE 'cnt-%';
