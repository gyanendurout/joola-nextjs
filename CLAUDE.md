# JOOLA Pulse — Session Memory

This file is read automatically by Claude Code at session start. It captures the exact state of the project so work can resume without re-explaining context.

---

## Project Overview

**Repo:** `c:\Workspace\joola-nextjs` (subfolder: `frontend\`)  
**App root:** `c:\Workspace\joola-nextjs\frontend\`  
**Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS (kept for compat) · Supabase  
**Design system:** Design2 (v2) — dark neuro theme, `.v2-root` CSS scope, `--yellow: #F5E625`, `--joola: #22c55e`  
**Fonts:** Archivo + Archivo Black + JetBrains Mono (loaded via @import in globals.css)  
**Branch:** `main` | **Backup:** `backup/pre-design2` (pre-redesign state)  
**Git remote:** GitHub (push via PowerShell — Bash hangs waiting for credential UI)

**ALL work happens inside `c:\Workspace\joola-nextjs\` only. Never modify files under `C:\Workspace\SEO\`.**

The FastAPI backend lives at `c:\Workspace\joola-nextjs\backend\` (copied from the old SEO folder — that folder is now obsolete).

---

## BRD Document

Full Business Requirements Document saved at:  
`c:\Workspace\joola-nextjs\JOOLA_PULSE_BRD.md`

Title: **JOOLA Pulse — Own-Brand Digital Intelligence Platform** (13 sections, May 2026).  
Scope: JOOLA's own brand only (Instagram intelligence + SEO intelligence). No competitor benchmarking.

---

## Design System (Design2 / v2)

Reference files: `frontend/design2/` — **read-only reference, do not run**

| File | Purpose |
|------|---------|
| `design2/styles.css` | Full CSS reference (copied to globals.css) |
| `design2/app.jsx` | NAV structure + shell reference |
| `design2/charts.jsx` | SVG chart components reference |
| `design2/icons.jsx` | ICONS dict + `Ic` component |
| `design2/data.js` | Mock data shapes |
| `design2/pages/*.jsx` | Page reference designs |

**CSS scope:** All design2 CSS is under `.v2-root` class applied to `<body>` in `app/layout.tsx`.

Key CSS classes to use:
- Layout: `.shell`, `.main`, `.main.collapsed`, `.main-inner`
- Sidebar: `.sidebar`, `.sidebar.collapsed`, `.brand`, `.nav-section`, `.nav-group`, `.nav-label`, `.nav-item.active`, `.sidebar-foot`
- KPIs: `.kpi-grid`, `.kpi`, `.kpi.joola/warn/danger`, `.kpi .label`, `.kpi .value`, `.kpi .delta.up/down`
- Cards: `.card`, `.card-pad-lg`, `.card-head`, `.card-grid`, `.cg-2`, `.cg-3`, `.cg-2-1`
- Tables: `table.data`, `th.num`, `.cell-num`, `tr.highlight`, `.you-badge`, `.tlink`
- Comments: `.comment-row`, `.comment-user`, `.comment-body`, `.quote`
- Pipeline: `.pipeline`, `.pipe-step.pending/running/done/error`, `.pipe-num`, `.pipe-label`, `.ps-done/running/pending/error`
- Misc: `.section`, `.divider`, `.empty`, `.pill-*`, `.chip`, `.chip.on`, `.btn`, `.btn-yellow`, `.fld`, `.tabs`, `.tab.on`, `.live-pulse-dot`

---

## Sidebar Navigation (DashboardShell.tsx)

```
INTELLIGENCE:
  Overview → /overview  [LIVE badge]

INSTAGRAM:
  Posts & Cadence → /posts
  Comment Intel   → /comments
  Fans & Ambassadors → /fans
  Complaints      → /complaints

SEO:
  Run Analysis    → /seo-analyze
  Search Health   → /seo-dashboard
  In News         → /seo-news
```

---

## Key Files Changed in Design2 Redesign

| File | Status |
|------|--------|
| `app/layout.tsx` | Rewritten — removed Inter font, added `v2-root` class, title "JOOLA Pulse" |
| `app/globals.css` | Fully rewritten — Design2 CSS system + Tailwind kept |
| `components/DashboardShell.tsx` | Rewritten — new sidebar with INTELLIGENCE/INSTAGRAM/SEO nav |
| `components/ui/Sparkline.tsx` | NEW — SVG sparkline with area gradient |
| `components/ui/Donut.tsx` | NEW — SVG donut chart + DonutLegend |
| `components/ui/PulseLineChart.tsx` | NEW — responsive line chart with hover tooltip |
| `components/ui/KpiCard.tsx` | NEW — KPI card with sparkline |
| `components/PostingTimeHeatmap.tsx` | Rewritten — design2 yellow ramp heatmap |
| `components/ContentCalendar.tsx` | Rewritten — design2 green ramp calendar |
| `app/overview/OverviewClient.tsx` | NEW — design2 overview with section tabs |
| `app/overview/page.tsx` | Rewritten — passes OverviewData to OverviewClient |
| `app/posts/PostsClient.tsx` | Rewritten — design2 posts table + heatmap/calendar |
| `app/posts/page.tsx` | Rewritten — passes all data including heatmap/calendar |
| `app/comments/CommentsClient.tsx` | Rewritten — design2 comment rows + donut sidebar |
| `app/fans/FansClient.tsx` | Rewritten — design2 pipeline table + tier/score badges |
| `app/complaints/ComplaintsClient.tsx` | Rewritten — design2 complaint queue + category bars |
| `app/seo-analyze/page.tsx` | NEW — SSE pipeline page (client component) |
| `app/seo-dashboard/page.tsx` | NEW — SEO dashboard server component |
| `app/seo-dashboard/SeoDashboardClient.tsx` | NEW — SEO dashboard UI |
| `app/seo-news/page.tsx` | NEW — News page server component (Supabase fetch) |
| `app/seo-news/NewsClient.tsx` | NEW — Full news UI: tabs (Articles/Analytics/Sources), KPIs, modal |
| `next.config.mjs` | Updated — `/seo-api/:path*` → FastAPI proxy |

---

## Supabase Tables

### Instagram
| Table | Purpose |
|-------|---------|
| `joola_ig_posts` | Post metadata + stats (post_id, post_type, engagement_rate, like_count, comment_count, view_count, posted_at, day_of_week, hour_of_day, thumbnail_url, caption) |
| `joola_ig_comments` | Raw comments (comment_id, post_id, username, comment_text, commented_at) |
| `joola_ig_comment_analysis` | AI analysis (sentiment, sentiment_score, primary_topic, emotion, is_complaint, purchase_intent, etc.) |
| `joola_ig_loyal_users` | Fan profiles (username, loyalty_tier, ambassador_score, is_potential_ambassador, active_months, avg_sentiment_score) |
| `joola_ig_complaint_log` | Complaints (comment_id, username, complaint_text, complaint_category, severity, joola_responded, complained_at) |
| `joola_ig_weekly_snapshot` | Weekly rollups (week_start, posts_published, total_comments, total_views, avg_engagement_rate, complaint_count, purchase_intent_count) |
| `joola_ig_wishlist_items` | Feature requests (wishlist_text, category, username) |
| `joola_ig_post_analysis` | Post AI analysis (post_id, content_theme, post_intent, sentiment_tone) |

### SEO (FastAPI backend tables)
| Table | Purpose |
|-------|---------|
| `runs` | SEO analysis runs (id, run_date, status) |
| `issues` | Technical issues (issue_type, severity, title, description, category) |
| `domain_ranked_keywords` | Keyword rankings (keyword, search_volume, difficulty, position, previous_position, is_gap) |
| `backlinks_summary` | Backlink overview |
| `performance_cache` | Cached GSC data |

### News Intelligence (migration 006 required)
| Table | Purpose |
|-------|---------|
| `news_articles` | Scraped articles — url (unique), title, excerpt, sentiment, sentiment_score, is_joola_mention, joola_context, players_mentioned, competitors_mentioned, has_competitor_mention, relevance_type, importance_score, suggested_action, ai_summary, why_it_matters, content_hash |
| `news_scrape_runs` | Scrape job history — status, sites_total/scraped, articles_found/new/with_mentions, joola_related_articles, successful/failed_sources |
| `news_sources` | Site registry with authority_score, last_success_at, last_failed_at |
| `news_scrape_errors` | Per-site error log linked to scrape run |

---

## FastAPI Backend (SEO + News Intelligence)

**Location:** `c:\Workspace\joola-nextjs\backend\`  
**Runs at:** `http://localhost:8000`

### Start the backend
```powershell
cd "C:\Workspace\joola-nextjs\backend"
# First time only: create venv and install
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
# Every time:
.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

### Key endpoints
- `POST /api/news/scrape` → triggers background scrape, returns `{ run_id }`
- `GET /api/news/scrape/{run_id}/events` → SSE progress stream
- `GET /api/news/articles` → filtered article list
- `GET /api/news/analytics/summary` → KPI totals + trends
- `POST /seo-api/analyze` → SEO crawl (proxied via next.config.mjs)

### Next.js proxy
`/seo-api/:path*` → `${SEO_API_URL}/api/:path*`  
`SEO_API_URL` defaults to `http://localhost:8000`

### REQUIRED: Run migration 006 in Supabase SQL editor
File: `backend/supabase/migrations/006_news_tables.sql`  
Creates/updates: `news_articles`, `news_scrape_runs`, `news_sources`, `news_scrape_errors`  
**Scraping will fail until this migration is applied.**

---

## Dev Server

```powershell
# Next.js (terminal 1)
cd "C:\Workspace\joola-nextjs\frontend" ; npm run dev

# FastAPI backend (terminal 2)
cd "C:\Workspace\joola-nextjs\backend"
.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

Next.js runs at `http://localhost:3000`. Backend at `http://localhost:8000`.

---

## Coding Patterns

1. **Server components** fetch from Supabase, pass typed data to `*Client.tsx`
2. **Client components** handle filtering, sorting, tabs with `useState`
3. **Inline SVG icons** — no lucide-react in new components; use `Ic` pattern from DashboardShell
4. **CSS classes** — use design2 classes (`.card`, `.kpi`, `.pipe-step`, etc.), NOT Tailwind for new components
5. **`.v2-root`** is on `<body>` — all CSS vars + design2 styles apply globally
6. **Git push** via PowerShell only (Bash hangs on credential prompt)

---

## Phase 2 Features (Pending)

- Live Instagram feed (real-time comment webhook)
- Ambassador outreach CRM panel
- Content generation with JOOLA brand voice
- AI weekly briefing email digest
