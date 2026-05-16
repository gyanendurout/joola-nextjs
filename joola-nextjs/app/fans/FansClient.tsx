'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import KpiCard from '@/components/ui/KpiCard'
import type { IgLoyalUser } from '@/lib/types'

interface FansClientProps {
  allUsers: IgLoyalUser[]
  ambassadorList: IgLoyalUser[]
  superFans: number
  regularFans: number
}

function tierClass(tier: string): string {
  const t = (tier || '').toLowerCase()
  if (t.includes('super') || t.includes('ambassador')) return 'tier-top'
  if (t.includes('regular')) return 'tier-strong'
  return 'tier-emerging'
}

function scoreClass(score: number): string {
  if (score >= 7.5) return 'score-badge score-top'
  if (score >= 7.0) return 'score-badge score-high'
  if (score >= 6.5) return 'score-badge score-mid'
  return 'score-badge score-low'
}

type FilterType = 'all' | 'ambassador' | 'super' | 'regular' | 'buyers' | 'repeat_complainers' | 'cross_brand'

export default function FansClient({ allUsers, ambassadorList, superFans, regularFans }: FansClientProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')

  const filtered = allUsers.filter((u) => {
    const tier = (u.loyalty_tier || '').toLowerCase()
    if (filter === 'ambassador' && !u.is_potential_ambassador) return false
    if (filter === 'super' && !tier.includes('super')) return false
    if (filter === 'regular' && !tier.includes('regular')) return false
    if (filter === 'buyers' && (u.purchase_intent_count ?? 0) < 2) return false
    if (filter === 'repeat_complainers' && (u.complaint_count ?? 0) < 2) return false
    if (filter === 'cross_brand' && !u.also_comments_on_competitors) return false
    if (search && !u.username.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const buyersCount = allUsers.filter((u) => (u.purchase_intent_count ?? 0) >= 2).length
  const repeatComplainers = allUsers.filter((u) => (u.complaint_count ?? 0) >= 2).length
  const crossBrandCount = allUsers.filter((u) => !!u.also_comments_on_competitors).length

  const avgTenure = allUsers.length > 0
    ? (allUsers.reduce((s, u) => s + (u.active_months || 0), 0) / allUsers.length).toFixed(1)
    : '0'

  const avgScore = allUsers.length > 0
    ? (allUsers.reduce((s, u) => s + (u.ambassador_score || 0), 0) / allUsers.length).toFixed(1)
    : '0'

  // Tenure distribution for bar chart
  const tenureBuckets: Record<string, number> = {}
  for (const u of allUsers) {
    const m = u.active_months ?? 0
    const bucket = m <= 1 ? '≤1m' : m <= 3 ? '2–3m' : m <= 6 ? '4–6m' : m <= 12 ? '7–12m' : '12m+'
    tenureBuckets[bucket] = (tenureBuckets[bucket] || 0) + 1
  }
  const bucketOrder = ['≤1m', '2–3m', '4–6m', '7–12m', '12m+']
  const maxBucket = Math.max(...Object.values(tenureBuckets), 1)

  return (
    <div>
      <header className="page-head">
        <div>
          <div className="eyebrow">
            <span className="live-pulse-dot" />
            INSTAGRAM · FANS &amp; AMBASSADORS
          </div>
          <h1>FANS &amp; <em>AMBASSADORS</em></h1>
          <div className="sub">
            Loyal community members ranked by ambassador score. Identify your top advocates and emerging brand champions.
          </div>
        </div>
        <div className="head-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 6, padding: '4px 12px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              className="fld"
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 0, background: 'transparent', padding: '6px 4px' }}
            />
          </div>
        </div>
      </header>

      {/* KPIs */}
      <div className="section">
        <div className="kpi-grid">
          <KpiCard variant="joola" label="TOTAL FANS" src="distinct commenters"
            value={allUsers.length} delta="▲ +11.3%" dir="up" />
          <KpiCard label="POTENTIAL AMBASSADORS" src="score ≥ 7.5"
            value={ambassadorList.length} delta="▲ +8%" dir="up" />
          <KpiCard label="SUPER FANS" src="top loyalty tier"
            value={superFans} delta="—" dir="up" />
          <KpiCard label="AVG FAN TENURE" src="months active"
            value={avgTenure} delta="—" dir="up" />
        </div>
      </div>

      {/* Ambassador pipeline + tenure */}
      <div className="section">
        <div className="card-grid cg-2-1">
          {/* Pipeline table */}
          <div className="card card-pad-lg">
            <div className="card-head">
              <h3>AMBASSADOR PIPELINE</h3>
              <div className="chip-row" style={{ flexWrap: 'wrap' }}>
                <button className={'chip ' + (filter === 'all' ? 'on' : '')} onClick={() => setFilter('all')}>All ({allUsers.length})</button>
                <button className={'chip ' + (filter === 'ambassador' ? 'on' : '')} onClick={() => setFilter('ambassador')}>Ambassador ({ambassadorList.length})</button>
                <button className={'chip ' + (filter === 'super' ? 'on' : '')} onClick={() => setFilter('super')}>Super ({superFans})</button>
                <button className={'chip ' + (filter === 'regular' ? 'on' : '')} onClick={() => setFilter('regular')}>Regular ({regularFans})</button>
                <button className={'chip ' + (filter === 'buyers' ? 'on' : '')} onClick={() => setFilter('buyers')}>Hot Leads ({buyersCount})</button>
                <button className={'chip ' + (filter === 'repeat_complainers' ? 'on' : '')} onClick={() => setFilter('repeat_complainers')}>Repeat Complainers ({repeatComplainers})</button>
                <button className={'chip ' + (filter === 'cross_brand' ? 'on' : '')} onClick={() => setFilter('cross_brand')}>Cross-Brand ({crossBrandCount})</button>
              </div>
            </div>
            <div className="table-wrap scroll">
              <table className="data">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>USER</th>
                    <th>TIER</th>
                    <th>TOPIC</th>
                    <th className="num">SCORE</th>
                    <th className="num">COMMENTS</th>
                    <th className="num">SENTIMENT</th>
                    <th className="num">INTENT</th>
                    <th className="num">WISH</th>
                    <th className="num">COMP</th>
                    <th className="num">MONTHS</th>
                    <th className="num">FOLLOWERS</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map((u, i) => (
                    <tr key={u.username} className={u.is_potential_ambassador ? 'highlight' : ''}>
                      <td className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td>
                        <a href={`https://instagram.com/${u.username}`} target="_blank" rel="noopener noreferrer"
                          className="tlink" style={{ fontWeight: 600 }}>
                          @{u.username}
                        </a>
                        {u.is_potential_ambassador && <span className="you-badge">AMB</span>}
                        {u.is_verified && <span className="pill pill-info" style={{ marginLeft: 4, fontSize: 9 }}>✓</span>}
                        {u.also_comments_on_competitors && <span className="pill pill-amber" style={{ marginLeft: 4, fontSize: 9 }}>⚐ CROSS</span>}
                      </td>
                      <td>
                        <span className={'tier ' + tierClass(u.loyalty_tier ?? '')}>
                          {u.loyalty_tier || 'unknown'}
                        </span>
                      </td>
                      <td>
                        {u.dominant_topic ? (
                          <span className="pill pill-ghost" style={{ textTransform: 'capitalize', fontSize: 10 }}>
                            {u.dominant_topic}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--fg-4)', fontSize: 11 }}>—</span>
                        )}
                      </td>
                      <td className="cell-num">
                        <span className={scoreClass(u.ambassador_score ?? 0)}>
                          {(u.ambassador_score ?? 0).toFixed(1)}
                        </span>
                      </td>
                      <td className="cell-num">{(u.total_comments ?? 0).toLocaleString()}</td>
                      <td className="cell-num">
                        <span style={{ color: (u.avg_sentiment_score ?? 0) > 0 ? 'var(--joola)' : (u.avg_sentiment_score ?? 0) < 0 ? 'var(--red)' : 'var(--fg-4)', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                          {(u.avg_sentiment_score ?? 0) > 0 ? '+' : ''}{(u.avg_sentiment_score ?? 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="cell-num">
                        {(u.purchase_intent_count ?? 0) > 0 ? (
                          <span style={{ color: 'var(--joola)', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                            ● {u.purchase_intent_count}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--fg-4)' }}>—</span>
                        )}
                      </td>
                      <td className="cell-num">
                        {(u.wishlist_count ?? 0) > 0 ? (
                          <span style={{ color: 'var(--yellow)', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                            ★ {u.wishlist_count}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--fg-4)' }}>—</span>
                        )}
                      </td>
                      <td className="cell-num">
                        {(u.complaint_count ?? 0) > 0 ? (
                          <span style={{ color: 'var(--red)', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                            ⚠ {u.complaint_count}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--fg-4)' }}>—</span>
                        )}
                      </td>
                      <td className="cell-num">{u.active_months ?? 0}</td>
                      <td className="cell-num">
                        {u.follower_count != null ? (
                          <span className="mono">{u.follower_count >= 1000 ? (u.follower_count / 1000).toFixed(1) + 'k' : u.follower_count}</span>
                        ) : (
                          <span className="pill pill-ghost" style={{ fontSize: 9 }}>pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="empty">No users match your filters.</div>}
              {filtered.length > 100 && (
                <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 11, color: 'var(--fg-4)' }}>
                  Showing 100 of {filtered.length} fans
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: tenure + scoring guide */}
          <div>
            <div className="card card-pad-lg" style={{ marginBottom: 14 }}>
              <div className="card-head">
                <h3>FAN TENURE</h3>
                <span className="meta">months active</span>
              </div>
              {bucketOrder.map((b) => {
                const n = tenureBuckets[b] ?? 0
                const pct = (n / maxBucket) * 100
                return (
                  <div className="bar-row" key={b}>
                    <div className="lbl">{b}</div>
                    <div className="track"><div className="fill" style={{ width: pct + '%' }} /></div>
                    <div className="spark-mini">{n.toLocaleString()}</div>
                    <div className={'delta-mini ' + (pct > 40 ? 'up' : 'flat')}>{Math.round(pct)}%</div>
                  </div>
                )
              })}
            </div>
            <div className="card card-pad-lg">
              <div className="card-head">
                <h3>AMBASSADOR SCORING</h3>
                <span className="meta">0–10 scale</span>
              </div>
              {[
                { label: 'Comment frequency', note: 'How often they comment' },
                { label: 'Post diversity', note: 'Across how many posts' },
                { label: 'Sentiment score', note: 'Average comment positivity' },
                { label: 'Active months', note: 'Consistent engagement over time' },
              ].map((f, i) => (
                <div key={i} style={{ padding: '9px 0', borderBottom: '1px solid var(--line-2)', fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, color: 'var(--fg)' }}>{f.label}</span>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--yellow)' }}>25%</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 2 }}>{f.note}</div>
                </div>
              ))}
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--fg-3)' }}>
                Avg score across all fans: <span className="mono" style={{ color: 'var(--yellow)', fontWeight: 700 }}>{avgScore}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
