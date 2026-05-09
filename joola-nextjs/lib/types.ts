export interface IgPost {
  post_id: string
  post_url: string
  post_type: string
  caption: string
  hashtags: string[]
  like_count: number
  comment_count: number
  view_count: number
  engagement_rate: number
  posted_at: string
  thumbnail_url: string
  day_of_week: string
  hour_of_day: number
}

export interface IgPostAnalysis {
  post_id: string
  content_theme: string
  shot_type: string
  setting: string
  post_intent: string
  sentiment_tone: string
  visual_quality_score: number
  predicted_performance: string
  caption_summary: string
  athletes_shown: string[]
  products_shown: string[]
}

export interface IgComment {
  comment_id: string
  post_id: string
  username: string
  comment_text: string
  commented_at: string
  is_reply: boolean
  is_joola_reply: boolean
  likes_on_comment: number
}

export interface IgCommentAnalysis {
  comment_id: string
  post_id: string
  username: string
  sentiment: string
  sentiment_score: number
  emotion: string
  primary_topic: string
  is_question: boolean
  is_complaint: boolean
  is_wishlist: boolean
  mentions_competitor: boolean
  competitor_mentioned: string
  purchase_intent: boolean
  product_mentioned: string
  athlete_mentioned: string
}

export interface IgLoyalUser {
  username: string
  total_comments: number
  total_posts_commented_on: number
  avg_sentiment_score: number
  dominant_emotion: string
  loyalty_tier: string
  ambassador_score: number
  is_potential_ambassador: boolean
  praise_count: number
  complaint_count: number
  first_seen_at: string
  last_seen_at: string
  active_months: number
}

export interface IgUserPostActivity {
  username: string
  post_id: string
  comment_count_on_post: number
  avg_sentiment_on_post: number
}

export interface IgHashtagPerformance {
  hashtag: string
  times_used: number
  avg_like_count: number
  avg_comment_count: number
  avg_engagement_rate: number
  best_post_id: string
}

export interface IgProductMention {
  post_id: string
  product_name: string
  source: string
  sentiment: string
  mention_context: string
}

export interface IgAthleteMention {
  post_id: string
  athlete_name: string
  source: string
  sentiment: string
}

export interface IgCompetitorMention {
  comment_id: string
  post_id: string
  username: string
  competitor_name: string
  full_comment_text: string
  sentiment_toward_joola: string
  mentioned_at: string
}

export interface IgComplaintLog {
  comment_id: string
  post_id: string
  username: string
  complaint_category: string
  complaint_text: string
  severity: string
  joola_responded: boolean
  complained_at: string
}

export interface IgWishlistItem {
  comment_id: string
  post_id: string
  username: string
  wishlist_text: string
  category: string
  requested_at: string
}

export interface IgJoolaReply {
  post_id: string
  reply_text: string
  original_username: string
  replied_at: string
  response_time_mins: number
}

export interface IgWeeklySnapshot {
  week_start: string
  week_end: string
  posts_published: number
  total_likes: number
  total_comments: number
  total_views: number
  avg_engagement_rate: number
  positive_comment_pct: number
  negative_comment_pct: number
  neutral_comment_pct: number
  avg_sentiment_score: number
  complaint_count: number
  purchase_intent_count: number
  competitor_mention_count: number
}
