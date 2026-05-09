'use client'

import { format } from 'date-fns'
import KPICard from '@/components/KPICard'
import DataTable from '@/components/DataTable'
import { formatNumber } from '@/lib/utils'
import type { IgLoyalUser } from '@/lib/types'
import { Star, Users, Trophy } from 'lucide-react'

function AmbassadorScoreBadge({ score }: { score: number }) {
  let style = 'bg-slate-500/15 text-slate-400 border-slate-500/30'
  if (score >= 7.5) style = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  else if (score >= 7.0) style = 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
  else if (score >= 6.5) style = 'bg-orange-500/15 text-orange-400 border-orange-500/30'

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${style}`}>
      {score?.toFixed(1) ?? '—'}
    </span>
  )
}

function LoyaltyTierBadge({ tier }: { tier: string }) {
  const lower = (tier || '').toLowerCase()
  let style = 'bg-slate-500/15 text-slate-400 border-slate-500/30'
  if (lower.includes('super') || lower.includes('ambassador')) style = 'bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30'
  else if (lower.includes('regular')) style = 'bg-blue-500/15 text-blue-400 border-blue-500/30'

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${style}`}>
      {tier || 'unknown'}
    </span>
  )
}

const ambassadorColumns = [
  {
    key: 'rank',
    header: '#',
    render: (_: Record<string, unknown>, i?: number) => (
      <span className="text-[#64748b] text-xs">{(i ?? 0) + 1}</span>
    ),
  },
  {
    key: 'username',
    header: 'Username',
    sortable: true,
    render: (row: Record<string, unknown>) => (
      <a
        href={`https://instagram.com/${row.username}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#00d4ff] hover:text-white font-medium transition-colors whitespace-nowrap"
      >
        @{String(row.username || '')}
      </a>
    ),
  },
  {
    key: 'total_posts_commented_on',
    header: 'Posts Commented',
    sortable: true,
    sortValue: (row: Record<string, unknown>) => Number(row.total_posts_commented_on || 0),
    render: (row: Record<string, unknown>) => (
      <span className="font-medium text-white">{formatNumber(Number(row.total_posts_commented_on || 0))}</span>
    ),
  },
  {
    key: 'praise_count',
    header: 'Praises',
    sortable: true,
    sortValue: (row: Record<string, unknown>) => Number(row.praise_count || 0),
    render: (row: Record<string, unknown>) => (
      <span className="text-emerald-400">{formatNumber(Number(row.praise_count || 0))}</span>
    ),
  },
  {
    key: 'dominant_emotion',
    header: 'Dominant Emotion',
    sortable: true,
    render: (row: Record<string, unknown>) => (
      <span className="text-[#94a3b8] text-xs capitalize">{String(row.dominant_emotion || '—')}</span>
    ),
  },
  {
    key: 'ambassador_score',
    header: 'Ambassador Score',
    sortable: true,
    sortValue: (row: Record<string, unknown>) => Number(row.ambassador_score || 0),
    render: (row: Record<string, unknown>) => (
      <AmbassadorScoreBadge score={Number(row.ambassador_score || 0)} />
    ),
  },
]

const allFansColumns = [
  {
    key: 'username',
    header: 'Username',
    sortable: true,
    render: (row: Record<string, unknown>) => (
      <span className="font-medium text-white whitespace-nowrap">@{String(row.username || '')}</span>
    ),
  },
  {
    key: 'loyalty_tier',
    header: 'Tier',
    sortable: true,
    render: (row: Record<string, unknown>) => <LoyaltyTierBadge tier={String(row.loyalty_tier || '')} />,
  },
  {
    key: 'total_posts_commented_on',
    header: 'Posts',
    sortable: true,
    sortValue: (row: Record<string, unknown>) => Number(row.total_posts_commented_on || 0),
    render: (row: Record<string, unknown>) => formatNumber(Number(row.total_posts_commented_on || 0)),
  },
  {
    key: 'avg_sentiment_score',
    header: 'Avg Sentiment',
    sortable: true,
    sortValue: (row: Record<string, unknown>) => Number(row.avg_sentiment_score || 0),
    render: (row: Record<string, unknown>) => {
      const score = Number(row.avg_sentiment_score || 0)
      const color = score > 0.2 ? 'text-emerald-400' : score < -0.2 ? 'text-red-400' : 'text-[#94a3b8]'
      return <span className={`font-medium ${color}`}>{score.toFixed(2)}</span>
    },
  },
  {
    key: 'active_months',
    header: 'Active Months',
    sortable: true,
    sortValue: (row: Record<string, unknown>) => Number(row.active_months || 0),
    render: (row: Record<string, unknown>) => (
      <span className="text-[#94a3b8]">{String(row.active_months || 0)}</span>
    ),
  },
  {
    key: 'first_seen_at',
    header: 'First Seen',
    sortable: true,
    sortValue: (row: Record<string, unknown>) => String(row.first_seen_at || ''),
    render: (row: Record<string, unknown>) =>
      row.first_seen_at ? (
        <span className="whitespace-nowrap text-[#94a3b8] text-xs">
          {format(new Date(String(row.first_seen_at)), 'MMM d, yyyy')}
        </span>
      ) : '—',
  },
]

interface FansClientProps {
  allUsers: IgLoyalUser[]
  ambassadorList: IgLoyalUser[]
  superFans: number
  regularFans: number
}

export default function FansClient({ allUsers, ambassadorList, superFans, regularFans }: FansClientProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Fans</h1>
        <p className="text-sm text-[#94a3b8] mt-1">Loyal users, fan tiers, and potential ambassadors</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Super Fans"
          value={formatNumber(superFans)}
          subtitle="Highest engagement tier"
          icon={<Star size={16} />}
          accent
        />
        <KPICard
          title="Regular Fans"
          value={formatNumber(regularFans)}
          subtitle="Consistent commenters"
          icon={<Users size={16} />}
        />
        <KPICard
          title="Potential Ambassadors"
          value={formatNumber(ambassadorList.length)}
          subtitle="High ambassador score"
          icon={<Trophy size={16} />}
          accent
        />
      </div>

      {/* Ambassador explanation */}
      <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-xl p-5 text-xs text-[#64748b] leading-relaxed space-y-3">
        <p className="text-[#94a3b8] font-semibold text-sm">How ambassador scores work</p>
        <p>
          Each user who comments on JOOLA posts is scored by an AI model across several dimensions — frequency of engagement,
          consistency over time, positivity of language, and enthusiasm toward the brand. These signals are combined into
          an <span className="text-white">Ambassador Score (0–10)</span>.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {[
            { range: '≥ 7.5', label: 'Top Ambassador', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', desc: 'Highly active, consistently positive — ideal brand partner candidates.' },
            { range: '7.0 – 7.4', label: 'Strong Candidate', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', desc: 'Frequent and enthusiastic, with minor gaps in consistency.' },
            { range: '6.5 – 6.9', label: 'Emerging Fan', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', desc: 'Growing engagement — worth monitoring for ambassador potential.' },
            { range: '< 6.5', label: 'Regular Fan', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30', desc: 'Active community member but not yet at ambassador level.' },
          ].map(({ range, label, color, bg, desc }) => (
            <div key={label} className={`flex gap-3 p-3 rounded-lg border ${bg}`}>
              <div className="flex-shrink-0">
                <span className={`text-xs font-bold ${color}`}>{range}</span>
              </div>
              <div>
                <p className={`text-xs font-semibold ${color}`}>{label}</p>
                <p className="text-xs text-[#64748b] mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2">
          <span className="text-white">Loyalty tiers</span> (Super Fan, Regular Fan) reflect overall comment volume and recency.
          The <span className="text-white">Ambassador Score</span> is a separate signal focused on brand affinity and partnership suitability.
        </p>
      </div>

      <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Star size={14} className="text-[#00d4ff]" />
          Potential Ambassadors ({ambassadorList.length})
        </h3>
        <DataTable
          data={ambassadorList.map((u, i) => ({ ...u, rank: i + 1 }) as unknown as Record<string, unknown>)}
          columns={ambassadorColumns}
          pageSize={20}
          emptyMessage="No ambassadors found"
        />
      </div>

      <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">All Fans ({allUsers.length})</h3>
        <DataTable
          data={allUsers as unknown as Record<string, unknown>[]}
          columns={allFansColumns}
          pageSize={20}
          emptyMessage="No fans found"
        />
      </div>
    </div>
  )
}
