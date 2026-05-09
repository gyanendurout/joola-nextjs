'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ExternalLink, Trophy } from 'lucide-react'
import type { ReferencePost, SuccessPattern } from '@/app/generate/types'
import { formatNumber } from '@/lib/utils'

interface WinningPostsReferenceProps {
  theme: string
  overridePosts?: ReferencePost[]
  overridePattern?: SuccessPattern
}

function EngagementBadge({ rate }: { rate: number }) {
  const style =
    rate >= 4
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
      : rate >= 2
      ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25'
      : 'text-red-400 bg-red-500/10 border-red-500/25'
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${style}`}>
      {rate?.toFixed(1)}%
    </span>
  )
}

function PostTypeBadge({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    reel: 'bg-purple-500/15 text-purple-400',
    photo: 'bg-blue-500/15 text-blue-400',
    carousel: 'bg-orange-500/15 text-orange-400',
  }
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] capitalize ${colorMap[type?.toLowerCase()] || 'bg-slate-500/15 text-slate-400'}`}>
      {type}
    </span>
  )
}

export default function WinningPostsReference({
  theme,
  overridePosts,
  overridePattern,
}: WinningPostsReferenceProps) {
  const [posts, setPosts] = useState<ReferencePost[]>([])
  const [pattern, setPattern] = useState<SuccessPattern | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // After generation: use the reference posts returned by the API
    if (overridePosts !== undefined) {
      setPosts(overridePosts)
      if (overridePattern) setPattern(overridePattern)
      return
    }

    // Before generation: fetch live from theme
    if (!theme) {
      setPosts([])
      setPattern(null)
      return
    }

    setLoading(true)
    fetch(`/api/theme-posts?theme=${encodeURIComponent(theme)}`)
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.posts || [])
        setPattern(data.successPattern || null)
      })
      .catch(() => {
        setPosts([])
        setPattern(null)
      })
      .finally(() => setLoading(false))
  }, [theme, overridePosts, overridePattern])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Trophy size={14} className="text-[#00d4ff]" />
          Top Posts for This Theme
        </h3>
        <p className="text-xs text-[#64748b] mt-1 leading-relaxed">
          {theme
            ? `Best performing ${theme} posts — updated as you change theme`
            : 'Select a theme to see top performing posts'}
        </p>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[#13131a] border border-[#1e1e2e] rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* No data state */}
      {!loading && posts.length === 0 && theme && (
        <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4 text-center">
          <p className="text-xs text-[#475569] leading-relaxed">
            Not enough historical data for <span className="text-white">{theme}</span>.
            <br />Try <span className="text-[#94a3b8]">Product Launch</span> or <span className="text-[#94a3b8]">Athlete Feature</span> which have the most data.
          </p>
        </div>
      )}

      {/* Post cards */}
      {!loading && posts.length > 0 && (
        <div className="space-y-2">
          {posts.map((post, idx) => (
            <a
              key={post.post_id}
              href={post.post_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 bg-[#13131a] border border-[#1e1e2e] rounded-xl p-3 hover:border-[#334155] transition-colors group cursor-pointer"
            >
              {/* Rank */}
              <div className="w-5 flex-shrink-0 flex items-start justify-center pt-1">
                <span className="text-[10px] text-[#475569] font-bold">#{idx + 1}</span>
              </div>

              {/* Thumbnail */}
              <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-[#0d0d14] border border-[#1e1e2e]">
                {post.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.thumbnail_url}
                    alt="Post thumbnail"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#334155] text-[9px]">
                    No img
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <EngagementBadge rate={post.engagement_rate} />
                  <PostTypeBadge type={post.post_type} />
                  <ExternalLink
                    size={10}
                    className="ml-auto text-[#334155] group-hover:text-[#00d4ff] transition-colors flex-shrink-0"
                  />
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed line-clamp-2">
                  {(post.caption || '').substring(0, 90)}{(post.caption || '').length > 90 ? '...' : ''}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#475569]">
                  <span>♥ {formatNumber(post.like_count)}</span>
                  <span>💬 {formatNumber(post.comment_count)}</span>
                  {post.posted_at && (
                    <span>{format(new Date(post.posted_at), 'MMM d, yy')}</span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Success Pattern */}
      {pattern && (
        <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4">
          <h4 className="text-xs font-semibold text-[#94a3b8] mb-3 uppercase tracking-wider">
            Success Pattern
          </h4>
          <div className="space-y-2">
            {[
              { label: 'Avg Caption Length', value: pattern.avgCaptionLength > 0 ? `${pattern.avgCaptionLength} chars` : '—' },
              { label: 'Avg Hashtag Count', value: pattern.dominantHashtagCount > 0 ? `${pattern.dominantHashtagCount} tags` : '—' },
              { label: 'Best Post Type', value: pattern.dominantPostType, cap: true },
              { label: 'Best Posting Day', value: pattern.dominantDay },
              { label: 'Common Shot Type', value: pattern.dominantShotType, cap: true },
              { label: 'Dominant Emotion', value: pattern.dominantEmotion, cap: true },
            ].map(({ label, value, cap }) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <span className="text-xs text-[#475569] flex-shrink-0">{label}</span>
                <span className={`text-xs font-medium text-white truncate ${cap ? 'capitalize' : ''}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
