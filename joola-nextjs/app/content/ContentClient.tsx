'use client'

import { format } from 'date-fns'
import DataTable from '@/components/DataTable'
import BarChartWidget from '@/components/BarChartWidget'
import InfoTooltip from '@/components/InfoTooltip'
import { formatNumber, formatEngagement } from '@/lib/utils'
import type { IgHashtagPerformance } from '@/lib/types'
import { ExternalLink } from 'lucide-react'

const ENGAGEMENT_TOOLTIP = `Engagement Rate = (Likes + Comments) ÷ Views × 100

It measures what percentage of people who saw a post actually interacted with it (liked or commented).

Example: 500 likes + 50 comments on a post with 10,000 views = 5.5% engagement rate.

A higher rate means the content resonated more with the audience. Instagram benchmarks:
• < 1%   — Low
• 1–3%  — Average
• 3–6%  — Good
• > 6%  — Excellent`

const THEME_DESCRIPTIONS: Record<string, string> = {
  community: 'Posts showcasing the JOOLA community — fan interactions, team moments, grassroots events, and user-generated content.',
  'product launch': 'Announcements and reveals of new JOOLA equipment, paddles, apparel, or accessories.',
  'product launch & athlete': 'Product reveals featuring sponsored athletes demonstrating or endorsing new gear.',
  tournament: 'Coverage of competitive events — match highlights, tournament brackets, results, and live event content.',
  tournaments: 'Coverage of competitive events — match highlights, tournament brackets, results, and live event content.',
  athlete: 'Spotlight content featuring JOOLA-sponsored athletes — training clips, achievements, and personal stories.',
  training: 'Coaching tips, technique tutorials, drills, and practice-focused instructional content.',
  'brand awareness': 'General brand content — lifestyle imagery, brand values, and aspirational JOOLA identity posts.',
  event: 'Recaps and previews of JOOLA-hosted or sponsored events, expos, and activations.',
  lifestyle: 'Posts that connect the JOOLA brand to everyday life, culture, and the pickleball lifestyle.',
  promotional: 'Sales, discounts, limited offers, and marketing-driven posts designed to drive purchases.',
  educational: 'Informational content about pickleball rules, history, technique improvements, and player development.',
}

type TopPost = {
  post_id: string
  post_type: string
  like_count: number
  comment_count: number
  engagement_rate: number
  posted_at: string
  thumbnail_url: string
  post_url: string
}

type ThemeRow = {
  name: string
  avg_engagement: number
  count: number
  best_post_url?: string
}

const hashtagColumns = [
  {
    key: 'hashtag',
    header: 'Hashtag',
    sortable: true,
    render: (row: Record<string, unknown>) => (
      <span className="text-[#00d4ff] font-mono text-sm">{String(row.hashtag || '')}</span>
    ),
  },
  {
    key: 'times_used',
    header: 'Uses',
    sortable: true,
    sortValue: (row: Record<string, unknown>) => Number(row.times_used || 0),
    render: (row: Record<string, unknown>) => formatNumber(Number(row.times_used || 0)),
  },
  {
    key: 'avg_like_count',
    header: 'Avg Likes',
    sortable: true,
    sortValue: (row: Record<string, unknown>) => Number(row.avg_like_count || 0),
    render: (row: Record<string, unknown>) => (
      <span className="text-[#00d4ff]">{formatNumber(Number(row.avg_like_count || 0))}</span>
    ),
  },
  {
    key: 'avg_comment_count',
    header: 'Avg Comments',
    sortable: true,
    sortValue: (row: Record<string, unknown>) => Number(row.avg_comment_count || 0),
    render: (row: Record<string, unknown>) => formatNumber(Number(row.avg_comment_count || 0)),
  },
  {
    key: 'avg_engagement_rate',
    header: 'Avg Engagement',
    headerNode: <span className="inline-flex items-center gap-1">Avg Engagement<InfoTooltip text={ENGAGEMENT_TOOLTIP} wide /></span>,
    sortable: true,
    sortValue: (row: Record<string, unknown>) => Number(row.avg_engagement_rate || 0),
    render: (row: Record<string, unknown>) => (
      <span className="font-semibold text-white">{formatEngagement(Number(row.avg_engagement_rate || 0))}</span>
    ),
  },
  {
    key: 'best_post_id',
    header: 'Best Post',
    render: (row: Record<string, unknown>) =>
      row.best_post_url ? (
        <a
          href={String(row.best_post_url)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00d4ff] hover:text-white transition-colors"
          title="View best post on Instagram"
        >
          <ExternalLink size={14} />
        </a>
      ) : (
        <span className="text-[#334155]">—</span>
      ),
  },
]

const themeColumns = [
  {
    key: 'name',
    header: 'Theme',
    sortable: true,
    render: (row: Record<string, unknown>) => (
      <span className="text-white text-xs capitalize">{String(row.name || '')}</span>
    ),
  },
  {
    key: 'count',
    header: 'Posts',
    sortable: true,
    sortValue: (row: Record<string, unknown>) => Number(row.count || 0),
    render: (row: Record<string, unknown>) => (
      <span className="text-[#94a3b8]">{formatNumber(Number(row.count || 0))}</span>
    ),
  },
  {
    key: 'avg_engagement',
    header: 'Avg Engagement',
    headerNode: <span className="inline-flex items-center gap-1">Avg Engagement<InfoTooltip text={ENGAGEMENT_TOOLTIP} wide /></span>,
    sortable: true,
    sortValue: (row: Record<string, unknown>) => Number(row.avg_engagement || 0),
    render: (row: Record<string, unknown>) => (
      <span className="font-semibold text-[#a855f7]">{formatEngagement(Number(row.avg_engagement || 0))}</span>
    ),
  },
  {
    key: 'best_post_url',
    header: 'Best Post',
    render: (row: Record<string, unknown>) =>
      row.best_post_url ? (
        <a
          href={String(row.best_post_url)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00d4ff] hover:text-white transition-colors"
          title="View best post on Instagram"
        >
          <ExternalLink size={14} />
        </a>
      ) : (
        <span className="text-[#334155]">—</span>
      ),
  },
]

const top10Columns = [
  {
    key: 'thumbnail_url',
    header: 'Post',
    render: (row: Record<string, unknown>) => (
      <a href={String(row.post_url || '#')} target="_blank" rel="noopener noreferrer">
        {row.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={String(row.thumbnail_url)}
            alt="Post"
            className="w-10 h-10 object-cover rounded-lg border border-[#1e1e2e]"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="w-10 h-10 bg-[#1e1e2e] rounded-lg" />
        )}
      </a>
    ),
  },
  {
    key: 'post_type',
    header: 'Type',
    sortable: true,
    render: (row: Record<string, unknown>) => {
      const t = (String(row.post_type || '')).toLowerCase()
      const colorMap: Record<string, string> = {
        reel: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        photo: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        carousel: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      }
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${colorMap[t] || 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>
          {String(row.post_type || '')}
        </span>
      )
    },
  },
  {
    key: 'engagement_rate',
    header: 'Engagement',
    headerNode: <span className="inline-flex items-center gap-1">Engagement<InfoTooltip text={ENGAGEMENT_TOOLTIP} wide /></span>,
    sortable: true,
    sortValue: (row: Record<string, unknown>) => Number(row.engagement_rate || 0),
    render: (row: Record<string, unknown>) => (
      <span className="font-bold text-[#00d4ff]">{formatEngagement(Number(row.engagement_rate || 0))}</span>
    ),
  },
  {
    key: 'like_count',
    header: 'Likes',
    sortable: true,
    sortValue: (row: Record<string, unknown>) => Number(row.like_count || 0),
    render: (row: Record<string, unknown>) => formatNumber(Number(row.like_count || 0)),
  },
  {
    key: 'posted_at',
    header: 'Posted',
    sortable: true,
    sortValue: (row: Record<string, unknown>) => row.posted_at ? new Date(String(row.posted_at)).getTime() : 0,
    render: (row: Record<string, unknown>) =>
      row.posted_at ? (
        <span className="whitespace-nowrap text-[#94a3b8] text-xs">
          {format(new Date(String(row.posted_at)), 'MMM d, yyyy')}
        </span>
      ) : '—',
  },
  {
    key: 'post_url',
    header: 'Link',
    render: (row: Record<string, unknown>) => (
      <a href={String(row.post_url || '#')} target="_blank" rel="noopener noreferrer" className="text-[#00d4ff] hover:text-white transition-colors">
        <ExternalLink size={14} />
      </a>
    ),
  },
]

interface ContentClientProps {
  hashtags: (IgHashtagPerformance & { best_post_url?: string })[]
  top10Posts: TopPost[]
  postTypeData: { name: string; avg_likes: number; avg_comments: number }[]
  themeData: ThemeRow[]
}

export default function ContentClient({ hashtags, top10Posts, postTypeData, themeData }: ContentClientProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Content Analysis</h1>
        <p className="text-sm text-[#94a3b8] mt-1">Post performance, hashtags, and content strategy insights</p>
      </div>

      <BarChartWidget
        title="Post Type Performance — Avg Likes &amp; Comments"
        data={postTypeData}
        xKey="name"
        bars={[
          { key: 'avg_likes', color: '#00d4ff', name: 'Avg Likes' },
          { key: 'avg_comments', color: '#1a5cff', name: 'Avg Comments' },
        ]}
        height={260}
      />

      <div>
        <div className="flex items-center gap-1 mb-2">
          <span className="text-sm font-semibold text-[#94a3b8]">Content Theme — Avg Engagement Rate</span>
          <InfoTooltip text={ENGAGEMENT_TOOLTIP} wide />
        </div>
        <BarChartWidget
          title=""
          data={themeData}
          xKey="name"
          bars={[{ key: 'avg_engagement', color: '#a855f7', name: 'Avg Engagement' }]}
          height={340}
          horizontal={true}
        />
      </div>

      {/* Theme glossary */}
      <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Content Theme Glossary</h3>
        <p className="text-xs text-[#64748b] mb-4">Themes are AI-generated labels assigned to each post based on its caption, visual content, and context.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {themeData.map((t) => {
            const desc = THEME_DESCRIPTIONS[t.name.toLowerCase()]
            return (
              <div key={t.name} className="flex gap-2">
                <span className="mt-0.5 w-2 h-2 rounded-full bg-[#a855f7] flex-shrink-0" />
                <div>
                  <span className="text-xs font-medium text-white capitalize">{t.name}</span>
                  {desc && <p className="text-xs text-[#64748b] mt-0.5 leading-relaxed">{desc}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Content Themes</h3>
        <DataTable
          data={themeData as unknown as Record<string, unknown>[]}
          columns={themeColumns}
          pageSize={20}
          emptyMessage="No theme data found"
        />
      </div>

      <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Top Hashtags by Engagement</h3>
        <DataTable
          data={hashtags as unknown as Record<string, unknown>[]}
          columns={hashtagColumns}
          pageSize={20}
          emptyMessage="No hashtag data found"
        />
      </div>

      <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center">
          Top 10 Posts by Engagement
          <InfoTooltip text={ENGAGEMENT_TOOLTIP} wide />
        </h3>
        <DataTable
          data={top10Posts as unknown as Record<string, unknown>[]}
          columns={top10Columns}
          pageSize={10}
          emptyMessage="No posts found"
        />
      </div>
    </div>
  )
}
