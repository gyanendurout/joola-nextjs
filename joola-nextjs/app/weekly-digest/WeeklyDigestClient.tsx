'use client'

import { format } from 'date-fns'
import type { IgWeeklySnapshot, IgPost, IgWishlistItem, IgComplaintLog, IgLoyalUser } from '@/lib/types'

type SuperFan = Pick<IgLoyalUser, 'username' | 'loyalty_tier' | 'ambassador_score' | 'total_comments' | 'dominant_topic' | 'first_seen_at' | 'last_seen_at' | 'purchase_intent_count'>

interface Delta { abs: number; pct: number }

interface Props {
  current: IgWeeklySnapshot | null
  previous: IgWeeklySnapshot | null
  deltas: {
    posts: Delta
    comments: Delta
    views: Delta
    er: Delta
    complaints: Delta
    purchase: Delta
    competitor: Delta
    wishlist: Delta
    sentiment: Delta
  } | null
  topPost: IgPost | null
  topComplaint: IgComplaintLog | null
  wishlist: IgWishlistItem[]
  superFans: SuperFan[]
  competitorBreakdown: Array<{ name: string; count: number }>
  history: IgWeeklySnapshot[]
}

function fmtNum(v: number | null | undefined): string {
  if (v == null) return '—'
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M'
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'
  return v.toLocaleString()
}

function DeltaPill({ d, inverted = false }: { d: Delta; inverted?: boolean }) {
  const positive = d.abs > 0
  const goodDirection = inverted ? !positive : positive
  const color = d.abs === 0 ? 'var(--fg-4)' : goodDirection ? 'var(--joola)' : 'var(--red)'
  const arrow = d.abs === 0 ? '—' : positive ? '▲' : '▼'
  return (
    <span className="mono" style={{ fontSize: 11, color, fontWeight: 700 }}>
      {arrow} {Math.abs(d.pct).toFixed(1)}%
    </span>
  )
}

function StatCard({ label, value, sub, delta, invertedDelta = false }: {
  label: string; value: string; sub?: string; delta?: Delta; invertedDelta?: boolean
}) {
  return (
    <div className="card card-pad-lg">
      <div style={{ fontSize: 10.5, letterSpacing: '0.1em', color: 'var(--fg-4)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--fg)', lineHeight: 1 }}>{value}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--fg-4)' }}>{sub || ''}</span>
        {delta && <DeltaPill d={delta} inverted={invertedDelta} />}
      </div>
    </div>
  )
}

export default function WeeklyDigestClient({
  current, previous, deltas, topPost, topComplaint, wishlist, superFans, competitorBreakdown, history,
}: Props) {
  if (!current) {
    return (
      <div>
        <header className="page-head">
          <div>
            <div className="eyebrow"><span className="live-pulse-dot" />JOOLA PULSE · WEEKLY REPORT</div>
            <h1>WEEKLY <em>DIGEST</em></h1>
            <div className="sub">No weekly data yet — run the IG scraper to populate snapshots.</div>
          </div>
        </header>
        <div className="empty">No snapshots available.</div>
      </div>
    )
  }

  const weekLabel = `${format(new Date(current.week_start), 'MMM d')} – ${format(new Date(current.week_end), 'MMM d, yyyy')}`

  return (
    <div>
      <header className="page-head">
        <div>
          <div className="eyebrow">
            <span className="live-pulse-dot" />
            JOOLA PULSE · WEEKLY REPORT
          </div>
          <h1>WEEKLY <em>DIGEST</em></h1>
          <div className="sub">
            Auto-generated marketing report card for the week of <strong style={{ color: 'var(--fg)' }}>{weekLabel}</strong>.
            All metrics compared to the prior week. Designed for export to PDF or email.
          </div>
        </div>
        <div className="head-actions">
          <button className="btn btn-yellow" onClick={() => window.print()}>
            🖨 Print / PDF
          </button>
        </div>
      </header>

      {/* Top-line stats */}
      <div className="section">
        <div className="kpi-grid">
          <StatCard label="Posts Published" value={fmtNum(current.posts_published)}
            sub="this week" delta={deltas?.posts} />
          <StatCard label="Total Comments" value={fmtNum(current.total_comments)}
            sub={`${fmtNum(current.total_likes)} likes`} delta={deltas?.comments} />
          <StatCard label="Total Views" value={fmtNum(current.total_views)}
            sub="reels + video" delta={deltas?.views} />
          <StatCard label="Avg Engagement Rate" value={(current.avg_engagement_rate * 100).toFixed(2) + '%'}
            sub="(likes + comments) / reach" delta={deltas?.er} />
        </div>
      </div>

      <div className="section">
        <div className="kpi-grid">
          <StatCard label="Purchase Signals" value={fmtNum(current.purchase_intent_count)}
            sub="AI-detected buy intent" delta={deltas?.purchase} />
          <StatCard label="Complaints" value={fmtNum(current.complaint_count)}
            sub="negative + flagged" delta={deltas?.complaints} invertedDelta />
          <StatCard label="Competitor Mentions" value={fmtNum(current.competitor_mention_count)}
            sub="own posts" delta={deltas?.competitor} invertedDelta />
          <StatCard label="Wishlist Items" value={fmtNum(current.wishlist_count ?? 0)}
            sub="product requests" delta={deltas?.wishlist} />
        </div>
      </div>

      {/* Sentiment + Theme + New audience */}
      <div className="section">
        <div className="card-grid cg-3">
          <div className="card card-pad-lg">
            <div className="card-head"><h3>SENTIMENT MIX</h3><span className="meta">this week</span></div>
            <div style={{ display: 'flex', gap: 18, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--joola)' }}>
                  {(current.positive_comment_pct ?? 0).toFixed(0)}%
                </div>
                <div style={{ fontSize: 11, color: 'var(--fg-4)' }}>positive</div>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#94a3b8' }}>
                  {(current.neutral_comment_pct ?? 0).toFixed(0)}%
                </div>
                <div style={{ fontSize: 11, color: 'var(--fg-4)' }}>neutral</div>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--red)' }}>
                  {(current.negative_comment_pct ?? 0).toFixed(0)}%
                </div>
                <div style={{ fontSize: 11, color: 'var(--fg-4)' }}>negative</div>
              </div>
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-3)' }}>
              <span>Avg sentiment score</span>
              <span className="mono" style={{ fontWeight: 700, color: (current.avg_sentiment_score ?? 0) >= 0 ? 'var(--joola)' : 'var(--red)' }}>
                {(current.avg_sentiment_score ?? 0).toFixed(3)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-3)', marginTop: 4 }}>
              <span>Top emotion</span>
              <span className="mono" style={{ fontWeight: 700, color: 'var(--yellow)', textTransform: 'capitalize' }}>
                {current.top_emotion ?? '—'}
              </span>
            </div>
          </div>

          <div className="card card-pad-lg">
            <div className="card-head"><h3>DOMINANT THEME</h3><span className="meta">what we posted</span></div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--yellow)', textTransform: 'capitalize', marginBottom: 8 }}>
              {(current.dominant_content_theme || '—').replace(/_/g, ' ')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.5 }}>
              Out of {current.posts_published} posts this week, this was the most-used content theme.
            </div>
            {current.top_post_engagement != null && (
              <>
                <div className="divider" />
                <div style={{ fontSize: 11, color: 'var(--fg-4)', letterSpacing: '0.08em' }}>BEST POST</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--joola)', marginTop: 2 }}>
                  {(current.top_post_engagement || 0).toLocaleString()} interactions
                </div>
              </>
            )}
          </div>

          <div className="card card-pad-lg">
            <div className="card-head"><h3>AUDIENCE</h3><span className="meta">commenter growth</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 0' }}>
              <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>New commenters</span>
              <span className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--joola)' }}>+{current.new_commenters ?? 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 0' }}>
              <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Returning</span>
              <span className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--yellow)' }}>{current.returning_commenters ?? 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 0' }}>
              <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>New super fans</span>
              <span className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--pink)' }}>{current.new_super_fans ?? 0}</span>
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-3)' }}>
              <span>JOOLA replies</span>
              <span className="mono" style={{ fontWeight: 700 }}>{current.joola_reply_count ?? 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-3)', marginTop: 4 }}>
              <span>Avg response time</span>
              <span className="mono" style={{ fontWeight: 700 }}>{current.avg_joola_response_time_mins != null ? current.avg_joola_response_time_mins + ' min' : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Post + Top Complaint */}
      <div className="section">
        <div className="card-grid cg-2">
          <div className="card card-pad-lg">
            <div className="card-head"><h3>★ TOP POST</h3><span className="meta">by ER this week</span></div>
            {topPost ? (
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {topPost.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={topPost.thumbnail_url} alt="" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--line)', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--fg-2)', marginBottom: 6, lineHeight: 1.4 }}>
                    &ldquo;{(topPost.caption || '').slice(0, 160)}{(topPost.caption?.length ?? 0) > 160 ? '…' : ''}&rdquo;
                  </div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--fg-4)', flexWrap: 'wrap' }} className="mono">
                    <span><span style={{ color: 'var(--joola)', fontWeight: 700 }}>{((topPost.engagement_rate || 0) * 100).toFixed(2)}%</span> ER</span>
                    <span>{fmtNum(topPost.like_count)} likes</span>
                    <span>{fmtNum(topPost.comment_count)} comments</span>
                    <span>{fmtNum(topPost.view_count)} views</span>
                  </div>
                  {topPost.post_url && (
                    <a href={topPost.post_url} target="_blank" rel="noopener noreferrer" className="tlink" style={{ fontSize: 11, marginTop: 6, display: 'inline-block' }}>
                      ↗ view on Instagram
                    </a>
                  )}
                </div>
              </div>
            ) : <div className="empty">No posts this week.</div>}
          </div>

          <div className="card card-pad-lg">
            <div className="card-head"><h3>⚠ TOP COMPLAINT</h3><span className="meta">most severe this week</span></div>
            {topComplaint ? (
              <div>
                <div style={{ fontSize: 13, color: 'var(--fg-2)', marginBottom: 8, lineHeight: 1.5, fontStyle: 'italic' }}>
                  &ldquo;{topComplaint.complaint_text}&rdquo;
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>@{topComplaint.username}</span>
                  <span className={'pill ' + ((topComplaint.severity || 'low').toLowerCase() === 'high' ? 'pill-red' : (topComplaint.severity || '').toLowerCase() === 'medium' ? 'pill-amber' : 'pill-ghost')}>
                    {(topComplaint.severity || 'low').toUpperCase()}
                  </span>
                  {topComplaint.complaint_category && <span className="pill pill-ghost">{topComplaint.complaint_category}</span>}
                  <span className="mono" style={{ fontSize: 11, color: topComplaint.joola_responded ? 'var(--joola)' : 'var(--warn)' }}>
                    {topComplaint.joola_responded ? '✓ resolved' : 'pending'}
                  </span>
                </div>
              </div>
            ) : <div className="empty">No complaints this week. 🎉</div>}
          </div>
        </div>
      </div>

      {/* Top wishlist + Competitors + Super fans */}
      <div className="section">
        <div className="card-grid cg-3">
          <div className="card card-pad-lg">
            <div className="card-head"><h3>★ TOP WISHLIST</h3><span className="meta">all-time, ranked</span></div>
            {wishlist.length === 0 ? <div className="empty">No requests.</div> :
              wishlist.map((w, i) => (
                <div key={w.comment_id ?? i} style={{ padding: '8px 0', borderBottom: '1px solid var(--line-2)' }}>
                  <div style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.4 }}>
                    &ldquo;{(w.wishlist_text || '').slice(0, 90)}{(w.wishlist_text?.length ?? 0) > 90 ? '…' : ''}&rdquo;
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center', fontSize: 10 }}>
                    {w.category && <span className="pill pill-ghost" style={{ textTransform: 'capitalize', fontSize: 9 }}>{w.category}</span>}
                    {w.times_similar_requested != null && w.times_similar_requested > 1 && (
                      <span className="pill pill-yellow" style={{ fontSize: 9 }}>×{w.times_similar_requested}</span>
                    )}
                    <span className="mono" style={{ color: 'var(--fg-4)' }}>@{w.username}</span>
                  </div>
                </div>
              ))
            }
          </div>

          <div className="card card-pad-lg">
            <div className="card-head"><h3>⚐ COMPETITOR MENTIONS</h3><span className="meta">this week</span></div>
            {competitorBreakdown.length === 0 ? <div className="empty">No competitor mentions this week.</div> :
              competitorBreakdown.map((c) => {
                const max = competitorBreakdown[0].count || 1
                return (
                  <div key={c.name} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 40px', gap: 8, alignItems: 'center', padding: '6px 0' }}>
                    <span style={{ fontSize: 12, textTransform: 'capitalize', fontWeight: 600 }}>{c.name}</span>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: ((c.count / max) * 100) + '%', height: '100%', background: 'var(--warn)' }} />
                    </div>
                    <span className="mono" style={{ fontSize: 11, textAlign: 'right', fontWeight: 700 }}>{c.count}</span>
                  </div>
                )
              })
            }
          </div>

          <div className="card card-pad-lg">
            <div className="card-head"><h3>★ SUPER FANS</h3><span className="meta">top loyalty</span></div>
            {superFans.length === 0 ? <div className="empty">No super fans yet.</div> :
              superFans.slice(0, 6).map((u, i) => (
                <div key={u.username} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--line-2)' }}>
                  <div>
                    <a href={`https://instagram.com/${u.username}`} target="_blank" rel="noopener noreferrer" className="tlink" style={{ fontWeight: 700, fontSize: 12 }}>
                      @{u.username}
                    </a>
                    {u.dominant_topic && (
                      <span className="pill pill-ghost" style={{ marginLeft: 6, fontSize: 9, textTransform: 'capitalize' }}>{u.dominant_topic}</span>
                    )}
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--yellow)', fontWeight: 700 }}>
                    {(u.ambassador_score || 0).toFixed(1)}
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* History strip */}
      <div className="section">
        <div className="card card-pad-lg">
          <div className="card-head">
            <h3>8-WEEK HISTORY</h3>
            <span className="meta">posts · comments · ER · sentiment</span>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>WEEK</th>
                  <th className="num">POSTS</th>
                  <th className="num">COMMENTS</th>
                  <th className="num">VIEWS</th>
                  <th className="num">ER</th>
                  <th className="num">SENT</th>
                  <th className="num">COMPLAINTS</th>
                  <th className="num">INTENT</th>
                  <th>TOP THEME</th>
                </tr>
              </thead>
              <tbody>
                {history.map((w, i) => (
                  <tr key={w.week_start} className={i === 0 ? 'highlight' : ''}>
                    <td className="mono" style={{ fontSize: 11 }}>
                      {format(new Date(w.week_start), 'MMM d')}
                      {i === 0 && <span className="you-badge">CURRENT</span>}
                    </td>
                    <td className="cell-num">{w.posts_published}</td>
                    <td className="cell-num">{fmtNum(w.total_comments)}</td>
                    <td className="cell-num">{fmtNum(w.total_views)}</td>
                    <td className="cell-num" style={{ color: w.avg_engagement_rate >= 0.06 ? 'var(--joola)' : 'var(--fg)' }}>
                      {(w.avg_engagement_rate * 100).toFixed(2)}%
                    </td>
                    <td className="cell-num" style={{ color: (w.avg_sentiment_score ?? 0) >= 0 ? 'var(--joola)' : 'var(--red)' }}>
                      {(w.avg_sentiment_score ?? 0).toFixed(2)}
                    </td>
                    <td className="cell-num" style={{ color: (w.complaint_count ?? 0) > 0 ? 'var(--red)' : 'var(--fg-3)' }}>
                      {w.complaint_count ?? 0}
                    </td>
                    <td className="cell-num" style={{ color: 'var(--joola)', fontWeight: 600 }}>
                      {w.purchase_intent_count ?? 0}
                    </td>
                    <td style={{ textTransform: 'capitalize', fontSize: 11, color: 'var(--fg-3)' }}>
                      {(w.dominant_content_theme || '—').replace(/_/g, ' ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
