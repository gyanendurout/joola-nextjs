'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import KpiCard from '@/components/ui/KpiCard'
import type { IgComplaintLog, IgWishlistItem, IgLoyalUser } from '@/lib/types'

type ComplaintWithUrl = IgComplaintLog & { post_url?: string }
type WishlistWithUrl = IgWishlistItem & { post_url?: string }
type RepeatUser = Pick<IgLoyalUser, 'username' | 'complaint_count' | 'dominant_topic' | 'ambassador_score' | 'loyalty_tier' | 'last_seen_at' | 'avg_sentiment_score'>

interface TrendRow { week: string; total: number; cats: Record<string, number> }

interface ComplaintsClientProps {
  allComplaints: ComplaintWithUrl[]
  allWishlist: WishlistWithUrl[]
  categoryData: Array<{ name: string; count: number }>
  categories: string[]
  severityData: Array<{ name: string; count: number }>
  categoryTrend: TrendRow[]
  trendCategories: string[]
  repeatComplainers: RepeatUser[]
}

const SEV_PILL: Record<string, string> = {
  high: 'pill-red', medium: 'pill-amber', low: 'pill-ghost',
}
const SEV_COLOR: Record<string, string> = {
  high: 'var(--red)', medium: 'var(--warn)', low: '#94a3b8',
}
const TREND_CAT_COLORS = ['var(--red)', 'var(--warn)', 'var(--info)', 'var(--cyan)', 'var(--fg-4)']

export default function ComplaintsClient({
  allComplaints, allWishlist, categoryData, categories,
  severityData, categoryTrend, trendCategories, repeatComplainers,
}: ComplaintsClientProps) {
  const [catFilter, setCatFilter] = useState('All')
  const [responded, setResponded] = useState<'all' | 'open' | 'closed'>('all')
  const [view, setView] = useState<'queue' | 'repeat'>('queue')

  const totalComplaints = allComplaints.length
  const respondedCount = allComplaints.filter((c) => c.joola_responded).length
  const openCount = totalComplaints - respondedCount
  const responseRate = totalComplaints > 0 ? (respondedCount / totalComplaints * 100) : 0

  const filtered = useMemo(() => {
    return allComplaints.filter((c) => {
      if (catFilter !== 'All' && c.complaint_category !== catFilter) return false
      if (responded === 'open' && c.joola_responded) return false
      if (responded === 'closed' && !c.joola_responded) return false
      return true
    })
  }, [allComplaints, catFilter, responded])

  const maxCat = Math.max(...categoryData.map((d) => d.count), 1)

  return (
    <div>
      <header className="page-head">
        <div>
          <div className="eyebrow">
            <span className="live-pulse-dot" />
            INSTAGRAM · COMPLAINTS
          </div>
          <h1>COMPLAINT <em>QUEUE</em></h1>
          <div className="sub">
            AI-flagged negative comments and complaints. Monitor response rate, spot patterns, and close the loop with fans.
          </div>
        </div>
        <div className="head-actions">
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>
            {openCount} open · {respondedCount} resolved
          </span>
        </div>
      </header>

      {/* KPIs */}
      <div className="section">
        <div className="kpi-grid">
          <KpiCard variant="danger" label="ALL COMPLAINTS" src="AI-detected"
            value={totalComplaints} delta="▲ +4.2%" dir="down" />
          <KpiCard variant="warn" label="AWAITING RESPONSE" src="open queue"
            value={openCount} delta="—" dir="down" />
          <KpiCard variant="joola" label="RESPONSE RATE" src="complaints responded"
            value={+responseRate.toFixed(1)} unit="%" delta="▲ +4.2pp" dir="up" />
          <KpiCard label="REPEAT COMPLAINERS" src="≥2 flagged comments"
            value={repeatComplainers.length} delta="—" dir="down" />
        </div>
      </div>

      {/* Severity strip + category trend */}
      <div className="section">
        <div className="card-grid cg-2-1">
          <div className="card card-pad-lg">
            <div className="card-head">
              <h3>COMPLAINT CATEGORY TREND</h3>
              <span className="meta">last {categoryTrend.length} weeks · stacked by category</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 140, padding: '8px 0' }}>
              {categoryTrend.length === 0 && <div className="empty">No weekly data yet.</div>}
              {categoryTrend.map((w) => {
                const max = Math.max(1, ...categoryTrend.map((r) => r.total))
                const colTotal = w.total
                const heightPct = (colTotal / max) * 100
                return (
                  <div key={w.week} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      height: heightPct + '%',
                      minHeight: colTotal > 0 ? 2 : 0,
                      width: '100%',
                      maxWidth: 28,
                      display: 'flex',
                      flexDirection: 'column-reverse',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                      title={`${w.week} · ${colTotal} complaints`}
                    >
                      {trendCategories.map((cat, i) => {
                        const n = w.cats[cat] || 0
                        if (n === 0) return null
                        const pct = (n / colTotal) * 100
                        return (
                          <div key={cat}
                            style={{ height: pct + '%', background: TREND_CAT_COLORS[i % TREND_CAT_COLORS.length] }}
                            title={`${cat}: ${n}`}
                          />
                        )
                      })}
                    </div>
                    <span className="mono" style={{ fontSize: 9, color: 'var(--fg-4)' }}>
                      {format(new Date(w.week), 'MMM d')}
                    </span>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', fontWeight: 700 }}>{colTotal}</span>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
              {trendCategories.map((cat, i) => (
                <span key={cat} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--fg-4)' }}>
                  <span style={{ width: 10, height: 10, background: TREND_CAT_COLORS[i % TREND_CAT_COLORS.length], borderRadius: 2 }} />
                  {cat}
                </span>
              ))}
            </div>
          </div>

          <div className="card card-pad-lg">
            <div className="card-head">
              <h3>SEVERITY MIX</h3>
              <span className="meta">all complaints</span>
            </div>
            {severityData.map((s) => {
              const pct = totalComplaints > 0 ? (s.count / totalComplaints) * 100 : 0
              return (
                <div key={s.name} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 56px', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                  <span style={{ fontSize: 11, color: SEV_COLOR[s.name], fontWeight: 700, textTransform: 'uppercase' }}>
                    {s.name === 'high' ? '⚠ ' : ''}{s.name}
                  </span>
                  <div style={{ height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: pct + '%', height: '100%', background: SEV_COLOR[s.name] }} />
                  </div>
                  <span className="mono" style={{ fontSize: 11, textAlign: 'right', color: 'var(--fg-2)', fontWeight: 700 }}>
                    {s.count} · {pct.toFixed(0)}%
                  </span>
                </div>
              )
            })}
            <div className="divider" />
            <div style={{ fontSize: 11, color: 'var(--fg-4)', lineHeight: 1.5 }}>
              <div>● <span style={{ color: 'var(--red)' }}>HIGH</span>: sentiment ≤ −0.6 — escalate immediately</div>
              <div>● <span style={{ color: 'var(--warn)' }}>MEDIUM</span>: sentiment ≤ −0.3 — respond within 24h</div>
              <div>● <span style={{ color: '#94a3b8' }}>LOW</span>: minor / one-off — batch review</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main layout: complaint queue + category bars */}
      <div className="section">
        <div className="card-grid cg-2-1">
          {/* Main pane: queue or repeat complainers */}
          <div className="card card-pad-lg">
            <div className="card-head">
              <h3>{view === 'repeat' ? 'REPEAT COMPLAINERS' : 'COMPLAINT QUEUE'}</h3>
              <div className="chip-row">
                <button className={'chip ' + (view === 'queue' ? 'on' : '')} onClick={() => setView('queue')}>
                  Queue ({totalComplaints})
                </button>
                <button className={'chip ' + (view === 'repeat' ? 'on' : '')} onClick={() => setView('repeat')}>
                  Repeat ({repeatComplainers.length})
                </button>
              </div>
            </div>

            {view === 'queue' ? (
              <>
                {/* Status filter */}
                <div className="chip-row" style={{ marginBottom: 10 }}>
                  <button className={'chip ' + (responded === 'all' ? 'on' : '')} onClick={() => setResponded('all')}>
                    All ({totalComplaints})
                  </button>
                  <button className={'chip ' + (responded === 'open' ? 'on' : '')} onClick={() => setResponded('open')}>
                    Open ({openCount})
                  </button>
                  <button className={'chip ' + (responded === 'closed' ? 'on' : '')} onClick={() => setResponded('closed')}>
                    Resolved ({respondedCount})
                  </button>
                </div>

                {/* Category filter */}
                {categories.length > 0 && (
                  <div className="chip-row" style={{ marginBottom: 14 }}>
                    <button className={'chip ' + (catFilter === 'All' ? 'on' : '')} onClick={() => setCatFilter('All')}>All</button>
                    {categories.slice(0, 6).map((cat) => (
                      <button key={cat} className={'chip ' + (catFilter === cat ? 'on' : '')} onClick={() => setCatFilter(cat)}>
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* Complaint rows */}
                <div className="table-wrap scroll" style={{ maxHeight: 640 }}>
                  {filtered.map((c, i) => {
                    const sev = (c.severity || 'low').toLowerCase()
                    return (
                      <div className="comment-row" key={c.comment_id ?? i}>
                        <div className="comment-user">
                          <span className="uname">@{c.username}</span>
                          {c.complained_at && (
                            <span className="meta">{format(new Date(c.complained_at), 'MMM d')}</span>
                          )}
                          {c.post_url && (
                            <a href={c.post_url} target="_blank" rel="noopener noreferrer" className="meta tlink">↗ view post</a>
                          )}
                        </div>
                        <div className="comment-body">
                          <div className="quote">&ldquo;{c.complaint_text}&rdquo;</div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span className={'pill ' + (SEV_PILL[sev] ?? 'pill-ghost')}>
                              {sev === 'high' ? '⚠ ' : ''}{sev.toUpperCase()}
                            </span>
                            {c.complaint_category && <span className="pill pill-ghost">{c.complaint_category}</span>}
                            {c.joola_responded
                              ? <span className="pill pill-green">✓ RESPONDED</span>
                              : <span className="pill pill-amber">PENDING</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {filtered.length === 0 && <div className="empty">No complaints match your filters.</div>}
                </div>
              </>
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>USER</th>
                      <th className="num">COMPLAINTS</th>
                      <th>DOMINANT TOPIC</th>
                      <th className="num">AMBASSADOR</th>
                      <th className="num">AVG SENT</th>
                      <th>LAST SEEN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repeatComplainers.map((u, i) => (
                      <tr key={u.username}>
                        <td className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>
                          {String(i + 1).padStart(2, '0')}
                        </td>
                        <td>
                          <a href={`https://instagram.com/${u.username}`} target="_blank" rel="noopener noreferrer"
                            className="tlink" style={{ fontWeight: 600 }}>
                            @{u.username}
                          </a>
                        </td>
                        <td className="cell-num">
                          <span style={{ color: 'var(--red)', fontWeight: 700 }}>⚠ {u.complaint_count}</span>
                        </td>
                        <td>
                          {u.dominant_topic ? (
                            <span className="pill pill-ghost" style={{ textTransform: 'capitalize', fontSize: 10 }}>{u.dominant_topic}</span>
                          ) : '—'}
                        </td>
                        <td className="cell-num">{(u.ambassador_score ?? 0).toFixed(1)}</td>
                        <td className="cell-num" style={{
                          color: (u.avg_sentiment_score ?? 0) >= 0 ? 'var(--joola)' : 'var(--red)',
                          fontWeight: 600,
                        }}>
                          {(u.avg_sentiment_score ?? 0).toFixed(2)}
                        </td>
                        <td className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>
                          {u.last_seen_at ? format(new Date(u.last_seen_at), 'MMM d') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {repeatComplainers.length === 0 && <div className="empty">No repeat complainers — every flagged comment is from a different user.</div>}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* SLA tracker */}
            <div className="card card-pad-lg" style={{ marginBottom: 14 }}>
              <div className="card-head">
                <h3>RESPONSE SLA</h3>
                <span className="meta">target 60 min</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                <span className="mono" style={{ fontSize: 28, color: 'var(--fg-4)', fontWeight: 700 }}>—</span>
                <span style={{ fontSize: 12, color: 'var(--fg-4)' }}>min avg</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', position: 'relative', marginBottom: 8 }}>
                <div style={{ position: 'absolute', left: '60%', top: 0, bottom: 0, width: 1, background: 'var(--yellow)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--fg-4)' }} className="mono">
                <span>0 min</span><span>60 min target</span><span>100+</span>
              </div>
              <div style={{ marginTop: 12, fontSize: 11, color: 'var(--fg-4)', lineHeight: 1.5 }}>
                Awaiting first replies on {openCount} complaints. Histogram appears once <code className="mono" style={{ color: 'var(--fg-3)' }}>joola_response_time_mins</code> starts populating.
              </div>
            </div>

            {/* Category breakdown */}
            <div className="card card-pad-lg" style={{ marginBottom: 14 }}>
              <div className="card-head">
                <h3>BY CATEGORY</h3>
                <span className="meta">volume</span>
              </div>
              {categoryData.slice(0, 8).map((d) => (
                <div className="bar-row" key={d.name}>
                  <div className="lbl">{d.name}</div>
                  <div className="track">
                    <div className="fill" style={{ width: (d.count / maxCat * 100) + '%', background: 'linear-gradient(90deg, var(--red), var(--red-deep))' }} />
                  </div>
                  <div className="spark-mini">{d.count}</div>
                  <div className="delta-mini">{Math.round(d.count / totalComplaints * 100)}%</div>
                </div>
              ))}
              {categoryData.length === 0 && <div className="empty">No category data yet.</div>}
            </div>

            {/* Wishlist */}
            {allWishlist.length > 0 && (
              <div className="card card-pad-lg">
                <div className="card-head">
                  <h3>WISHLIST ITEMS</h3>
                  <span className="meta">{allWishlist.length} requests</span>
                </div>
                {allWishlist.slice(0, 5).map((w, i) => (
                  <div key={w.comment_id ?? i} style={{ padding: '10px 0', borderBottom: '1px solid var(--line-2)', fontSize: 12 }}>
                    <div style={{ color: 'var(--fg-3)', marginBottom: 4, fontStyle: 'italic' }}>
                      &ldquo;{w.wishlist_text?.slice(0, 80)}{(w.wishlist_text?.length ?? 0) > 80 ? '…' : ''}&rdquo;
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="pill pill-ghost">{w.category || 'general'}</span>
                      <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>@{w.username}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
