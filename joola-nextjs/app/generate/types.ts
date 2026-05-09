export type FormInputs = {
  topic: string
  theme: string
  format: string
  athlete: string
  product: string
  tone: string
  captionLength: string
  useHistoricalData: boolean
  useTopHashtags: boolean
  usePostingTime: boolean
  useCaptionStructure: boolean
  referenceImage?: string // base64 data URL of uploaded product photo
}

export type HashtagWithStats = {
  hashtag: string
  avg_engagement_rate: number
  avg_like_count: number
  times_used: number
}

export type ReferencePost = {
  post_id: string
  post_url: string
  post_type: string
  caption: string
  like_count: number
  comment_count: number
  view_count: number
  engagement_rate: number
  posted_at: string
  thumbnail_url: string
  day_of_week: string
  hour_of_day: number
  hashtags: string[]
  caption_length: number
  shot_type?: string
  setting?: string
}

export type SuccessPattern = {
  avgCaptionLength: number
  dominantHashtagCount: number
  dominantPostType: string
  dominantDay: string
  dominantShotType: string
  dominantEmotion: string
}

export type PostingIntelligence = {
  bestDay: string
  bestTime: string
  recommendedFormat: string
  predictedEngagementMin: number
  predictedEngagementMax: number
}

export type GeneratePostResponse = {
  image: { url: string; size: string }
  caption: string
  hashtags: string[]
  hashtagsWithStats: HashtagWithStats[]
  postingIntelligence: PostingIntelligence
  whyThisWorks: string
  referencePostIds: string[]
  referencePosts: ReferencePost[]
  successPattern: SuccessPattern
}

export type Draft = {
  id: string
  topic: string
  theme: string
  format: string
  tone: string
  caption: string
  hashtags: string[]
  image_url: string | null
  best_day: string | null
  best_time: string | null
  predicted_eng_min: number | null
  predicted_eng_max: number | null
  why_this_works: string | null
  status: 'draft' | 'approved' | 'posted'
  created_at: string
  posted_at: string | null
}
