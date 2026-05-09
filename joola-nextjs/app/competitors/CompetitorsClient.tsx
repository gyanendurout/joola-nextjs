'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import DataTable from '@/components/DataTable'
import BarChartWidget from '@/components/BarChartWidget'
import SentimentBadge from '@/components/SentimentBadge'
import type { IgCompetitorMention } from '@/lib/types'
import { ExternalLink } from 'lucide-react'

type MentionWithUrl = IgCompetitorMention & { post_url?: string }

const columns = [
  {
    key: 'username',
    header: 'User',
    sortable: true,
    render: (row: Record<string, unknown>) => (
      <span className="font-medium text-white whitespace-nowrap">@{String(row.username || '')}</span>
    ),
  },
  {
    key: 'competitor_name',
    header: 'Competitor',
    sortable: true,
    render: (row: Record<string, unknown>) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-red-500/10 text-red-400 border-red-500/30 whitespace-nowrap">
        {String(row.competitor_name || '')}
      </span>
    ),
  },
  {
    key: 'full_comment_text',
    header: 'Comment',
    render: (row: Record<string, unknown>) => (
      <span className="text-[#94a3b8] text-xs leading-relaxed">{String(row.full_comment_text || '')}</span>
    ),
  },
  {
    key: 'sentiment_toward_joola',
    header: 'Sentiment toward JOOLA',
    sortable: true,
    render: (row: Record<string, unknown>) => <SentimentBadge value={String(row.sentiment_toward_joola || '')} />,
  },
  {
    key: 'mentioned_at',
    header: 'Date',
    sortable: true,
    sortValue: (row: Record<string, unknown>) => String(row.mentioned_at || ''),
    render: (row: Record<string, unknown>) =>
      row.mentioned_at ? (
        <span className="whitespace-nowrap text-[#94a3b8] text-xs">
          {format(new Date(String(row.mentioned_at)), 'MMM d, yyyy')}
        </span>
      ) : '—',
  },
  {
    key: 'post_url',
    header: 'Post',
    render: (row: Record<string, unknown>) =>
      row.post_url ? (
        <a
          href={String(row.post_url)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00d4ff] hover:text-white transition-colors"
          title="View post on Instagram"
        >
          <ExternalLink size={14} />
        </a>
      ) : (
        <span className="text-[#334155]">—</span>
      ),
  },
]

interface CompetitorsClientProps {
  allMentions: MentionWithUrl[]
  competitorData: { name: string; count: number }[]
  competitorSentimentData: { name: string; Positive: number; Neutral: number; Negative: number }[]
}

export default function CompetitorsClient({ allMentions, competitorData, competitorSentimentData }: CompetitorsClientProps) {
  const [selectedCompetitor, setSelectedCompetitor] = useState('')

  const filtered = useMemo(() => {
    if (!selectedCompetitor) return allMentions
    return allMentions.filter(
      (m) => (m.competitor_name || '').toLowerCase() === selectedCompetitor.toLowerCase()
    )
  }, [allMentions, selectedCompetitor])

  const competitorNames = competitorData.map((d) => d.name).sort()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Competitors</h1>
        <p className="text-sm text-[#94a3b8] mt-1">{allMentions.length} competitor mentions detected in comments</p>
      </div>

      <BarChartWidget
        title="Competitor Mentions"
        data={competitorData}
        xKey="name"
        bars={[{ key: 'count', color: '#ef4444', name: 'Mentions' }]}
        height={280}
        horizontal={competitorData.length > 5}
      />

      <div>
        <BarChartWidget
          title="Sentiment Toward JOOLA in Comments Mentioning Each Competitor"
          data={competitorSentimentData}
          xKey="name"
          bars={[
            { key: 'Positive', color: '#10b981' },
            { key: 'Neutral', color: '#64748b' },
            { key: 'Negative', color: '#ef4444' },
          ]}
          height={300}
          horizontal={competitorSentimentData.length > 5}
        />
        <p className="text-[10px] text-[#64748b] mt-1 px-1">
          Reveals whether fans mentioning each competitor speak positively, neutrally, or negatively
          about JOOLA — a signal for switchers vs loyalists.
        </p>
      </div>

      <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-white">
            All Competitor Mentions ({filtered.length}{selectedCompetitor ? ` · ${selectedCompetitor}` : ''})
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748b]">Filter by competitor:</span>
            <select
              value={selectedCompetitor}
              onChange={(e) => setSelectedCompetitor(e.target.value)}
              className="px-3 py-1.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-xs text-white focus:outline-none focus:border-[#00d4ff] transition-colors"
            >
              <option value="">All competitors</option>
              {competitorNames.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {selectedCompetitor && (
              <button
                onClick={() => setSelectedCompetitor('')}
                className="text-xs text-[#64748b] hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <DataTable
          data={filtered as unknown as Record<string, unknown>[]}
          columns={columns}
          pageSize={20}
          emptyMessage="No competitor mentions found"
        />
      </div>
    </div>
  )
}
