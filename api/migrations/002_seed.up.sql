-- P002 Portfolio Platform — Seed Data
-- Idempotent: uses ON CONFLICT DO NOTHING

-- ─── Styles ───────────────────────────────────────────

INSERT INTO quiz_styles (id, slug, name_en, name_ru, description_en, description_ru) VALUES
('style-minimalist', 'minimalist', 'Minimalist', 'Минималист',
 'Clean layouts with generous whitespace, refined typography, and restrained color palettes. Inspired by Swiss design — every element earns its place.',
 'Чистые макеты с большим количеством воздуха, утончённая типографика и сдержанные цветовые палитры. Вдохновлено швейцарским дизайном — каждый элемент на своём месте.'),

('style-bold-modern', 'bold-modern', 'Bold & Modern', 'Смелый и современный',
 'Strong typography, dark backgrounds, vivid accent colors, and confident layouts. Makes a statement and commands attention.',
 'Выразительная типографика, тёмные фоны, яркие акцентные цвета и уверенные макеты. Привлекает внимание и запоминается.'),

('style-corporate', 'corporate-classic', 'Corporate Classic', 'Корпоративная классика',
 'Professional, structured layouts that build trust. Clear hierarchy, traditional navigation, and polished presentation for established businesses.',
 'Профессиональные, структурированные макеты, которые вызывают доверие. Чёткая иерархия, традиционная навигация и отточенная подача для устоявшегося бизнеса.'),

('style-creative', 'creative-experimental', 'Creative & Experimental', 'Креативный и экспериментальный',
 'Asymmetric layouts, bold animations, unconventional grids, and artistic flair. For brands that want to stand out and push boundaries.',
 'Асимметричные макеты, смелые анимации, нестандартные сетки и художественный подход. Для брендов, которые хотят выделяться.')
ON CONFLICT (id) DO NOTHING;

-- ─── Style References ─────────────────────────────────

INSERT INTO style_references (id, style_id, url, label_en, label_ru, type, sort_order) VALUES
-- Minimalist refs
('ref-min-1', 'style-minimalist', 'https://linear.app', 'Linear — Project management', 'Linear — Управление проектами', 'EXTERNAL', 0),
('ref-min-2', 'style-minimalist', 'https://stripe.com', 'Stripe — Payment platform', 'Stripe — Платёжная платформа', 'EXTERNAL', 1),
('ref-min-3', 'style-minimalist', 'https://vercel.com', 'Vercel — Developer platform', 'Vercel — Платформа для разработчиков', 'EXTERNAL', 2),

-- Bold & Modern refs
('ref-bold-1', 'style-bold-modern', 'https://www.apple.com', 'Apple — Product showcase', 'Apple — Витрина продуктов', 'EXTERNAL', 0),
('ref-bold-2', 'style-bold-modern', 'https://www.figma.com', 'Figma — Design tool', 'Figma — Инструмент дизайна', 'EXTERNAL', 1),
('ref-bold-3', 'style-bold-modern', 'https://notion.so', 'Notion — Workspace', 'Notion — Рабочее пространство', 'EXTERNAL', 2),

-- Corporate Classic refs
('ref-corp-1', 'style-corporate', 'https://www.ibm.com', 'IBM — Enterprise technology', 'IBM — Корпоративные технологии', 'EXTERNAL', 0),
('ref-corp-2', 'style-corporate', 'https://www.deloitte.com', 'Deloitte — Consulting', 'Deloitte — Консалтинг', 'EXTERNAL', 1),
('ref-corp-3', 'style-corporate', 'https://www.microsoft.com', 'Microsoft — Technology', 'Microsoft — Технологии', 'EXTERNAL', 2),

-- Creative & Experimental refs
('ref-crea-1', 'style-creative', 'https://www.awwwards.com', 'Awwwards — Best web design', 'Awwwards — Лучший веб-дизайн', 'EXTERNAL', 0),
('ref-crea-2', 'style-creative', 'https://www.behance.net', 'Behance — Creative showcase', 'Behance — Творческая витрина', 'EXTERNAL', 1),
('ref-crea-3', 'style-creative', 'https://dribbble.com', 'Dribbble — Design community', 'Dribbble — Дизайн-сообщество', 'EXTERNAL', 2)
ON CONFLICT (id) DO NOTHING;

-- ─── Service Packages ─────────────────────────────────

INSERT INTO service_packages (id, slug, name_en, name_ru, project_type, description_en, description_ru, price_from, price_to, currency, features_en, features_ru, delivery_days, sort_order, active) VALUES
('pkg-landing', 'landing-page', 'Landing Page', 'Лендинг', 'LANDING',
 'Single-page website with a clear call to action. Perfect for product launches, events, or lead generation.',
 'Одностраничный сайт с чётким призывом к действию. Идеален для запуска продуктов, мероприятий или генерации лидов.',
 30000, 80000, 'RUB',
 ARRAY['Responsive design', 'SEO optimization', 'Contact form', 'Analytics setup', 'Performance optimization'],
 ARRAY['Адаптивный дизайн', 'SEO-оптимизация', 'Контактная форма', 'Настройка аналитики', 'Оптимизация производительности'],
 14, 0, true),

('pkg-corporate', 'corporate-site', 'Corporate Website', 'Корпоративный сайт', 'CORPORATE',
 'Multi-page website for businesses. Includes company info, services, team, and contact pages with CMS for easy updates.',
 'Многостраничный сайт для бизнеса. Включает информацию о компании, услуги, команду и контактные страницы с CMS для обновлений.',
 80000, 200000, 'RUB',
 ARRAY['Up to 10 pages', 'CMS for content management', 'SEO optimization', 'Responsive design', 'Contact forms', 'Blog/news section', 'Social media integration'],
 ARRAY['До 10 страниц', 'CMS для управления контентом', 'SEO-оптимизация', 'Адаптивный дизайн', 'Контактные формы', 'Блог/новости', 'Интеграция соцсетей'],
 30, 1, true),

('pkg-webapp', 'web-application', 'Web Application', 'Веб-приложение', 'WEBAPP',
 'Custom web application with user authentication, dashboards, and business logic. Built with modern frameworks for scalability.',
 'Кастомное веб-приложение с авторизацией, дашбордами и бизнес-логикой. Построено на современных фреймворках для масштабируемости.',
 200000, 500000, 'RUB',
 ARRAY['Custom UI/UX design', 'User authentication', 'Admin dashboard', 'API development', 'Database design', 'Deployment & CI/CD', 'Documentation'],
 ARRAY['Кастомный UI/UX дизайн', 'Авторизация пользователей', 'Панель администратора', 'Разработка API', 'Проектирование базы данных', 'Деплой и CI/CD', 'Документация'],
 60, 2, true),

('pkg-store', 'online-store', 'Online Store', 'Интернет-магазин', 'STORE',
 'E-commerce solution with product catalog, shopping cart, payment integration, and order management.',
 'E-commerce решение с каталогом товаров, корзиной, интеграцией оплаты и управлением заказами.',
 150000, 400000, 'RUB',
 ARRAY['Product catalog', 'Shopping cart', 'Payment integration', 'Order management', 'Responsive design', 'SEO optimization', 'Admin panel'],
 ARRAY['Каталог товаров', 'Корзина покупок', 'Интеграция оплаты', 'Управление заказами', 'Адаптивный дизайн', 'SEO-оптимизация', 'Панель администратора'],
 45, 3, true)
ON CONFLICT (id) DO NOTHING;

-- ─── Portfolio Projects ───────────────────────────────

INSERT INTO portfolio_projects (id, slug, title_en, title_ru, description_en, description_ru, type, status, thumbnail_url, live_url, featured, tech_stack, sort_order) VALUES
('proj-itam', 'itam-landing', 'ITAM University Landing', 'Лендинг ITAM',
 'Full-stack landing page for ITAM university department. Server-rendered with Go backend, bilingual content management, and optimized performance.',
 'Полноценный лендинг для кафедры ITAM. Серверный рендеринг с Go-бэкендом, двуязычное управление контентом и оптимизированная производительность.',
 'CORPORATE', 'PUBLISHED', NULL, NULL, true,
 ARRAY['Go', 'Chi', 'PostgreSQL', 'React', 'TypeScript', 'Tailwind CSS', 'Docker'],
 0),

('proj-neuroboost', 'neuroboost', 'NeuroBoost', 'NeuroBoost',
 'Productivity web app with focus timer, task management, and habit tracking. Built with just 5 dependencies — a study in minimal architecture.',
 'Веб-приложение для продуктивности с таймером фокуса, управлением задачами и трекером привычек. Создано всего на 5 зависимостях — пример минималистичной архитектуры.',
 'WEBAPP', 'PUBLISHED', NULL, NULL, true,
 ARRAY['React', 'TypeScript', 'Tailwind CSS', 'Zustand', 'Vite'],
 1),

('proj-2211', '2211-cosmetics', '2211 Cosmetics', '2211 Cosmetics',
 'E-commerce integrations and custom features for a cosmetics brand. Shopify customization, payment flow optimization, and analytics setup.',
 'E-commerce интеграции и кастомные функции для косметического бренда. Кастомизация Shopify, оптимизация оплаты и настройка аналитики.',
 'STORE', 'PUBLISHED', NULL, NULL, false,
 ARRAY['Shopify', 'JavaScript', 'Liquid', 'CSS'],
 2),

('proj-stankio', 'stankiobruch', 'Stankiobruch', 'Станкиобруч',
 'High-performance landing page for an industrial equipment company. Fast load times, clear product presentation, and lead generation forms.',
 'Высокопроизводительный лендинг для компании промышленного оборудования. Быстрая загрузка, наглядная презентация продукции и формы генерации лидов.',
 'LANDING', 'PUBLISHED', NULL, NULL, false,
 ARRAY['React', 'Vite', 'Tailwind CSS', 'TypeScript'],
 3),

('proj-flowtech', 'flowtech', 'FlowTech', 'FlowTech',
 'Marketing website for a tech consultancy. Multi-variant design system with shared components across different brand configurations.',
 'Маркетинговый сайт для технологической консалтинговой компании. Мультивариантная дизайн-система с общими компонентами для разных конфигураций бренда.',
 'CORPORATE', 'PUBLISHED', NULL, NULL, true,
 ARRAY['React', 'TypeScript', 'Tailwind CSS', 'pnpm monorepo'],
 4)
ON CONFLICT (id) DO NOTHING;

-- ─── Content Blocks ───────────────────────────────────

-- ITAM Landing blocks
INSERT INTO content_blocks (id, project_id, type, sort_order, content) VALUES
('block-itam-1', 'proj-itam', 'TEXT', 0,
 '{"title_en": "Project Overview", "title_ru": "Обзор проекта", "body_en": "Built a production-grade university landing page with a Go backend following the Chi + pgx pattern. Features include bilingual content management, JWT-based admin panel, and server-side rendering for optimal SEO.", "body_ru": "Создан продакшн-лендинг для университета с Go-бэкендом по паттерну Chi + pgx. Включает двуязычное управление контентом, админ-панель на JWT и серверный рендеринг для SEO."}'),
('block-itam-2', 'proj-itam', 'METRICS', 1,
 '{"items": [{"label_en": "Lighthouse Score", "label_ru": "Оценка Lighthouse", "value": "98"}, {"label_en": "Dependencies", "label_ru": "Зависимости", "value": "6"}, {"label_en": "Load Time", "label_ru": "Время загрузки", "value": "<1s"}, {"label_en": "Languages", "label_ru": "Языки", "value": "EN/RU"}]}'),
('block-itam-3', 'proj-itam', 'CODE', 2,
 '{"language": "go", "title_en": "Chi Router Setup", "title_ru": "Настройка Chi роутера", "code": "r := chi.NewRouter()\nr.Use(middleware.Logger)\nr.Use(middleware.Recoverer)\nr.Route(\"/api\", func(r chi.Router) {\n    r.Get(\"/content\", h.ListContent)\n    r.Group(func(r chi.Router) {\n        r.Use(authMiddleware)\n        r.Put(\"/content/{key}\", h.UpdateContent)\n    })\n})"}'),

-- NeuroBoost blocks
('block-neuro-1', 'proj-neuroboost', 'TEXT', 0,
 '{"title_en": "Minimal by Design", "title_ru": "Минимализм по замыслу", "body_en": "NeuroBoost was built as a challenge: create a full-featured productivity app with the fewest possible dependencies. The result uses just 5 packages — React, TypeScript, Tailwind, Zustand, and Vite — with zero runtime bloat.", "body_ru": "NeuroBoost создан как вызов: полнофункциональное приложение для продуктивности с минимумом зависимостей. Результат — всего 5 пакетов: React, TypeScript, Tailwind, Zustand и Vite — без лишнего в рантайме."}'),
('block-neuro-2', 'proj-neuroboost', 'METRICS', 1,
 '{"items": [{"label_en": "Dependencies", "label_ru": "Зависимости", "value": "5"}, {"label_en": "Bundle Size", "label_ru": "Размер бандла", "value": "~45KB"}, {"label_en": "Features", "label_ru": "Функции", "value": "12+"}, {"label_en": "Build Time", "label_ru": "Время сборки", "value": "<3s"}]}'),

-- 2211 Cosmetics blocks
('block-2211-1', 'proj-2211', 'TEXT', 0,
 '{"title_en": "E-commerce Enhancement", "title_ru": "Улучшение e-commerce", "body_en": "Worked with an established cosmetics brand to optimize their Shopify storefront. Implemented custom product filters, streamlined the checkout flow, and integrated analytics for conversion tracking.", "body_ru": "Работа с косметическим брендом по оптимизации Shopify-витрины. Реализованы кастомные фильтры, упрощена оплата и интегрирована аналитика для отслеживания конверсий."}'),

-- Stankiobruch blocks
('block-stankio-1', 'proj-stankio', 'TEXT', 0,
 '{"title_en": "Industrial Landing Page", "title_ru": "Промышленный лендинг", "body_en": "Designed and developed a conversion-focused landing page for an industrial equipment supplier. Emphasis on fast load times, clear product categorization, and prominent lead capture forms.", "body_ru": "Спроектирован и разработан конверсионный лендинг для поставщика промышленного оборудования. Акцент на быстрой загрузке, чёткой категоризации продукции и заметных формах захвата лидов."}'),
('block-stankio-2', 'proj-stankio', 'METRICS', 1,
 '{"items": [{"label_en": "Page Speed", "label_ru": "Скорость страницы", "value": "95+"}, {"label_en": "Conversion Rate", "label_ru": "Конверсия", "value": "+40%"}, {"label_en": "Bounce Rate", "label_ru": "Отказы", "value": "-25%"}]}'),

-- FlowTech blocks
('block-flow-1', 'proj-flowtech', 'TEXT', 0,
 '{"title_en": "Multi-Brand Architecture", "title_ru": "Мультибрендовая архитектура", "body_en": "Built a monorepo-based marketing site that supports multiple brand variants from shared components. Each variant gets its own color scheme, content, and deployment — but shares the same codebase.", "body_ru": "Создан маркетинговый сайт на базе монорепо с поддержкой нескольких вариантов бренда из общих компонентов. Каждый вариант имеет свою цветовую схему, контент и деплой — но использует общий код."}'),
('block-flow-2', 'proj-flowtech', 'METRICS', 1,
 '{"items": [{"label_en": "Brand Variants", "label_ru": "Вариантов бренда", "value": "3"}, {"label_en": "Shared Components", "label_ru": "Общих компонентов", "value": "25+"}, {"label_en": "Code Reuse", "label_ru": "Повторное использование", "value": "80%"}]}')
ON CONFLICT (id) DO NOTHING;

-- ─── Quiz Tree ────────────────────────────────────────

-- Root node
INSERT INTO quiz_nodes (id, parent_id, type, question_en, question_ru, project_type, sort_order) VALUES
('quiz-root', NULL, 'QUESTION', 'What type of project do you need?', 'Какой тип проекта вам нужен?', NULL, 0)
ON CONFLICT (id) DO NOTHING;

-- Level 2: project type branches
INSERT INTO quiz_nodes (id, parent_id, type, question_en, question_ru, project_type, sort_order) VALUES
('quiz-landing', 'quiz-root', 'QUESTION', 'What visual style appeals to you?', 'Какой визуальный стиль вам нравится?', 'LANDING', 0),
('quiz-corporate', 'quiz-root', 'QUESTION', 'What visual style appeals to you?', 'Какой визуальный стиль вам нравится?', 'CORPORATE', 1),
('quiz-webapp', 'quiz-root', 'QUESTION', 'What is the primary focus of your app?', 'Какой основной фокус вашего приложения?', 'WEBAPP', 2),
('quiz-store', 'quiz-root', 'QUESTION', 'What visual style appeals to you?', 'Какой визуальный стиль вам нравится?', 'STORE', 3)
ON CONFLICT (id) DO NOTHING;

-- Level 3: result nodes (LANDING)
INSERT INTO quiz_nodes (id, parent_id, type, question_en, question_ru, project_type, sort_order) VALUES
('quiz-landing-min', 'quiz-landing', 'RESULT', NULL, NULL, 'LANDING', 0),
('quiz-landing-bold', 'quiz-landing', 'RESULT', NULL, NULL, 'LANDING', 1),
('quiz-landing-corp', 'quiz-landing', 'RESULT', NULL, NULL, 'LANDING', 2)
ON CONFLICT (id) DO NOTHING;

-- Level 3: result nodes (CORPORATE)
INSERT INTO quiz_nodes (id, parent_id, type, question_en, question_ru, project_type, sort_order) VALUES
('quiz-corp-min', 'quiz-corporate', 'RESULT', NULL, NULL, 'CORPORATE', 0),
('quiz-corp-corp', 'quiz-corporate', 'RESULT', NULL, NULL, 'CORPORATE', 1),
('quiz-corp-crea', 'quiz-corporate', 'RESULT', NULL, NULL, 'CORPORATE', 2)
ON CONFLICT (id) DO NOTHING;

-- Level 3: result nodes (WEBAPP)
INSERT INTO quiz_nodes (id, parent_id, type, question_en, question_ru, project_type, sort_order) VALUES
('quiz-webapp-dash', 'quiz-webapp', 'RESULT', NULL, NULL, 'WEBAPP', 0),
('quiz-webapp-consumer', 'quiz-webapp', 'RESULT', NULL, NULL, 'WEBAPP', 1)
ON CONFLICT (id) DO NOTHING;

-- Level 3: result nodes (STORE)
INSERT INTO quiz_nodes (id, parent_id, type, question_en, question_ru, project_type, sort_order) VALUES
('quiz-store-min', 'quiz-store', 'RESULT', NULL, NULL, 'STORE', 0),
('quiz-store-bold', 'quiz-store', 'RESULT', NULL, NULL, 'STORE', 1)
ON CONFLICT (id) DO NOTHING;

-- ─── Quiz Options (links between nodes) ───────────────

-- Root → project type
INSERT INTO quiz_options (id, node_id, label_en, label_ru, next_node_id, sort_order) VALUES
('opt-root-landing', 'quiz-root', 'Landing Page', 'Лендинг', 'quiz-landing', 0),
('opt-root-corporate', 'quiz-root', 'Corporate Website', 'Корпоративный сайт', 'quiz-corporate', 1),
('opt-root-webapp', 'quiz-root', 'Web Application', 'Веб-приложение', 'quiz-webapp', 2),
('opt-root-store', 'quiz-root', 'Online Store', 'Интернет-магазин', 'quiz-store', 3)
ON CONFLICT (id) DO NOTHING;

-- Landing → style options
INSERT INTO quiz_options (id, node_id, label_en, label_ru, next_node_id, sort_order) VALUES
('opt-land-min', 'quiz-landing', 'Clean & Minimal', 'Чистый и минималистичный', 'quiz-landing-min', 0),
('opt-land-bold', 'quiz-landing', 'Bold & Eye-catching', 'Смелый и привлекательный', 'quiz-landing-bold', 1),
('opt-land-corp', 'quiz-landing', 'Professional & Trustworthy', 'Профессиональный и надёжный', 'quiz-landing-corp', 2)
ON CONFLICT (id) DO NOTHING;

-- Corporate → style options
INSERT INTO quiz_options (id, node_id, label_en, label_ru, next_node_id, sort_order) VALUES
('opt-corp-min', 'quiz-corporate', 'Clean & Minimal', 'Чистый и минималистичный', 'quiz-corp-min', 0),
('opt-corp-corp', 'quiz-corporate', 'Classic & Professional', 'Классический и профессиональный', 'quiz-corp-corp', 1),
('opt-corp-crea', 'quiz-corporate', 'Creative & Unique', 'Креативный и уникальный', 'quiz-corp-crea', 2)
ON CONFLICT (id) DO NOTHING;

-- Webapp → focus options
INSERT INTO quiz_options (id, node_id, label_en, label_ru, next_node_id, sort_order) VALUES
('opt-app-dash', 'quiz-webapp', 'Dashboard / SaaS Tool', 'Дашборд / SaaS-инструмент', 'quiz-webapp-dash', 0),
('opt-app-consumer', 'quiz-webapp', 'Consumer-Facing Product', 'Потребительский продукт', 'quiz-webapp-consumer', 1)
ON CONFLICT (id) DO NOTHING;

-- Store → style options
INSERT INTO quiz_options (id, node_id, label_en, label_ru, next_node_id, sort_order) VALUES
('opt-store-min', 'quiz-store', 'Clean & Minimal', 'Чистый и минималистичный', 'quiz-store-min', 0),
('opt-store-bold', 'quiz-store', 'Bold & Modern', 'Смелый и современный', 'quiz-store-bold', 1)
ON CONFLICT (id) DO NOTHING;

-- ─── Quiz Results (link result nodes to style + package) ──

INSERT INTO quiz_results (id, node_id, style_id, package_id, description_en, description_ru) VALUES
-- Landing results
('res-land-min', 'quiz-landing-min', 'style-minimalist', 'pkg-landing',
 'A clean, focused landing page that lets your product speak for itself.',
 'Чистый, сфокусированный лендинг, который позволяет продукту говорить самому за себя.'),
('res-land-bold', 'quiz-landing-bold', 'style-bold-modern', 'pkg-landing',
 'A bold landing page that grabs attention and drives conversions.',
 'Смелый лендинг, который привлекает внимание и стимулирует конверсии.'),
('res-land-corp', 'quiz-landing-corp', 'style-corporate', 'pkg-landing',
 'A professional landing page that builds trust from the first impression.',
 'Профессиональный лендинг, который вызывает доверие с первого впечатления.'),

-- Corporate results
('res-corp-min', 'quiz-corp-min', 'style-minimalist', 'pkg-corporate',
 'A refined corporate site with clean lines and elegant presentation.',
 'Утончённый корпоративный сайт с чистыми линиями и элегантной подачей.'),
('res-corp-corp', 'quiz-corp-corp', 'style-corporate', 'pkg-corporate',
 'A classic corporate website that communicates reliability and expertise.',
 'Классический корпоративный сайт, который транслирует надёжность и экспертизу.'),
('res-corp-crea', 'quiz-corp-crea', 'style-creative', 'pkg-corporate',
 'A corporate site that breaks the mold — memorable, distinctive, and modern.',
 'Корпоративный сайт, который ломает стереотипы — запоминающийся, особенный и современный.'),

-- Webapp results
('res-app-dash', 'quiz-webapp-dash', 'style-minimalist', 'pkg-webapp',
 'A clean dashboard interface focused on clarity and usability.',
 'Чистый дашборд-интерфейс с фокусом на ясность и удобство.'),
('res-app-consumer', 'quiz-webapp-consumer', 'style-bold-modern', 'pkg-webapp',
 'A consumer app that combines strong visuals with smooth user experience.',
 'Потребительское приложение, сочетающее яркий дизайн с плавным UX.'),

-- Store results
('res-store-min', 'quiz-store-min', 'style-minimalist', 'pkg-store',
 'A minimalist store that puts products front and center.',
 'Минималистичный магазин, где товары на первом плане.'),
('res-store-bold', 'quiz-store-bold', 'style-bold-modern', 'pkg-store',
 'A bold e-commerce experience that makes shopping feel exciting.',
 'Смелый e-commerce с запоминающимся опытом покупок.')
ON CONFLICT (id) DO NOTHING;

-- ─── Site Content ─────────────────────────────────────

INSERT INTO site_content (id, key, value_en, value_ru) VALUES
('cnt-hero-title', 'hero_title', 'I build websites that work', 'Я создаю сайты, которые работают'),
('cnt-hero-subtitle', 'hero_subtitle', 'Full-stack developer specializing in fast, clean, minimal-dependency web solutions', 'Фулстек-разработчик, специализирующийся на быстрых, чистых веб-решениях с минимумом зависимостей'),
('cnt-about', 'about_text', 'I''m Denis Zemtsov — a developer who believes the best code is the code you don''t write. Every project I build prioritizes performance, maintainability, and honest engineering over trendy stacks and unnecessary complexity.', 'Я Денис Земцов — разработчик, который верит, что лучший код — тот, который не нужно писать. Каждый мой проект ставит производительность, поддерживаемость и честный инжиниринг выше модных стеков и лишней сложности.'),
('cnt-quiz-intro', 'quiz_intro', 'Not sure what you need? Take a quick quiz and I''ll recommend the right solution for your project.', 'Не уверены, что вам нужно? Пройдите быстрый тест, и я порекомендую подходящее решение для вашего проекта.'),
('cnt-contact-cta', 'contact_cta', 'Let''s build something great together', 'Давайте создадим что-то классное вместе')
ON CONFLICT (id) DO NOTHING;
