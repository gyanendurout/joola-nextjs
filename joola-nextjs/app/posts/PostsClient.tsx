'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import KpiCard from '@/components/ui/KpiCard'
import PostingTimeHeatmap from '@/components/PostingTimeHeatmap'
import ContentCalendar from '@/components/ContentCalendar'
import type { IgPost, IgPostAnalysis } from '@/lib/types'

type EnrichedPost = IgPost & Partial<IgPostAnalysis>

interface HeatmapCell { day: string; hour: number; postCount: number; avgEngagement: number }
interface CalendarDay  { date: string; avgEngagement: number; postCount: number }
interface ThemeRow {
  theme: string
  count: number
  avgEr: number
  avgViews: number
  avgLikes: number
  cells: Record<string, { count: number; avgEr: number; avgViews: number }>
}
interface AthleteRow { name: string; count: number; avgEr: number; avgViews: number; avgLikes: number }
interface CtaRow { name: string; count: number; avgEr: number }
interface CarouselRow { name: string; count: number; avgEr: number }
interface SponsoredRow { name: 'sponsored' | 'organic'; count: number; avgEr: number; avgViews: number }
interface SponsorBrand { name: string; count: number }
interface CadenceRow {
  theme: string
  best: { day: string; avgEr: number; count: number }
  days: Array<{ day: string; avgEr: number; count: number }>
}

interface PostsClientProps {
  posts: EnrichedPost[]
  postTypes: string[]
  contentThemes: string[]
  kpis: { totalPosts: number; totalViews: number; avgER: number; avgCadence: number }
  trends: { posts: number[]; er: number[]; views: number[] }
  heatmapData: HeatmapCell[]
  calendarData: CalendarDay[]
  themeRows: ThemeRow[]
  athleteRows: AthleteRow[]
  ctaRows: CtaRow[]
  carouselRows: CarouselRow[]
  sponsoredRows: SponsoredRow[]
  sponsorBrands: SponsorBrand[]
  cadenceRows: CadenceRow[]
}

const TYPE_PILL: Record<string, string> = {
  reel: 'pill-yellow', photo: 'pill-ghost', image: 'pill-ghost',
  carousel: 'pill-info', video: 'pill-cyan',
}

type SortKey = 'er' | 'views' | 'likes' | 'comments' | 'date' | 'quality' | 'predicted'

function fmtViews(v: number) {
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M'
  if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K'
  return v.toString()
}

const PREDICT_RANK: Record<string, number> = { low: 1, mid: 2, high: 3 }

function ScoreCell({ s }: { s: number | null | undefined }) {
  if (s == null) return <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>—</span>
  const color = s >= 8 ? 'var(--joola)' : s >= 6 ? 'var(--fg)' : s >= 4 ? 'var(--warn)' : 'var(--red)'
  return <span className="mono" style={{ fontSize: 11, color, fontWeight: 700 }}>{s.toFixed(1)}</span>
}

function PredictPill({ p }: { p: string | undefined | null }) {
  if (!p) return <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>—</span>
  const v = p.toLowerCase()
  const cls = v === 'high' ? 'pill-green' : v === 'mid' ? 'pill-info' : 'pill-ghost'
  return <span className={'pill ' + cls} style={{ textTransform: 'uppercase', fontSize: 9.5 }}>{v}</span>
}

export default function PostsClient({
  posts, postTypes, contentThemes, kpis, trends, heatmapData, calendarData,
  themeRows, athleteRows, ctaRows, carouselRows,
  sponsoredRows, sponsorBrands, cadenceRows,
}: PostsClientProps) {
  const [typeFilter, setTypeFilter] = useState('All')
  const [sortKey, setSortKey] = useState<SortKey>('er')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const types = ['All', ...postTypes.map((t) => t.charAt(0).toUpperCase() + t.slice(1))]

  const filtered = useMemo(() => {
    const base = posts.filter((p) =>
      typeFilter === 'All' || (p.post_type ?? '').toLowerCase() === typeFilter.toLowerCase()
    )
    return [...base].sort((a, b) => {
      const d = sortDir === 'desc' ? -1 : 1
      if (sortKey === 'er')       return d * ((a.engagement_rate ?? 0) - (b.engagement_rate ?? 0))
      if (sortKey === 'views')    return d * ((a.view_count ?? 0) - (b.view_count ?? 0))
      if (sortKey === 'likes')    return d * ((a.like_count ?? 0) - (b.like_count ?? 0))
      if (sortKey === 'comments') return d * ((a.comment_count ?? 0) - (b.comment_count ?? 0))
      if (sortKey === 'date')     return d * (new Date(a.posted_at ?? 0).getTime() - new Date(b.posted_at ?? 0).getTime())
      if (sortKey === 'quality')  return d * ((a.caption_quality_score ?? 0) - (b.caption_quality_score ?? 0))
      if (sortKey === 'predicted') return d * ((PREDICT_RANK[(a.predicted_performance || '').toLowerCase()] || 0) - (PREDICT_RANK[(b.predicted_performance || '').toLowerCase()] || 0))
      return 0
    })
  }, [posts, typeFilter, sortKey, sortDir])

  function sort(k: SortKey) {
    if (k === sortKey) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortKey(k); setSortDir('desc') }
  }
  function sortArrow(k: SortKey) { return sortKey === k ? (sortDir === 'desc' ? ' ▼' : ' ▲') : '' }

  return (
    <div>
      <header className="page-head">
        <div>
          <div className="eyebrow">
            <span className="live-pulse-dot" />
            INSTAGRAM · POST PERFORMANCE
          </div>
          <h1>POSTS &amp; <em>CADENCE</em></h1>
          <div className="sub">Every post ranked by performance. Find your best-posting windows and content patterns.</div>
        </div>
        <div className="head-actions">
          <select className="fld">
            <option>All athletes</option>
          </select>
          <select className="fld">
            <option>Last 13 weeks</option>
            <option>Last 4 weeks</option>
            <option>Year to date</option>
          </select>
        </div>
      </header>

      {/* KPIs */}
      <div className="section">
        <div className="kpi-grid">
          <KpiCard variant="joola" label="POSTS PUBLISHED" src="13 wk"
            value={kpis.totalPosts} trend={trends.posts}
            delta="▲ +7.0%" dir="up" />
          <KpiCard label="AVG ENGAGEMENT RATE" src="(L+C)/Reach"
            value={+(kpis.avgER * 100).toFixed(2)} unit="%"
            trend={trends.er} delta="▼ -2.4%" dir="down" />
          <KpiCard label="TOTAL VIEWS" src="reels + video"
            value={kpis.totalViews} trend={trends.views}
            delta="▲ +18.4%" dir="up" />
          <KpiCard label="AVG POST CADENCE" src="posts / week"
            value={kpis.avgCadence} trend={trends.posts}
            delta="▲ +0.8" dir="up" />
        </div>
      </div>

      {/* Heatmap + Calendar */}
      <div className="section">
        <div className="card-grid cg-2-1">
          <div className="card card-pad-lg">
            <div className="card-head">
              <h3>POSTING TIME · AVG ENGAGEMENT</h3>
              <span className="meta">7 days × 24 hours · ER %</span>
            </div>
            <PostingTimeHeatmap data={heatmapData} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10.5, color: 'var(--fg-4)', fontFamily: 'JetBrains Mono' }}>
              <span>00:00</span><span>12:00</span><span>23:00</span>
            </div>
          </div>
          <div className="card card-pad-lg">
            <div className="card-head">
              <h3>CONTENT CALENDAR</h3>
              <span className="meta">26 wk · ER intensity</span>
            </div>
            <ContentCalendar data={calendarData} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10.5, color: 'var(--fg-4)', fontFamily: 'JetBrains Mono' }}>
              <span>26 wk ago</span>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <span>Less</span>
                {[0.1, 0.3, 0.5, 0.7, 0.9].map((a) => (
                  <span key={a} style={{ width: 10, height: 10, background: `rgba(34,197,94,${a})`, borderRadius: 2, display: 'inline-block' }} />
                ))}
                <span>More</span>
              </div>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Theme × Format matrix */}
      <div className="section">
        <div className="card card-pad-lg">
          <div className="card-head">
            <h3>CONTENT THEME × FORMAT — AVG ENGAGEMENT</h3>
            <span className="meta">themes ranked by post count · cells = avg ER %</span>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>THEME</th>
                  <th className="num">POSTS</th>
                  <th className="num">AVG ER</th>
                  <th className="num">AVG VIEWS</th>
                  <th className="num">AVG LIKES</th>
                  {postTypes.map((t) => (
                    <th className="num" key={t} style={{ textTransform: 'capitalize' }}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {themeRows.map((row) => (
                  <tr key={row.theme}>
                    <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                      {row.theme.replace(/_/g, ' ')}
                    </td>
                    <td className="cell-num">{row.count}</td>
                    <td className="cell-num" style={{
                      color: row.avgEr >= 0.06 ? 'var(--joola)' : row.avgEr < 0.03 ? 'var(--down)' : 'var(--fg)',
                      fontWeight: 700,
                    }}>{(row.avgEr * 100).toFixed(2)}%</td>
                    <td className="cell-num">{fmtViews(row.avgViews)}</td>
                    <td className="cell-num">{fmtViews(row.avgLikes)}</td>
                    {postTypes.map((t) => {
                      const cell = row.cells[t.toLowerCase()]
                      if (!cell || cell.count === 0) {
                        return <td className="cell-num" key={t} style={{ color: 'var(--fg-4)' }}>—</td>
                      }
                      return (
                        <td className="cell-num" key={t}>
                          <span style={{ fontWeight: 600, color: cell.avgEr >= 0.06 ? 'var(--joola)' : cell.avgEr < 0.03 ? 'var(--down)' : 'var(--fg)' }}>
                            {(cell.avgEr * 100).toFixed(1)}%
                          </span>
                          <span className="mono" style={{ marginLeft: 4, fontSize: 10, color: 'var(--fg-4)' }}>n={cell.count}</span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {themeRows.length === 0 && <div className="empty">No themed posts yet. Run AI post analysis to populate.</div>}
          </div>
        </div>
      </div>

      {/* Athletes + CTA + Carousel */}
      <div className="section">
        <div className="card-grid cg-2-1">
          <div className="card card-pad-lg">
            <div className="card-head">
              <h3>TOP ATHLETES BY ENGAGEMENT</h3>
              <span className="meta">avg ER per athlete-featuring post</span>
            </div>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>ATHLETE</th>
                    <th className="num">POSTS</th>
                    <th className="num">AVG ER</th>
                    <th className="num">AVG VIEWS</th>
                    <th className="num">AVG LIKES</th>
                  </tr>
                </thead>
                <tbody>
                  {athleteRows.map((a) => (
                    <tr key={a.name}>
                      <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{a.name}</td>
                      <td className="cell-num">{a.count}</td>
                      <td className="cell-num" style={{
                        color: a.avgEr >= 0.06 ? 'var(--joola)' : a.avgEr < 0.03 ? 'var(--down)' : 'var(--fg)',
                        fontWeight: 700,
                      }}>{(a.avgEr * 100).toFixed(2)}%</td>
                      <td className="cell-num">{fmtViews(a.avgViews)}</td>
                      <td className="cell-num">{fmtViews(a.avgLikes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {athleteRows.length === 0 && (
                <div className="empty">No athlete tags yet. Will populate as post analysis runs identify `athletes_shown`.</div>
              )}
            </div>
          </div>

          <div>
            <div className="card card-pad-lg" style={{ marginBottom: 14 }}>
              <div className="card-head">
                <h3>CTA EFFECTIVENESS</h3>
                <span className="meta">avg ER by CTA type</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(() => {
                  const max = Math.max(0.0001, ...ctaRows.map((r) => r.avgEr))
                  return ctaRows.map((r) => (
                    <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 70px', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase' }}>{r.name.replace(/_/g, ' ')}</span>
                      <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: ((r.avgEr / max) * 100) + '%', height: '100%', background: 'var(--joola)' }} />
                      </div>
                      <span className="mono" style={{ fontSize: 11, textAlign: 'right', color: 'var(--fg-2)' }}>
                        {(r.avgEr * 100).toFixed(1)}% · n={r.count}
                      </span>
                    </div>
                  ))
                })()}
                {ctaRows.length === 0 && <div className="empty" style={{ padding: '10px 0', fontSize: 11 }}>No CTA data.</div>}
              </div>
            </div>

            <div className="card card-pad-lg">
              <div className="card-head">
                <h3>CAROUSEL LENGTH</h3>
                <span className="meta">slides vs avg ER</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(() => {
                  const max = Math.max(0.0001, ...carouselRows.map((r) => r.avgEr))
                  return carouselRows.map((r) => (
                    <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 70px', alignItems: 'center', gap: 8 }}>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{r.name} slides</span>
                      <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: ((r.avgEr / max) * 100) + '%', height: '100%', background: 'var(--yellow)' }} />
                      </div>
                      <span className="mono" style={{ fontSize: 11, textAlign: 'right', color: 'var(--fg-2)' }}>
                        {(r.avgEr * 100).toFixed(1)}% · n={r.count}
                      </span>
                    </div>
                  ))
                })()}
                {carouselRows.length === 0 && <div className="empty" style={{ padding: '10px 0', fontSize: 11 }}>No carousel posts yet.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sponsored vs Organic + Posting Cadence Optimizer */}
      <div className="section">
        <div className="card-grid cg-2-1">
          <div className="card card-pad-lg">
            <div className="card-head">
              <h3>POSTING CADENCE BY THEME</h3>
              <span className="meta">best day to post by content theme · avg ER</span>
            </div>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>THEME</th>
                    <th>BEST DAY</th>
                    <th className="num">BEST ER</th>
                    <th>RANKING</th>
                  </tr>
                </thead>
                <tbody>
                  {cadenceRows.map((row) => {
                    const max = Math.max(0.0001, ...row.days.map((d) => d.avgEr))
                    return (
                      <tr key={row.theme}>
                        <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                          {row.theme.replace(/_/g, ' ')}
                        </td>
                        <td style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--yellow)' }}>
                          {row.best.day}
                        </td>
                        <td className="cell-num" style={{ color: 'var(--joola)', fontWeight: 700 }}>
                          {(row.best.avgEr * 100).toFixed(2)}%
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 24 }}>
                            {row.days.slice(0, 7).map((d) => (
                              <div key={d.day}
                                title={`${d.day}: ${(d.avgEr * 100).toFixed(2)}% (n=${d.count})`}
                                style={{
                                  width: 14,
                                  height: ((d.avgEr / max) * 100) + '%',
                                  minHeight: 2,
                                  background: d.day === row.best.day ? 'var(--yellow)' : 'rgba(255,255,255,0.15)',
                                  borderRadius: 2,
                                }}
                              />
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {cadenceRows.length === 0 && <div className="empty">Not enough themed posts yet.</div>}
            </div>
          </div>

          <div className="card card-pad-lg">
            <div className="card-head">
              <h3>SPONSORED vs ORGANIC</h3>
              <span className="meta">paid media ROI</span>
            </div>
            <div>
              {sponsoredRows.map((r) => {
                const isPaid = r.name === 'sponsored'
                const tone = isPaid ? 'var(--yellow)' : 'var(--joola)'
                return (
                  <div key={r.name} style={{ padding: '10px 0', borderBottom: '1px solid var(--line-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tone }}>
                        {r.name}
                      </span>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>n={r.count}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 18, fontSize: 12 }}>
                      <div>
                        <span style={{ color: 'var(--fg-4)', fontSize: 10 }}>AVG ER&nbsp;</span>
                        <span className="mono" style={{ fontWeight: 700, color: tone }}>{(r.avgEr * 100).toFixed(2)}%</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--fg-4)', fontSize: 10 }}>AVG VIEWS&nbsp;</span>
                        <span className="mono" style={{ fontWeight: 700 }}>{fmtViews(r.avgViews)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {sponsorBrands.length > 0 && (
              <>
                <div className="divider" />
                <div style={{ fontSize: 10, color: 'var(--fg-4)', letterSpacing: '0.1em', marginBottom: 6 }}>TOP SPONSOR BRANDS</div>
                {sponsorBrands.map((b) => (
                  <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                    <span style={{ textTransform: 'capitalize' }}>{b.name}</span>
                    <span className="mono" style={{ color: 'var(--fg-3)' }}>{b.count}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* All posts table */}
      <div className="section">
        <div className="card card-pad-lg">
          <div className="card-head">
            <h3>ALL POSTS</h3>
            <div className="chip-row" style={{ alignItems: 'center' }}>
              {types.map((t) => (
                <button key={t} className={'chip ' + (typeFilter === t ? 'on' : '')} onClick={() => setTypeFilter(t)}>{t}</button>
              ))}
              <span className="mono" style={{ marginLeft: 8, fontSize: 11, color: 'var(--fg-4)' }}>{filtered.length} posts</span>
            </div>
          </div>
          <div className="table-wrap scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>POST</th>
                  <th>TYPE</th>
                  <th>THEME</th>
                  <th className="num sortable" onClick={() => sort('er')}>ER{sortArrow('er')}</th>
                  <th className="num sortable" onClick={() => sort('views')}>VIEWS{sortArrow('views')}</th>
                  <th className="num sortable" onClick={() => sort('likes')}>LIKES{sortArrow('likes')}</th>
                  <th className="num sortable" onClick={() => sort('comments')}>COMMENTS{sortArrow('comments')}</th>
                  <th className="num sortable" onClick={() => sort('quality')}>CAPT{sortArrow('quality')}</th>
                  <th className="num">VIS</th>
                  <th className="num">HASH</th>
                  <th className="num sortable" onClick={() => sort('predicted')}>PRED{sortArrow('predicted')}</th>
                  <th className="num sortable" onClick={() => sort('date')}>POSTED{sortArrow('date')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const typeKey = (p.post_type ?? '').toLowerCase()
                  const pillCls = TYPE_PILL[typeKey] ?? 'pill-ghost'
                  const er = p.engagement_rate ?? 0
                  const erColor = er >= 0.06 ? 'var(--joola)' : er < 0.03 ? 'var(--down)' : 'var(--fg)'
                  return (
                    <tr key={p.post_id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {p.thumbnail_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.thumbnail_url} alt="" style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--line)', flexShrink: 0 }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          ) : (
                            <span style={{ width: 28, height: 28, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 4, display: 'grid', placeItems: 'center', fontSize: 10, color: 'var(--fg-3)', flexShrink: 0 }}>
                              {(p.post_type ?? 'P').charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>
                              {p.caption ? p.caption.slice(0, 40) + (p.caption.length > 40 ? '…' : '') : p.post_id}
                            </div>
                            <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>{p.post_id}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={'pill ' + pillCls}>{p.post_type ?? '—'}</span></td>
                      <td>
                        {p.content_theme ? (
                          <span className="pill pill-ghost" style={{ textTransform: 'capitalize', fontSize: 10 }}>
                            {p.content_theme.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--fg-4)', fontSize: 11 }}>—</span>
                        )}
                        {p.is_sponsored && (
                          <span className="pill pill-yellow" style={{ marginLeft: 4, fontSize: 9 }}>SPON</span>
                        )}
                      </td>
                      <td className="cell-num" style={{ color: erColor }}>{(er * 100).toFixed(1)}%</td>
                      <td className="cell-num">{fmtViews(p.view_count ?? 0)}</td>
                      <td className="cell-num">{fmtViews(p.like_count ?? 0)}</td>
                      <td className="cell-num">{(p.comment_count ?? 0).toLocaleString()}</td>
                      <td className="cell-num"><ScoreCell s={p.caption_quality_score} /></td>
                      <td className="cell-num"><ScoreCell s={p.visual_quality_score} /></td>
                      <td className="cell-num"><ScoreCell s={p.hashtag_relevance_score} /></td>
                      <td className="cell-num"><PredictPill p={p.predicted_performance} /></td>
                      <td className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>
                        {p.posted_at ? format(new Date(p.posted_at), 'MMM d') : '—'}
                      </td>
                      <td>
                        {p.post_url && (
                          <a href={p.post_url} target="_blank" rel="noopener noreferrer" className="tlink" style={{ fontSize: 11 }}>↗ open</a>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="empty">No posts match your filters.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
