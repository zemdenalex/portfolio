-- Wipe existing quiz tree content (quiz_results refs quiz_nodes via FK)
TRUNCATE TABLE quiz_results CASCADE;
TRUNCATE TABLE quiz_options CASCADE;
TRUNCATE TABLE quiz_nodes CASCADE;

-- ─── Q1: Project type (drives package matching) ──────────────────────────────

INSERT INTO quiz_nodes (id, parent_id, type, question_en, question_ru, sort_order) VALUES
  ('q1', NULL, 'QUESTION', 'What kind of project do you need?', 'Какой тип проекта вам нужен?', 0);

INSERT INTO quiz_options (id, node_id, label_en, label_ru, next_node_id, project_type, style_weights, sort_order) VALUES
  (gen_random_uuid()::text, 'q1', 'Landing page',       'Лендинг',              'q2', 'LANDING',   '{}', 0),
  (gen_random_uuid()::text, 'q1', 'Corporate website',  'Корпоративный сайт',   'q2', 'CORPORATE', '{}', 1),
  (gen_random_uuid()::text, 'q1', 'Online store',       'Интернет-магазин',     'q2', 'STORE',     '{}', 2),
  (gen_random_uuid()::text, 'q1', 'Web app / SaaS',     'Веб-приложение',       'q2', 'WEBAPP',    '{}', 3),
  (gen_random_uuid()::text, 'q1', 'Telegram bot',       'Telegram-бот',         'q2', 'BOT',       '{}', 4);

-- ─── Q2: Target audience ─────────────────────────────────────────────────────

INSERT INTO quiz_nodes (id, parent_id, type, question_en, question_ru, sort_order) VALUES
  ('q2', 'q1', 'QUESTION', 'Who is your target audience?', 'Кто ваша целевая аудитория?', 1);

INSERT INTO quiz_options (id, node_id, label_en, label_ru, next_node_id, project_type, style_weights, sort_order) VALUES
  (gen_random_uuid()::text, 'q2', 'B2B / corporate clients',  'B2B / корпоративные клиенты',   'q3', NULL, '{"corporate-classic": 3, "minimalist": 1}',         0),
  (gen_random_uuid()::text, 'q2', 'B2C / mass market',        'B2C / массовый рынок',          'q3', NULL, '{"bold-modern": 3, "creative-experimental": 1}',    1),
  (gen_random_uuid()::text, 'q2', 'Developers / technical',   'Разработчики / техническая',    'q3', NULL, '{"minimalist": 3, "bold-modern": 1}',               2),
  (gen_random_uuid()::text, 'q2', 'Creative / luxury',        'Творческая / премиум',          'q3', NULL, '{"creative-experimental": 3, "minimalist": 1}',     3);

-- ─── Q3: Visual tempo ────────────────────────────────────────────────────────

INSERT INTO quiz_nodes (id, parent_id, type, question_en, question_ru, sort_order) VALUES
  ('q3', 'q2', 'QUESTION', 'What visual tempo fits your brand?', 'Какой визуальный темп подходит вашему бренду?', 2);

INSERT INTO quiz_options (id, node_id, label_en, label_ru, next_node_id, project_type, style_weights, sort_order) VALUES
  (gen_random_uuid()::text, 'q3', 'Calm and measured',  'Спокойный и взвешенный', 'q4', NULL, '{"minimalist": 3, "corporate-classic": 2}',      0),
  (gen_random_uuid()::text, 'q3', 'Energetic and bold', 'Энергичный и смелый',    'q4', NULL, '{"bold-modern": 3, "creative-experimental": 2}', 1);

-- ─── Q4: Colour palette ──────────────────────────────────────────────────────

INSERT INTO quiz_nodes (id, parent_id, type, question_en, question_ru, sort_order) VALUES
  ('q4', 'q3', 'QUESTION', 'What colour palette suits you?', 'Какая цветовая палитра вам подходит?', 3);

INSERT INTO quiz_options (id, node_id, label_en, label_ru, next_node_id, project_type, style_weights, sort_order) VALUES
  (gen_random_uuid()::text, 'q4', 'Neutral / monochrome', 'Нейтральная / монохромная', 'q5', NULL, '{"minimalist": 3, "corporate-classic": 2}',              0),
  (gen_random_uuid()::text, 'q4', 'High contrast',        'Высокий контраст',          'q5', NULL, '{"bold-modern": 3}',                                     1),
  (gen_random_uuid()::text, 'q4', 'Bright and vivid',     'Яркая и насыщенная',        'q5', NULL, '{"creative-experimental": 3, "bold-modern": 1}',         2),
  (gen_random_uuid()::text, 'q4', 'Dark and muted',       'Тёмная и приглушённая',     'q5', NULL, '{"corporate-classic": 2, "minimalist": 1}',              3);

-- ─── Q5: Typography ──────────────────────────────────────────────────────────

INSERT INTO quiz_nodes (id, parent_id, type, question_en, question_ru, sort_order) VALUES
  ('q5', 'q4', 'QUESTION', 'What typography style do you prefer?', 'Какая типографика вам ближе?', 4);

INSERT INTO quiz_options (id, node_id, label_en, label_ru, next_node_id, project_type, style_weights, sort_order) VALUES
  (gen_random_uuid()::text, 'q5', 'Clean sans-serif',     'Чистый sans-serif',      'q6', NULL, '{"minimalist": 3, "corporate-classic": 1}',          0),
  (gen_random_uuid()::text, 'q5', 'Expressive display',   'Выразительная display',  'q6', NULL, '{"bold-modern": 3, "creative-experimental": 2}',     1),
  (gen_random_uuid()::text, 'q5', 'Editorial serif',      'Редакционная serif',     'q6', NULL, '{"corporate-classic": 3, "creative-experimental": 1}', 2);

-- ─── Q6: Animation preference (terminal — no next_node_id) ──────────────────

INSERT INTO quiz_nodes (id, parent_id, type, question_en, question_ru, sort_order) VALUES
  ('q6', 'q5', 'QUESTION', 'How do you feel about animations?', 'Как вы относитесь к анимациям?', 5);

INSERT INTO quiz_options (id, node_id, label_en, label_ru, next_node_id, project_type, style_weights, sort_order) VALUES
  (gen_random_uuid()::text, 'q6', 'Minimal — static is fine', 'Минимум — статика ок', NULL, NULL, '{"minimalist": 3, "corporate-classic": 2}',                    0),
  (gen_random_uuid()::text, 'q6', 'Subtle transitions',       'Лёгкие переходы',      NULL, NULL, '{"corporate-classic": 1, "minimalist": 1, "bold-modern": 1}',  1),
  (gen_random_uuid()::text, 'q6', 'Rich and immersive',       'Насыщенные',           NULL, NULL, '{"creative-experimental": 3, "bold-modern": 2}',               2);
