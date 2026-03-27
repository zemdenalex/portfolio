# Design Spec: Portfolio + Intake Platform

## Context

Denis is a freelance web developer managing 10+ projects. His current client acquisition flow is manual: find a task on Profi.ru → respond with credentials and past work links → answer questions one by one → create a questionnaire → wait for answers → start work. This takes hours per lead and doesn't scale.

The platform replaces this with a self-service system: clients visit one link, get impressed by demos, take a "style quiz" that's actually a complete intake form, and arrive in Denis's pipeline as a structured lead with company info, budget, preferences, and style direction — all without a single back-and-forth message.

Secondary goals: establish credibility with larger clients who see Denis as "too young," and provide a CMS so Denis can manage portfolio content, quiz options, and client submissions.

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              Public Site (Next.js)                │
│                                                   │
│  ┌─────────┐  ┌──────────┐  ┌─────────────────┐ │
│  │  Demos  │  │Style Quiz│  │   Portfolio      │ │
│  │ (hero)  │  │(lead     │  │   (real work)    │ │
│  │         │  │ magnet)  │  │                   │ │
│  └─────────┘  └────┬─────┘  └─────────────────┘ │
│                     │                             │
│              ┌──────▼──────┐                      │
│              │  Submission  │                      │
│              │  (stored)    │                      │
│              └──────┬──────┘                      │
│                     │                             │
│  ┌──────────────────▼──────────────────────────┐ │
│  │          Admin Panel / CMS                   │ │
│  │  Manage: portfolio, demos, quiz, leads,      │ │
│  │          pricing, site content                │ │
│  └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                      │
                      ▼ (future)
        ┌─────────────────────────┐
        │    Tracker App (Dexie)   │
        │    Import leads as       │
        │    projects/clients      │
        └─────────────────────────┘
```

## Visual Design

### Theme: Architect / Blueprint

**Metaphor:** Building a website = designing and constructing a building. Denis is the architect — he drafts blueprints, lays foundations, builds structures, and hands over keys.

**Why this works:**
- Non-technical clients understand "architect" immediately
- Naturally explains the process (draft → foundation → build → handoff)
- Justifies pricing ("you don't argue with an architect about the cost of load-bearing walls")
- Portfolio items become "completed buildings"
- The quiz becomes "let's design your building together"

### Color System

**Light mode (default):**
- Background: white #ffffff / off-white #fafafa
- Text: near-black #111 (headings), gray #666 (body), #999 (muted)
- Primary accent: TBD from violet (#7c3aed) / teal (#0d9488) / cyan (#0891b2) — finalize during implementation with real content
- Secondary: complementary shade for hover/active states
- Blueprint elements: subtle grid lines, construction-inspired UI touches

**Dark mode:**
- Background: deep navy #0c1929 / #0f1f35
- Text: ice white #f0f9ff (headings), slate #94a3b8 (body)
- Primary accent: brighter variant of the same accent (e.g., #22d3ee for cyan)
- Blueprint grid lines become more visible, atmospheric

**Theme switching:**
- Default: `prefers-color-scheme` from browser, fallback to light
- Manual toggle in header, persisted to localStorage
- Smooth CSS transition between modes

### Accessibility: Comfort Mode

A toggle (separate from dark/light) that enables:
- Larger base font size (18px → 22px)
- Increased line height (1.5 → 1.8)
- Higher contrast ratios
- Reduced animations (respects `prefers-reduced-motion` too)
- Simpler layouts (single column where possible)
- Larger click targets (min 48px)

Activated via a small eye/accessibility icon in the header. Not labeled "old people mode" — just a comfort/accessibility toggle that anyone might use.

**Interaction with dark mode:** Independent toggles. Light/dark × normal/comfort = 4 combinations. Implemented via `data-theme="light|dark"` and `data-comfort="on|off"` attributes on `<html>`. CSS variables change per combination. Both persisted to localStorage.

### Typography

- Headings: Bold modern sans-serif (Inter, Plus Jakarta Sans, or similar)
- Body: Same family, regular weight, generous line-height
- Monospace accents: For "blueprint" elements (measurements, specs, code snippets)

## Page Structure

### 1. Homepage

**Hero section:**
- Bold headline with architect metaphor
- Animated blueprint-style illustration or subtle grid background
- Two CTAs: "Начать проект →" (primary) + "Посмотреть работы" (secondary)
- Trust badges: "15+ проектов", "100% в срок", etc.

**Tech demos section (below hero):**
- 3-4 interactive showcases as Next.js routes under `/demos/[slug]` (not iframes — avoids security/performance issues, stays in one codebase)
- Each demo is a standalone page that shows off a capability (parallax landing, interactive catalog, animated dashboard, etc.)
- Not real clients — pure portfolio flexing
- "Хотите такой?" CTA on each
- **Phase 2 feature** — MVP launches without demos, adds them after core quiz/portfolio work

**Style quiz entry:**
- "Найдите свой идеальный сайт" — large, inviting section
- Brief explanation: "Ответьте на 5 вопросов — мы подберём стиль, покажем примеры и оценим стоимость"
- Single CTA button to start the quiz

**Real portfolio (bottom):**
- Grid of completed projects with screenshots, client name, project type, key metric
- Client-side filtering by type (all projects loaded at build time via SSG — appropriate for 10-30 projects)
- Each card links to a case study page

**Persistent sticky header:**
- Logo/name left, nav center, "Начать проект" CTA right
- Always visible, follows scroll
- On portfolio/demo pages: changes CTA to "Хотите такой сайт?"

### 2. Style Quiz (the lead magnet / intake form)

**Step 1 — What do you need?**
Branching first choice:
- 🆕 Создать новый сайт
- 🔧 Доработать или исправить существующий
- 🎨 Только дизайн
- 🤖 Бот или автоматизация
- 🛒 Интернет-магазин

Branch determines which variation of Steps 2-4 the client sees:

| Branch | Step 2 (extra questions) | Step 4 (style) | Result logic |
|--------|------------------------|----------------|-------------|
| New site | Industry, target audience, pages needed | Full style gallery | Price from PricingTier + complexity |
| Fix/improve | Current site URL (required), what's broken, CMS/platform | Skipped (style exists) | Hourly estimate based on scope |
| Design only | Existing brand? Figma? References? | Full style gallery | Design-only pricing tier |
| Bot/automation | What should the bot do? Platform (TG/WhatsApp) | Skipped | Bot pricing tier |
| Store | Products count, payment needs, delivery | Store-specific gallery | Store pricing tier |

**Step 2 — About your business**
- Company name / what you do (free text)
- Industry (dropdown or smart autocomplete)
- Website URL (if exists — required for "fix/improve" branch)
- Branch-specific questions (see table above)

**Step 3 — Budget & timeline**
- Budget range (predefined tiers in RUB: <10k, 10-30k, 30-80k, 80-200k, 200k+)
- Timeline (single field): urgent (<1 week), normal (2-4 weeks), flexible
- Complexity translator shown: "Вот что влияет на стоимость: 🟢🟡🟠🔴"

**Step 4 — Style preferences (Phase 1: simplified, Phase 2: full gallery)**
- **Phase 1 MVP:** Grid of 12-16 screenshot thumbnails of real sites, tagged by mood. Client clicks 2-3 they like. Static images, no swiping.
- **Phase 2 upgrade:** Swipeable gallery with more sites, AI-curated recommendations, filtering by industry.
- Tags: minimal, bold, corporate, warm, dark, colorful, etc.
- Skipped for "fix/improve" and "bot" branches (they already have a site or don't need visual style)

**Step 5 — Contact**
- Name, phone, email, Telegram (at least one contact method required)
- Optional: hosting credentials, domain info, Figma link
- "Чем больше информации — тем быстрее начнём"

**Quiz behavior:**
- Partial progress auto-saved to localStorage (resume if browser closed)
- Validation: Step 1 required, Step 5 requires at least one contact field, all other fields optional
- Abandon: if client leaves after Step 3+, partial data is submitted with status "abandoned" (still a lead)
- Back button works on every step

**Result page:**
- "Ваш рекомендованный стиль: [Minimal & Professional]" (stored as `recommendedStyle` on Lead)
- 3-4 example sites matching their picks
- Estimated complexity: 🟡 Medium
- Estimated range: 30,000 - 60,000₽ (stored as `estimatedMinPrice`/`estimatedMaxPrice`)
- Price calculation: map `projectType` → `PricingTier`, adjust by `budgetRange` and number of complexity flags
- "Денис свяжется с вами в течение 24 часов"
- PDF summary: Phase 1 uses browser `window.print()` with print stylesheet (no server-side PDF generation)

**Data flow:**
- All answers stored in PostgreSQL via Next.js Server Actions
- Denis sees submissions in admin panel
- Future: auto-import into Tracker App as new lead

**AI upgrade path (Phase 2):**
- After Step 2, AI analyzes the business description
- Auto-suggests project type, complexity flags, relevant demos
- Style picker becomes AI-curated ("based on your industry and budget, we recommend...")
- Result page includes AI-generated project brief

### 3. Portfolio / Case Studies

**Grid view:**
- Screenshot + project name + type badge + key metric
- Filter by: type, industry, budget range
- Hover: brief description overlay

**Case study page (per project):**
- Hero screenshot (full-width)
- Project overview: client, type, timeline, stack
- Problem → Solution → Result narrative
- Before/after (if applicable)
- Key metrics or testimonials
- "Хотите подобный проект?" CTA → quiz

### 4. Demos

**Interactive showcases:**
- Each demo is a standalone mini-site (could be iframe or separate route)
- Examples: parallax landing, animated product catalog, dashboard with charts, bot interaction mockup
- Not connected to real backends — static/mocked data
- Purpose: "look what's possible" + "imagine this for your business"

### 5. Pricing (optional page)

- Transparent pricing tiers by project type
- Range format: "Лендинг: от 15,000₽" / "Корпоративный: от 50,000₽"
- Complexity explainer with the 🟢🟡🟠🔴 system
- "Точная стоимость — после короткого разговора" → quiz CTA

### 6. About

- Brief personal bio (professional, not oversharing)
- Photo (optional but recommended for trust)
- Stack/skills badges
- "Почему я" differentiators
- Timeline of experience

### 7. Admin Panel

**Dashboard:**
- New leads (from quiz submissions)
- Lead details: all quiz answers, style picks, contact info
- Status: new / contacted / converted / declined
- Quick actions: mark as contacted, add notes, export to Tracker

**Content management:**
- Portfolio: add/edit/remove projects (title, screenshots, description, type, tags)
- Demos: manage which demos appear on homepage
- Quiz: edit reference sites in the style picker, manage tags
- Pricing: edit price ranges per project type
- Site text: edit headlines, descriptions, CTA text
- Accessibility: preview comfort mode

**Authentication:**
- Simple: email/password for Denis only (single admin)
- No public registration (admin-only CMS)

## Tech Stack

| Layer | Tech | Why |
|-------|------|-----|
| Framework | Next.js 15 (App Router) | SSR for SEO, API routes for admin, React for interactivity |
| Styling | Tailwind CSS v4 | Consistent with all other projects, fast dev |
| UI | Radix UI + custom components | Accessible primitives, architect-themed custom styling |
| Icons | Lucide React | Consistent with portfolio |
| Animations | Framer Motion | Smooth transitions for quiz steps, demo reveals, theme toggle |
| Database | PostgreSQL (via Prisma) | Stores leads, portfolio items, quiz config, site content |
| Auth (admin) | NextAuth.js (Credentials provider) | Single admin user, session-based, Next.js middleware for route protection |
| File storage | Vercel Blob (production), local `public/` (dev only) | Portfolio screenshots, demo assets. Local FS is ephemeral on Vercel. |
| API approach | Next.js Server Actions (mutations) + Route Handlers (read APIs) | No separate REST API. Admin panel uses Server Actions for all CRUD. |
| Hosting | Vercel (free tier to start) | Perfect for Next.js, free SSL, fast CDN |
| Analytics | Vercel Analytics or Plausible | Privacy-friendly, see which demos/projects get attention |

## Data Model

```
Lead (from quiz submissions)
  - id, createdAt
  - projectType (new_site / fix / design / bot / store)
  - businessName, industry, websiteUrl
  - budgetRange, timeline, urgency
  - stylePreferences: Tag[] (minimal, bold, etc.)
  - referenceSites: string[] (URLs they picked)
  - contactName, phone, email, telegram
  - hostingCredentials (optional, encrypted)
  - recommendedStyle: string (computed from style picks)
  - estimatedMinPrice, estimatedMaxPrice: number (calculated from PricingTier + complexity)
  - currency: string (default "RUB")
  - aiAnalysis (future: complexity flags, recommended approach)
  - status (new / contacted / converted / declined / abandoned)
  - notes (admin)

PortfolioProject
  - id, title, slug
  - type (landing / corporate / store / bot / app / fixes)
  - clientName (optional — may be anonymized)
  - description, problem, solution, result
  - screenshots: string[]
  - techStack: string[]
  - tags: string[]
  - metrics (optional: "delivered in 3 days", "PageSpeed 95")
  - isPublic: boolean
  - sortOrder

Demo (Phase 2)
  - id, title, slug
  - description
  - type (parallax / catalog / dashboard / bot)
  - route: string (Next.js route under /demos/[slug])
  - thumbnail
  - isActive: boolean

ReferenceStyle (for quiz style picker)
  - id, name (e.g., "Apple.com")
  - url, screenshot
  - tags: string[] (minimal, bold, dark, corporate, warm)
  - industry: string
  - isActive: boolean

SiteContent (CMS key-value for editable text)
  - key (hero_title, hero_subtitle, pricing_landing_min, etc.)
  - value
  - updatedAt

PricingTier
  - projectType
  - minPrice, maxPrice
  - currency: string (default "RUB")
  - description
  - features: string[]
```

## Integration with Tracker App

**Phase 1 (MVP):**
- No direct integration
- Denis views leads in admin panel, manually creates projects in Tracker App
- Portfolio content managed in admin panel (not synced from Tracker)

**Phase 2:**
- "Export to Tracker" button in admin → generates Dexie commands or JSON
- Portfolio auto-populates from Tracker App projects marked `isPublic`
- Shared credential handling (admin panel encrypts, Tracker App decrypts)

**Phase 3:**
- Unified backend serving both portfolio and Tracker App
- Real-time sync: new lead in quiz → auto-appears in Tracker as lead project
- Client portal: client can see their project progress (read-only view from Tracker data)

## Implementation Phases

### Phase 1: Core (MVP — ship first)
- Homepage: hero + sticky header + real portfolio grid
- Style quiz: 5-step branching wizard, stores submissions
- Admin: view leads, manage portfolio content
- Light/dark mode with toggle
- Deploy to Vercel
- **No demos, no AI, no Tracker integration yet**

### Phase 2: Showcase
- Tech demos (2-3 interactive mini-sites)
- Case study pages for portfolio projects
- Pricing page with complexity explainer
- Comfort mode (accessibility toggle)
- Quiz: add reference site gallery for style picking

### Phase 3: Intelligence
- AI analysis of quiz submissions (call Claude API)
- AI-curated style recommendations
- Auto-generate complexity assessment from quiz answers
- Tracker App integration (export leads, import portfolio)

### Phase 4: Client Portal
- Client can see their project status (read from Tracker or shared DB)
- Progress timeline matching architect metaphor (blueprint → foundation → build → handoff)
- File sharing (client uploads assets directly)

## Verification

- Homepage loads in <2.5s (LCP), PageSpeed Mobile >90
- Quiz completes in <3 minutes for a typical client
- Admin panel: CRUD works for all entities
- Light/dark/comfort modes all render correctly
- Mobile responsive: 375px / 768px / 1024px / 1440px
- SEO: proper meta tags, OG images, sitemap for portfolio pages
- Quiz submissions stored correctly, visible in admin
- No credentials stored in plain text anywhere
