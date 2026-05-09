# JOOLA Instagram Intelligence — Next.js Dashboard

## Quick Setup

```bash
npm install
npm run dev
# Open: http://localhost:3000
```

---

## Environment Variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
APIFY_API_TOKEN=your-apify-api-token
APIFY_USER_ID=your-apify-user-id
OPENAI_API_KEY=sk-...   ← required for /generate (Post Generator)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router (TypeScript) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| AI — Image | OpenAI DALL-E 3 (`dall-e-3`, HD quality) |
| AI — Caption | OpenAI GPT-4o (`gpt-4o`, JSON mode) |
| Charts | Recharts |
| Icons | lucide-react |
| Date | date-fns |

---

## Pages

| Route | File | Description |
|-------|------|-------------|
| `/overview` | `app/overview/` | KPI cards, weekly charts, sentiment distribution |
| `/posts` | `app/posts/` | All posts; filter by type/theme; search caption |
| `/comments` | `app/comments/` | Emotion analysis, topic breakdown, sentiment trends |
| `/fans` | `app/fans/` | Loyal users, tiers, ambassador score explanation, potential ambassadors |
| `/competitors` | `app/competitors/` | Competitor mentions; dropdown filter by competitor name |
| `/complaints` | `app/complaints/` | Complaint log and wishlist items; category filter |
| `/content` | `app/content/` | Theme performance, hashtag analysis, top 10 posts |
| `/generate` | `app/generate/` | **AI Post Generator** — 3-column layout (form / output / reference) |
| `/products` | `app/products/` | Product and athlete mentions |

---

## Supabase Tables

| Table | Purpose |
|-------|---------|
| `joola_ig_posts` | Raw post data (engagement, captions, hashtags, timestamps) |
| `joola_ig_post_analysis` | AI analysis per post (theme, shot type, setting, sentiment) |
| `joola_ig_comments` | Raw comment data |
| `joola_ig_comment_analysis` | Per-comment AI sentiment, emotion, topics, purchase intent |
| `joola_ig_loyal_users` | Aggregated fan loyalty scores and ambassador scoring |
| `joola_ig_user_post_activity` | Per-user per-post comment activity |
| `joola_ig_hashtag_performance` | Hashtag avg engagement, like count, times used |
| `joola_ig_product_mentions` | Product mentions from posts/comments |
| `joola_ig_athlete_mentions` | Athlete mentions from posts/comments |
| `joola_ig_competitor_mentions` | Competitor mentions in comments |
| `joola_ig_complaint_log` | Flagged complaints with severity and category |
| `joola_ig_wishlist_items` | Fan wishlist requests |
| `joola_ig_joola_replies` | JOOLA's own replies to comments |
| `joola_ig_weekly_snapshots` | Weekly aggregated KPI snapshots |
| `joola_ig_generated_posts` | AI-generated post drafts (Post Generator output) |

### `joola_ig_generated_posts` schema (created manually in Supabase)
```sql
CREATE TABLE IF NOT EXISTS joola_ig_generated_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT, theme TEXT, format TEXT, tone TEXT,
  caption TEXT, hashtags TEXT[], image_prompt TEXT, image_url TEXT,
  best_day TEXT, best_time TEXT,
  predicted_eng_min FLOAT, predicted_eng_max FLOAT,
  why_this_works TEXT, reference_post_ids TEXT[],
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(), posted_at TIMESTAMP
);
```

---

## Project File Structure

```
joola-nextjs/
├── app/
│   ├── layout.tsx                  # Root layout — Sidebar + main wrapper
│   ├── page.tsx                    # Redirects to /overview
│   ├── overview/                   # KPI + charts page
│   ├── posts/
│   │   └── PostsClient.tsx         # Posts table with engagement tooltip
│   ├── comments/
│   ├── fans/
│   │   └── FansClient.tsx          # Ambassador score explanation card
│   ├── competitors/
│   │   └── CompetitorsClient.tsx   # Competitor dropdown filter
│   ├── complaints/
│   ├── content/
│   │   └── ContentClient.tsx       # Engagement tooltips on 3 columns
│   ├── generate/
│   │   ├── page.tsx                # Post Generator orchestrator (client)
│   │   └── types.ts                # Shared TS types for Post Generator
│   ├── products/
│   └── api/
│       ├── generate-post/route.ts  # POST — runs DALL-E 3 + GPT-4o in parallel
│       ├── theme-posts/route.ts    # GET ?theme= — top posts for right column
│       ├── save-draft/route.ts     # POST — saves to joola_ig_generated_posts
│       ├── drafts/route.ts         # GET + PATCH — fetch / update draft status
│       └── proxy-image/route.ts   # GET ?url= — server-side image proxy for download
├── components/
│   ├── Sidebar.tsx                 # Fixed left nav (220px)
│   ├── DataTable.tsx               # Reusable table — supports headerNode for JSX headers
│   ├── PostGeneratorForm.tsx       # Left column form (topic, theme, format, tone, etc.)
│   ├── GeneratedPostOutput.tsx     # Center column — image, caption editor, hashtags, intelligence
│   ├── WinningPostsReference.tsx   # Right column — live theme posts + success pattern
│   ├── DraftHistory.tsx            # Draft history table with expand/collapse rows
│   ├── InfoTooltip.tsx             # Hover tooltip — used in Engagement column headers
│   ├── KPICard.tsx                 # Stat card widget
│   ├── BarChartWidget.tsx          # Recharts bar chart wrapper
│   ├── LineChartWidget.tsx         # Recharts line chart wrapper
│   ├── DonutChartWidget.tsx        # Recharts donut chart wrapper
│   └── SentimentBadge.tsx          # positive/neutral/negative badge
└── lib/
    ├── supabase.ts                 # Client-side Supabase client (anon key)
    ├── types.ts                    # All TS interfaces for Supabase tables
    └── utils.ts                    # cn(), formatNumber(), formatPct(), formatEngagement(), truncate()
```

---

## Key Patterns

### Server-side Supabase (API routes)
API routes use service role key for unrestricted queries:
```ts
import { createClient } from '@supabase/supabase-js'
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### Client-side Supabase (pages/components)
```ts
import { supabase } from '@/lib/supabase'  // uses anon key
```

### DataTable with JSX column headers
`DataTable` `Column` interface has `headerNode?: React.ReactNode` for embedding tooltips:
```tsx
{
  key: 'engagement_rate',
  header: 'Engagement',   // used for sort key
  headerNode: <span className="inline-flex items-center gap-1">
    Engagement <InfoTooltip text={ENGAGEMENT_TOOLTIP} wide />
  </span>,
}
```

### `formatEngagement()` heuristic
`engagement_rate` in DB may be stored as decimal (0.05) or percent (5.0). The function multiplies by 100 if value < 1. **Caveat:** values below 1% (e.g., 0.8%) would be incorrectly shown as 80%.

---

## Post Generator (`/generate`) — Architecture

### Flow
1. User fills form (topic, theme, format, tone, athlete, product, caption length)
2. `POST /api/generate-post` runs:
   - Fetches top posts for selected theme from `joola_ig_post_analysis` + `joola_ig_posts`
   - Falls back to all-theme top posts if fewer than 3 theme posts exist
   - Fetches comment emotions + top hashtags from DB
   - Computes: bestDay, bestTime, avgEngagement, dominantShotType, successPattern
   - Runs **DALL-E 3** (HD, 1024×1024 for photo/carousel, 1792×1024 for reel) + **GPT-4o** (JSON mode) in **parallel** via `Promise.allSettled()`
   - Enriches GPT hashtags with DB stats from `joola_ig_hashtag_performance`
3. Output renders in center column: editable caption, hashtag pills with stats, posting intelligence grid, "Why This Works"
4. Right column shows reference posts used (or live theme posts if not yet generated)
5. Save to Draft → `POST /api/save-draft` → row in `joola_ig_generated_posts`
6. Mark as Posted → `PATCH /api/drafts` → updates status + posted_at

### Image Download
DALL-E 3 CDN URLs can't be fetched client-side (CORS). Download goes through:
`GET /api/proxy-image?url=<encoded-url>` — validates host against OpenAI CDN allowlist, returns blob.

### OpenAI Models Used
| Task | Model | Notes |
|------|-------|-------|
| Image | `dall-e-3` | HD quality, natural style |
| Caption + JSON | `gpt-4o` | `response_format: { type: 'json_object' }` |

---

## Component Notes

### `WinningPostsReference`
- `theme` prop change → fetches `/api/theme-posts?theme=` live (pre-generation)
- `overridePosts` prop set → uses those posts (post-generation, shows the actual reference posts used)

### `DraftHistory`
- Fetches on mount + whenever `refreshKey` prop changes
- Expandable rows show caption, hashtags, why_this_works
- Status badges: draft (yellow), approved (blue), posted (emerald)

### Ambassador Score (Fans page)
Score is 0–10 based on: comment frequency, consistency, positive sentiment, enthusiasm. Tiers:
- ≥7.5 → Top Ambassador (emerald)
- 7.0–7.4 → Strong Candidate (yellow)
- 6.5–6.9 → Emerging Fan (orange)
- <6.5 → Regular Fan (slate)

---

## Known Issues / Notes

- **React error #299** — caused by Chrome extension (`chrome-extension://oihbmmeelledioenpfcfehdjhdnfjibj`), not our code. Test in incognito.
- **`formatEngagement` edge case** — values stored as percentage below 1% (e.g., 0.8%) will be wrongly shown as 80%. Needs confirmation of actual DB scale before fixing.
- **DALL-E 3 content policy** — prompts explicitly exclude real celebrity likenesses and text/logos to avoid rejections.
