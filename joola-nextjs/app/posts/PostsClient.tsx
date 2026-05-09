'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ExternalLink, Search, Filter } from 'lucide-react'
import DataTable from '@/components/DataTable'
import type { Column } from '@/components/DataTable'
import InfoTooltip from '@/components/InfoTooltip'
import { formatNumber, formatEngagement } from '@/lib/utils'
import type { IgPost, IgPostAnalysis } from '@/lib/types'

const ENGAGEMENT_TOOLTIP = `Engagement Rate = (Likes + Comments) ÷ Views × 100

Measures what % of viewers interacted with the post. Higher is better.

• < 1%   — Low
• 1–3%  — Average
• 3–6%  — Good
• > 6%  — Excellent`

type EnrichedPost = IgPost & Partial<IgPostAnalysis>

interface PostsClientProps {
  posts: EnrichedPost[]
  postTypes: string[]
  contentThemes: string[]
}

const postTypeBadgeColors: Record<string, string> = {
  reel: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  photo: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  carousel: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  video: 'bg-green-500/15 text-green-400 border-green-500/30',
}

export default function PostsClient({ posts, postTypes, contentThemes }: PostsClientProps) {
  const [selectedType, setSelectedType] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSortLabel, setActiveSortLabel] = useState('engagement rate')

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (selectedType && p.post_type !== selectedType) return false
      if (selectedTheme && p.content_theme !== selectedTheme) return false
      if (searchQuery && !p.caption?.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [posts, selectedType, selectedTheme, searchQuery])

  const columns: Column[] = [
    {
      key: 'thumbnail_url',
      header: 'Thumbnail',
      render: (row: EnrichedPost) => (
        <a href={row.post_url} target="_blank" rel="noopener noreferrer">
          {row.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <div className="w-12 h-12 relative">
              <img
                src={row.thumbnail_url}
                alt="Post thumbnail"
                className="w-12 h-12 object-cover rounded-lg border border-[#1e1e2e]"
                onError={(e) => {
                  const img = e.target as HTMLImageElement
                  img.style.display = 'none'
                  const ph = img.nextElementSibling as HTMLElement | null
                  if (ph) ph.style.display = 'flex'
                }}
              />
              <div className="w-12 h-12 bg-[#1e1e2e] rounded-lg items-center justify-center text-[#475569] text-[10px] absolute inset-0 hidden">
                No img
              </div>
            </div>
          ) : (
            <div className="w-12 h-12 bg-[#1e1e2e] rounded-lg flex items-center justify-center text-[#475569] text-xs">
              N/A
            </div>
          )}
        </a>
      ),
    },
    {
      key: 'post_type',
      header: 'Type',
      sortable: true,
      render: (row: EnrichedPost) => {
        const t = (row.post_type || '').toLowerCase()
        const style = postTypeBadgeColors[t] || 'bg-slate-500/15 text-slate-400 border-slate-500/30'
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${style}`}>
            {row.post_type || 'unknown'}
          </span>
        )
      },
    },
    {
      key: 'posted_at',
      header: 'Posted',
      sortable: true,
      sortValue: (row: EnrichedPost) => row.posted_at ? new Date(row.posted_at).getTime() : 0,
      render: (row: EnrichedPost) =>
        row.posted_at ? (
          <span className="whitespace-nowrap text-[#94a3b8] text-xs">
            {format(new Date(row.posted_at), 'MMM d, yyyy')}
          </span>
        ) : '—',
    },
    {
      key: 'like_count',
      header: 'Likes',
      sortable: true,
      sortValue: (row: EnrichedPost) => Math.max(0, row.like_count ?? 0),
      render: (row: EnrichedPost) => (
        <span className="text-[#00d4ff] font-medium">{formatNumber(Math.max(0, row.like_count ?? 0))}</span>
      ),
    },
    {
      key: 'comment_count',
      header: 'Comments',
      sortable: true,
      sortValue: (row: EnrichedPost) => row.comment_count ?? 0,
      render: (row: EnrichedPost) => formatNumber(row.comment_count),
    },
    {
      key: 'engagement_rate',
      header: 'Engagement',
      headerNode: <span className="inline-flex items-center gap-1">Engagement<InfoTooltip text={ENGAGEMENT_TOOLTIP} wide /></span>,
      sortable: true,
      sortValue: (row: EnrichedPost) => row.engagement_rate ?? 0,
      render: (row: EnrichedPost) => (
        <span className="font-semibold text-white">{formatEngagement(row.engagement_rate)}</span>
      ),
    },
    {
      key: 'content_theme',
      header: 'Theme',
      sortable: true,
      render: (row: EnrichedPost) => (
        <span className="text-[#94a3b8] text-xs">{row.content_theme || '—'}</span>
      ),
    },
    {
      key: 'caption',
      header: 'Caption',
      render: (row: EnrichedPost) => (
        <span className="text-[#94a3b8] text-xs">{row.caption}</span>
      ),
    },
    {
      key: 'post_url',
      header: 'Link',
      render: (row: EnrichedPost) => (
        <a
          href={row.post_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00d4ff] hover:text-white transition-colors"
        >
          <ExternalLink size={14} />
        </a>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Posts</h1>
        <p className="text-sm text-[#94a3b8] mt-1 flex items-center gap-1">
          {posts.length} total posts — sorted by {activeSortLabel}
          <InfoTooltip text={ENGAGEMENT_TOOLTIP} wide />
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4">
        <Filter size={14} className="text-[#94a3b8]" />
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
          <input
            type="text"
            placeholder="Search captions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#00d4ff] transition-colors"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff] transition-colors"
        >
          <option value="">All Types</option>
          {postTypes.map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <select
          value={selectedTheme}
          onChange={(e) => setSelectedTheme(e.target.value)}
          className="px-3 py-2 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-sm text-white focus:outline-none focus:border-[#00d4ff] transition-colors"
        >
          <option value="">All Themes</option>
          {contentThemes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {(selectedType || selectedTheme || searchQuery) && (
          <button
            onClick={() => { setSelectedType(''); setSelectedTheme(''); setSearchQuery('') }}
            className="px-3 py-2 text-xs text-[#94a3b8] hover:text-white bg-[#1e1e2e] rounded-lg transition-colors"
          >
            Clear filters ({filtered.length} results)
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5">
        <DataTable
          data={filtered}
          columns={columns}
          pageSize={20}
          emptyMessage="No posts match your filters"
          onSortChange={(key) => {
            const col = columns.find((c) => c.key === key)
            setActiveSortLabel(col ? col.header.toLowerCase() : 'engagement rate')
          }}
        />
      </div>
    </div>
  )
}
