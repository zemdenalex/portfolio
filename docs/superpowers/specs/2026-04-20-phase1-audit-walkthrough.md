# Phase 1 Audit — Hands-On Walk-Through

> Step-by-step test script. Do the action, check the boxes, add notes. Share back when done — Claude will merge findings into the log and triage.

**Date:** 2026-04-20
**Time:** ~45-60 min
**Devices:** Laptop (Chrome or Firefox) + real phone
**Admin password needed for section 4:** get from `/opt/archifex/deploy/.env` on the VPS if you don't have it handy.

---

## 1. Homepage — laptop

### 1a. Open https://archifex.space/en

**Look at the page without scrolling yet.**

- [ ] Hero copy reads like your voice (not generic "We build websites")
- [ ] Nothing is cut off, overlapping, or obviously broken
- [ ] CTA buttons (quiz, portfolio) are visible above the fold

**Scroll down to the portfolio grid.**

- [ ] You see projects you actually did (not leftover seed data)
- [ ] Thumbnails render (no broken image icons)
- [ ] Each card shows a title + short description
- [ ] Filter buttons (if any) work when clicked

### 1b. Switch to Russian — click the language toggle (EN → RU)

- [ ] URL changes to /ru
- [ ] All visible text is in Russian (no leftover English strings)
- [ ] RU reads natural, not Google-translated
- [ ] Scroll position stays reasonable (not jumped back to top awkwardly)

### 1c. Theme toggles (still on /ru or /en, your choice)

- [ ] Click light/dark toggle → colors invert correctly, no flash of unstyled content
- [ ] Click comfort toggle → text gets bigger, animations slow or stop
- [ ] Reload the page (F5) → your theme/comfort choices persist
- [ ] Open a new tab, go to archifex.space → same theme choices show

**Free-form notes for section 1:**
```


```

---

## 2. Portfolio + case study — laptop

### 2a. Click any portfolio card → lands on /en/portfolio/[slug]

- [ ] Hero title + metadata (date, type, stack) show
- [ ] Scrolling the page reveals real content blocks, not a blank section
- [ ] No raw JSON, HTML tags, or `undefined` visible anywhere

**Look at what block types are on this page.** (A block = a section like text paragraphs, images, metrics, etc.)

- [ ] Text paragraphs render with reasonable spacing
- [ ] Metrics (numbers + labels, if present) aren't squashed
- [ ] Code blocks (if present) use monospace font, have syntax color or at least readable formatting
- [ ] No placeholder boxes that say "Gallery placeholder" or similar

### 2b. Try 2-3 more case studies

- [ ] Visit `/en/portfolio/helvexa-clean` — **expected to look bare** (audit flagged it has zero blocks). Is it totally empty or is there at least a hero?
- [ ] Visit `/en/portfolio/krot-tildabrand` — same expectation
- [ ] Visit another one you know has content — should read well

### 2c. Hit a fake URL — `/en/portfolio/does-not-exist-xyz`

- [ ] You see a proper 404 page (not white screen or ugly error)
- [ ] The 404 has a link back to the homepage or portfolio

**Free-form notes for section 2:**
```


```

---

## 3. Quiz flow — laptop

### 3a. Go to https://archifex.space/en/quiz

- [ ] Root question renders with readable options
- [ ] Clicking an option moves you to the next question
- [ ] Every option on every screen works (try 2-3 different paths)

### 3b. Reach a result page

- [ ] Result page shows a recommended style + a recommended package
- [ ] You see preview cards for style references (small browser chrome around a website/screenshot)
- [ ] The recommendation makes sense for the path you took (e.g., "landing page, minimalist" if that's what you clicked)

### 3c. Submit a test lead from the result page

Use:
- Name: `Audit Test Denis`
- Email: `audit-manual@archifex.test`
- Message: `manual audit walk-through`

- [ ] Form validates required fields (try empty email → error)
- [ ] Submit succeeds with a confirmation message/screen
- [ ] No JS errors in browser console (F12 → Console tab, should be mostly empty or only harmless warnings)

### 3d. Try again in Russian

Go to https://archifex.space/ru/quiz, walk one path.

- [ ] All question + option text is Russian
- [ ] Result screen is fully Russian

**Free-form notes for section 3:**
```


```

---

## 4. Admin panel — laptop

### 4a. Login — go to https://archifex.space/admin (or /admin/login)

- [ ] Login form loads cleanly
- [ ] Entering wrong password → clear error message (not a blank page)
- [ ] Entering right password → redirects to dashboard

### 4b. Dashboard

- [ ] Stats numbers render (leads count, projects count, etc.)
- [ ] You can click into each section from the sidebar

### 4c. Leads list

- [ ] Your test lead `audit-manual@archifex.test` from step 3c appears
- [ ] Click the lead → detail view shows all fields you submitted
- [ ] Change status (new → contacted) → saves without errors
- [ ] Delete the test lead → it disappears from the list
- [ ] Reload page → confirms delete (not just hidden client-side)

### 4d. Portfolio editor

- [ ] List shows all projects (published + draft)
- [ ] Click an existing project → edit form loads with real data
- [ ] Try changing the title, hit Save → change persists on reload
- [ ] Undo your change (set it back) — don't leave garbage

**Block editor on that same project:**

- [ ] Existing blocks are listed with their types (TEXT, METRICS, etc.)
- [ ] You can reorder a block (up/down or drag) → order persists
- [ ] You can edit a TEXT block's content → persists
- [ ] Try adding each block type once: TEXT, GALLERY, EMBED, CODE, METRICS, TESTIMONIAL — does each form make sense? Does it save?
- [ ] Delete the blocks you just added

### 4e. Quiz tree editor

- [ ] Tree shows the full structure (5 QUESTION nodes + 10 RESULT leaves)
- [ ] Click a question → edit form
- [ ] Change a question text, save, reload → persists
- [ ] Set it back to original

### 4f. Styles + screenshots

- [ ] List shows 4 styles (bold-modern, corporate-classic, creative-experimental, minimalist)
- [ ] Click one → shows references with screenshots (or placeholders)
- [ ] Try "Capture screenshot" on one reference URL → wait ~10-15s → succeeds with image

### 4g. Packages

- [ ] List shows 4 packages
- [ ] You'll notice titles/prices/durations are **null** (audit already flagged this)
- [ ] Try editing one — set a title, price, duration, save
- [ ] Go to public page → does it show now?
- [ ] Revert your change (or leave real content in place — your call)

### 4h. Content CMS

- [ ] List of site-content key-value pairs loads
- [ ] Edit one value (e.g., `footer.copyright` or similar) → save
- [ ] Reload the homepage → change reflected
- [ ] Revert it

### 4i. Settings

- [ ] Profile form loads with your current email/name
- [ ] Change password flow works (try changing to the same password)

**Free-form notes for section 4:**
```


```

---

## 5. Logos tool — laptop

### 5a. Open https://archifex.space/logos in a fresh tab (or incognito)

- [ ] Intro banner shows on first visit
- [ ] "Don't show again" button dismisses it
- [ ] Reload → banner stays dismissed

### 5b. Rate mode

- [ ] All 30 logos visible in grid view (toggle if on single view)
- [ ] Click score buttons 0-10 on a few logos → persists
- [ ] Keyboard: press a number → rates the currently focused logo
- [ ] `F` key toggles favorite
- [ ] `←` / `→` move between logos in single view

### 5c. Compare mode

- [ ] Switch to compare tab
- [ ] Two logos side by side, pick one → records winner
- [ ] Space/skip moves to next pair without recording

### 5d. Results tab

- [ ] Global tab shows aggregate scores across all voters
- [ ] By-voter tab shows per-session rankings with labels
- [ ] Just-mine tab shows your session's ratings + favorites

**Free-form notes for section 5:**
```


```

---

## 6. Mobile — real phone

Open https://archifex.space on your phone. Don't use DevTools emulation — real device.

### 6a. Homepage

- [ ] Hero text is readable without pinch-zoom
- [ ] Portfolio cards stack in one column, no horizontal scroll
- [ ] Language toggle + theme toggle are tappable (not fiddly)

### 6b. Case study on phone

- [ ] Text columns fit the screen (no horizontal scroll)
- [ ] Images sized to fit (not cropped weirdly)
- [ ] Metrics/blocks stack cleanly

### 6c. Quiz on phone

- [ ] Quiz options are finger-tappable (not too small)
- [ ] Next question loads quickly (no awkward pause)
- [ ] Lead form at the end is usable — typing works, keyboard doesn't cover submit button

### 6d. Logos on phone

- [ ] Logo SVGs fit screen without scroll-overflow
- [ ] 11 score buttons (0-10) all fit in one row on your phone — no wrapping
- [ ] Share button works → native share sheet opens (iOS/Android), or copies URL on tap

**Free-form notes for section 6:**
```


```

---

## 7. Deliberate breakage tests — laptop

These verify the app degrades gracefully under adverse conditions.

### 7a. Offline test

Open DevTools → Network → throttle to "Offline", then reload a public page.

- [ ] Page degrades (shows an error state, retries, or cached version) — not a frozen white screen
- [ ] Restore throttle to "No throttling" after test

### 7b. Slow network

DevTools → Network → "Slow 3G", reload `/en/portfolio`.

- [ ] Something visibly loads (skeleton, spinner, or partial content)
- [ ] No hydration errors in console

**Free-form notes for section 7:**
```


```

---

## 8. Anything else

Things you noticed that don't fit above. One-liner per issue:

- 
- 
- 
- 
- 

---

## When done

Share this file back (or paste the checked version into chat). I'll transcribe findings into the main log, classify severities, and produce the Pass 3 fix queue.
