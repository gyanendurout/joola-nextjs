"""
JOOLA Instagram Latest Data Scraper
=====================================
Fetches the most recent posts and comments from JOOLA's Instagram account
via the Instagram Graph API, then upserts into Supabase.

USAGE
-----
  python scrape_ig_latest.py                  # fetch last 50 posts + comments
  python scrape_ig_latest.py --posts 100      # fetch more posts
  python scrape_ig_latest.py --dry-run        # fetch only, print first row, don't write

REQUIRED ENV VARS  (add to backend/.env)
-----------------------------------------
  IG_ACCESS_TOKEN          Long-lived Instagram Graph API access token
  IG_ACCOUNT_ID            Instagram Business Account ID (numeric string)
  SUPABASE_URL             e.g. https://xxxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY  Supabase service role key (bypasses RLS)

GETTING YOUR IG CREDENTIALS
-----------------------------
  1. Go to developers.facebook.com → My Apps → create/select app
  2. Add "Instagram Graph API" product
  3. Under Instagram → Basic Display, get a Long-lived Token
  4. Your IG Account ID: GET https://graph.facebook.com/me/accounts?access_token=TOKEN
     then GET https://graph.facebook.com/{page_id}?fields=instagram_business_account&access_token=TOKEN
"""

import os
import sys
import json
import time
import argparse
import requests
from datetime import datetime, timezone
from pathlib import Path

# ── Load .env ─────────────────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")
except ImportError:
    pass  # dotenv optional; rely on env vars being set externally

# ── Config ────────────────────────────────────────────────────────────────────
IG_TOKEN    = os.environ.get("IG_ACCESS_TOKEN", "")
IG_ACCT     = os.environ.get("IG_ACCOUNT_ID", "")
SB_URL      = os.environ.get("SUPABASE_URL", "")
SB_KEY      = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

GRAPH = "https://graph.facebook.com/v20.0"


# ── Supabase helpers ──────────────────────────────────────────────────────────
def _sb_headers() -> dict:
    return {
        "apikey": SB_KEY,
        "Authorization": f"Bearer {SB_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }


def sb_upsert(table: str, rows: list[dict], dry_run: bool = False) -> None:
    if not rows:
        return
    if dry_run:
        print(f"  [DRY RUN] Would upsert {len(rows)} rows into {table}")
        return
    # Batch in chunks of 200 to stay within Supabase request limits
    for i in range(0, len(rows), 200):
        chunk = rows[i : i + 200]
        resp = requests.post(
            f"{SB_URL}/rest/v1/{table}",
            headers=_sb_headers(),
            json=chunk,
            timeout=30,
        )
        if not resp.ok:
            print(f"  [WARN] {table} upsert chunk {i//200+1}: {resp.status_code} — {resp.text[:300]}")
        else:
            print(f"  ✓  {table}: upserted {len(chunk)} rows")


# ── Instagram Graph API helpers ───────────────────────────────────────────────
def ig_get(path: str, params: dict | None = None) -> dict:
    params = params or {}
    params["access_token"] = IG_TOKEN
    resp = requests.get(f"{GRAPH}/{path}", params=params, timeout=20)
    resp.raise_for_status()
    return resp.json()


def ig_paginate(first_page: dict, limit: int = 9999) -> list[dict]:
    """Follow 'next' cursors and collect all items up to `limit`."""
    items = list(first_page.get("data", []))
    paging = first_page.get("paging", {})
    while paging.get("next") and len(items) < limit:
        try:
            page = requests.get(paging["next"], timeout=20).json()
            items.extend(page.get("data", []))
            paging = page.get("paging", {})
        except Exception as exc:
            print(f"  [WARN] Pagination error: {exc}")
            break
    return items[:limit]


# ── Data helpers ──────────────────────────────────────────────────────────────
def _media_type_to_post_type(media_type: str) -> str:
    t = (media_type or "").upper()
    if t == "VIDEO":          return "reel"
    if t == "CAROUSEL_ALBUM": return "carousel"
    return "image"


def _parse_ts(raw: str | None) -> str | None:
    if not raw:
        return None
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return dt.isoformat()
    except Exception:
        return None


# ── Fetch posts ───────────────────────────────────────────────────────────────
def fetch_posts(max_posts: int) -> list[dict]:
    print(f"\nFetching up to {max_posts} posts for IG account {IG_ACCT} …")
    fields = (
        "id,caption,media_type,thumbnail_url,media_url,permalink,"
        "timestamp,like_count,comments_count"
    )
    page = ig_get(f"{IG_ACCT}/media", {"fields": fields, "limit": min(max_posts, 100)})
    posts = ig_paginate(page, limit=max_posts)
    print(f"  Got {len(posts)} posts")
    return posts


# ── Fetch post-level insights (reach, impressions, engagement) ────────────────
def fetch_insights(media_id: str) -> dict:
    """Returns dict like {'reach': 12000, 'impressions': 15000, 'engagement': 430}"""
    try:
        data = ig_get(f"{media_id}/insights", {"metric": "reach,impressions,engagement"})
        return {item["name"]: (item.get("values") or [{}])[0].get("value", 0)
                for item in data.get("data", [])}
    except Exception:
        return {}


# ── Fetch comments for a post ─────────────────────────────────────────────────
def fetch_comments(media_id: str, max_comments: int) -> list[dict]:
    try:
        page = ig_get(
            f"{media_id}/comments",
            {"fields": "id,text,username,timestamp", "limit": min(max_comments, 50)},
        )
        return ig_paginate(page, limit=max_comments)
    except Exception as exc:
        print(f"    [WARN] Comments for {media_id}: {exc}")
        return []


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape JOOLA Instagram → Supabase")
    parser.add_argument("--posts",    type=int, default=50,  help="Max posts to fetch (default 50)")
    parser.add_argument("--comments", type=int, default=100, help="Max comments per post (default 100)")
    parser.add_argument("--dry-run",  action="store_true",   help="Fetch only, do not write to Supabase")
    args = parser.parse_args()

    # Validate credentials
    missing = [k for k, v in [
        ("IG_ACCESS_TOKEN",          IG_TOKEN),
        ("IG_ACCOUNT_ID",            IG_ACCT),
        ("SUPABASE_URL",             SB_URL),
        ("SUPABASE_SERVICE_ROLE_KEY", SB_KEY),
    ] if not v]
    if missing:
        print("ERROR: Missing required env vars:", ", ".join(missing))
        print("       Add them to backend/.env or export them in your shell.")
        sys.exit(1)

    posts = fetch_posts(args.posts)

    post_rows: list[dict]    = []
    comment_rows: list[dict] = []

    for idx, p in enumerate(posts, 1):
        media_id = p["id"]
        ts       = _parse_ts(p.get("timestamp"))
        posted   = datetime.fromisoformat(ts) if ts else None

        insights      = fetch_insights(media_id)
        reach         = insights.get("reach", 0)
        impressions   = insights.get("impressions", 0)
        engagement    = insights.get("engagement", 0)
        like_count    = p.get("like_count") or 0
        comment_count = p.get("comments_count") or 0
        er            = round(engagement / reach, 6) if reach > 0 else 0.0

        post_rows.append({
            "post_id":         media_id,
            "post_type":       _media_type_to_post_type(p.get("media_type", "")),
            "caption":         (p.get("caption") or "")[:2000] or None,
            "thumbnail_url":   p.get("thumbnail_url") or p.get("media_url"),
            "post_url":        p.get("permalink"),
            "like_count":      like_count,
            "comment_count":   comment_count,
            "view_count":      impressions,
            "engagement_rate": er,
            "posted_at":       ts,
            "day_of_week":     posted.strftime("%A")  if posted else None,
            "hour_of_day":     posted.hour             if posted else None,
        })

        comments = fetch_comments(media_id, args.comments)
        for c in comments:
            comment_rows.append({
                "comment_id":   c["id"],
                "post_id":      media_id,
                "username":     c.get("username", ""),
                "comment_text": (c.get("text") or "")[:2000],
                "commented_at": _parse_ts(c.get("timestamp")),
            })

        date_str = posted.strftime("%b %d, %Y") if posted else "unknown date"
        print(f"  [{idx:>3}/{len(posts)}] {media_id}  ER {er*100:.2f}%  "
              f"{comment_count} comments  posted {date_str}")
        time.sleep(0.25)  # be polite to the API

    print(f"\nSummary: {len(post_rows)} posts · {len(comment_rows)} comments")

    if args.dry_run:
        print("\n[DRY RUN] First post row preview:")
        print(json.dumps(post_rows[0] if post_rows else {}, indent=2, default=str))
        return

    print("\nWriting to Supabase …")
    sb_upsert("joola_ig_posts",    post_rows,    dry_run=False)
    sb_upsert("joola_ig_comments", comment_rows, dry_run=False)

    print("\nDone! Refresh the dashboard to see updated data.")
    print("Tip: run the AI analysis pipeline next to regenerate comment_analysis and post_analysis.")


if __name__ == "__main__":
    main()
