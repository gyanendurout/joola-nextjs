'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import DataTable from '@/components/DataTable'
import SentimentBadge from '@/components/SentimentBadge'
import DonutChartWidget from '@/components/DonutChartWidget'
import InfoTooltip from '@/components/InfoTooltip'
import { formatNumber } from '@/lib/utils'
import type { IgComment, IgCommentAnalysis } from '@/lib/types'
import { ExternalLink, ShoppingCart } from 'lucide-react'

type EnrichedComment = IgComment &
  Partial<Pick<IgCommentAnalysis, 'sentiment' | 'sentiment_score' | 'primary_topic' | 'emotion' | 'is_question' | 'is_complaint' | 'purchase_intent'>> & {
    post_url?: string
  }

const SENTIMENT_TOOLTIP = `Sentiment is determined by AI analysis of the comment text.
Each comment receives a score from –1.0 (most negative) to +1.0 (most positive).

Classification:
• Positive  → score > 0.2  (praise, enthusiasm, support)
• Neutral   → –0.2 to 0.2  (questions, informational)
• Negative  → score < –0.2 (complaints, criticism)

The model evaluates word choice, context, and tone to assign the score.`

function buildColumns(postLinkEnabled: boolean) {
  return [
    {
      key: 'username',
      header: 'User',
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span className="font-medium text-white whitespace-nowrap">@{String(row.username || '')}</span>
      ),
    },
    {
      key: 'comment_text',
      header: 'Comment',
      render: (row: Record<string, unknown>) => (
        <span className="text-[#94a3b8] text-xs leading-relaxed">{String(row.comment_text || '')}</span>
      ),
    },
    {
      key: 'sentiment',
      header: 'Sentiment',
      sortable: true,
      render: (row: Record<string, unknown>) => <SentimentBadge value={String(row.sentiment || '')} />,
    },
    {
      key: 'sentiment_score',
      header: 'Score',
      sortable: true,
      sortValue: (row: Record<string, unknown>) => Number(row.sentiment_score ?? 0),
      render: (row: Record<string, unknown>) => {
        const s = Number(row.sentiment_score ?? null)
        if (isNaN(s) || row.sentiment_score == null) return <span className="text-[#475569]">—</span>
        const color = s > 0.2 ? 'text-emerald-400' : s < -0.2 ? 'text-red-400' : 'text-[#94a3b8]'
        return <span className={`font-mono text-xs font-medium ${color}`}>{s.toFixed(2)}</span>
      },
    },
    {
      key: 'primary_topic',
      header: 'Topic',
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span className="text-xs text-[#94a3b8] bg-[#1e1e2e] px-2 py-0.5 rounded-md capitalize whitespace-nowrap">
          {String(row.primary_topic || '—')}
        </span>
      ),
    },
    {
      key: 'emotion',
      header: 'Emotion',
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span className="text-xs text-[#94a3b8] capitalize whitespace-nowrap">{String(row.emotion || '—')}</span>
      ),
    },
    {
      key: 'likes_on_comment',
      header: 'Likes',
      sortable: true,
      sortValue: (row: Record<string, unknown>) => Math.max(0, Number(row.likes_on_comment || 0)),
      render: (row: Record<string, unknown>) => {
        const v = Math.max(0, Number(row.likes_on_comment || 0))
        return <span className="text-[#94a3b8]">{formatNumber(v)}</span>
      },
    },
    {
      key: 'commented_at',
      header: 'Date',
      sortable: true,
      sortValue: (row: Record<string, unknown>) => String(row.commented_at || ''),
      render: (row: Record<string, unknown>) =>
        row.commented_at ? (
          <span className="whitespace-nowrap text-[#94a3b8] text-xs">
            {format(new Date(String(row.commented_at)), 'MMM d, yyyy')}
          </span>
        ) : '—',
    },
    ...(postLinkEnabled
      ? [{
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
            ) : <span className="text-[#334155]">—</span>,
        }]
      : []),
  ]
}

interface CommentsClientProps {
  comments: EnrichedComment[]
  sentimentData: { name: string; value: number }[]
  topicData: { name: string; value: number }[]
  totalComments: number
  uniqueUsers: number
  questionsCount: number
  purchaseIntentCount: number
}

export default function CommentsClient({
  comments,
  sentimentData,
  topicData,
  totalComments,
  uniqueUsers,
  questionsCount,
  purchaseIntentCount,
}: CommentsClientProps) {
  const [sentimentFilter, setSentimentFilter] = useState('')

  const filtered = useMemo(() => {
    if (!sentimentFilter) return comments
    return comments.filter((c) =>
      (c.sentiment || '').toLowerCase() === sentimentFilter.toLowerCase()
    )
  }, [comments, sentimentFilter])

  const purchaseIntentComments = useMemo(
    () => comments.filter((c) => c.purchase_intent === true),
    [comments]
  )

  const hasPostLinks = comments.some((c) => c.post_url)
  const columns = buildColumns(hasPostLinks)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Comments</h1>
        <p className="text-sm text-[#94a3b8] mt-1">
          {formatNumber(totalComments)} comments · {formatNumber(uniqueUsers)} unique users
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Comments', value: formatNumber(totalComments) },
          { label: 'Unique Users', value: formatNumber(uniqueUsers) },
          { label: 'Questions', value: formatNumber(questionsCount) },
          { label: 'Purchase Intent', value: formatNumber(purchaseIntentCount) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-4">
            <p className="text-xs text-[#64748b] mb-1">{label}</p>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DonutChartWidget
          title="Sentiment Distribution"
          data={sentimentData}
          colorMap={{
            positive: '#10b981',
            negative: '#ef4444',
            neutral: '#64748b',
            unknown: '#f59e0b',
          }}
        />
        <DonutChartWidget
          title="Top Topics"
          data={topicData}
          colors={['#00d4ff', '#1a5cff', '#a855f7', '#f97316', '#10b981', '#f59e0b']}
        />
      </div>

      {/* Sentiment explanation banner */}
      <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-xl p-4 text-xs text-[#64748b] leading-relaxed space-y-1">
        <p className="text-[#94a3b8] font-semibold mb-2 flex items-center gap-1">
          How sentiment is calculated
          <InfoTooltip text={SENTIMENT_TOOLTIP} wide />
        </p>
        <p>Each comment is scored by an AI model on a scale of <span className="text-white">–1.0 (negative)</span> to <span className="text-white">+1.0 (positive)</span>.</p>
        <div className="flex flex-wrap gap-4 mt-2">
          <span><span className="text-emerald-400 font-medium">Positive</span> — score &gt; 0.2 · praise, enthusiasm, support</span>
          <span><span className="text-[#94a3b8] font-medium">Neutral</span> — –0.2 to 0.2 · questions, general discussion</span>
          <span><span className="text-red-400 font-medium">Negative</span> — score &lt; –0.2 · complaints, criticism</span>
        </div>
      </div>

      {/* Purchase Intent */}
      {purchaseIntentComments.length > 0 && (
        <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <ShoppingCart size={14} className="text-[#00d4ff]" />
            Purchase Intent Signals ({purchaseIntentComments.length})
          </h3>
          <p className="text-[10px] text-[#64748b] mb-4">
            Comments where the AI detected intent to buy or strong product interest.
          </p>
          <div className="space-y-2">
            {purchaseIntentComments.map((c) => (
              <div
                key={c.comment_id}
                className="flex items-start gap-3 p-3 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-medium text-[#00d4ff]">@{c.username}</span>
                    {c.primary_topic && (
                      <span className="text-[10px] text-[#94a3b8] bg-[#1e1e2e] px-1.5 py-0.5 rounded capitalize">
                        {c.primary_topic}
                      </span>
                    )}
                    {c.commented_at && (
                      <span className="text-[10px] text-[#475569]">
                        {format(new Date(c.commented_at), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">{c.comment_text}</p>
                </div>
                {c.post_url && (
                  <a
                    href={c.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00d4ff] hover:text-white transition-colors flex-shrink-0 mt-0.5"
                    title="View post"
                  >
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table with sentiment filter */}
      <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-white">
            All Comments ({formatNumber(filtered.length)}{sentimentFilter ? ` · ${sentimentFilter}` : ''})
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748b]">Filter by sentiment:</span>
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-xs text-white focus:outline-none focus:border-[#00d4ff] transition-colors"
            >
              <option value="">All</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>
        </div>
        <DataTable
          data={filtered as unknown as Record<string, unknown>[]}
          columns={columns}
          pageSize={25}
          emptyMessage="No comments found"
        />
      </div>
    </div>
  )
}
