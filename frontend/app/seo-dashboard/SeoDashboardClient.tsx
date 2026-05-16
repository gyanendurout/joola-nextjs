'use client'

import { useState } from 'react'
import KpiCard from '@/components/ui/KpiCard'
import { format } from 'date-fns'

interface SeoIssue { id: string; severity: string; title: string; description: string; category: string }
interface SeoKeyword { id: string; keyword: string; search_volume: number; difficulty: number; position: number | null; previous_position: number | null; is_gap: boolean }
interface SeoReco { title: string; description: string; priority: string; tags: string[] }
interface BacklinkSummary { total_backlinks: number; referring_domains: number; dofollow_pct: number; avg_domain_rating: number }

interface Props {
  issues: SeoIssue[]
  keywords: SeoKeyword[]
  recommendations: SeoReco[]
  backlinkSummary: BacklinkSummary
  rankHistory: number[]
  latestRunDate: string
}

function fmtNum(v: number) { return v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? (v/1e3).toFixed(1)+'K' : v.toString() }
function fmtShort(v: number) { return v >= 1e3 ? (v/1e3).toFixed(0)+'K' : v.toString() }

function RankChart({ history }: { history: number[] }) {
  const min = 1, max = 10
  const w = 320, h = 110, pl = 28, pr = 12, pt = 10, pb = 22
  const innerW = w - pl - pr, innerH = h - pt - pb
  const xAt = (i: number) => pl + (i / Math.max(1, history.length - 1)) * innerW
  const yAt = (v: number) => pt + ((v - min) / (max - min)) * innerH
  const d = history.map((v, i) => (i === 0 ? 'M' : 'L') + xAt(i) + ',' + yAt(v)).join(' ')
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {[1, 3, 5, 10].map((t) => (
        <g key={t}>
          <line x1={pl} x2={w - pr} y1={yAt(t)} y2={yAt(t)} stroke="rgba(255,255,255,0.04)" />
          <text x={pl - 6} y={yAt(t) + 3} fontSize="9" fill="#9aa2b0" textAnchor="end" fontFamily="JetBrains Mono">#{t}</text>
        </g>
      ))}
      <path d={d + ` L ${xAt(history.length-1)},${yAt(max)} L ${xAt(0)},${yAt(max)} Z`} fill="var(--down)" opacity="0.08" />
      <path d={d} fill="none" stroke="var(--down)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 6px #ef444450)' }} />
      <circle cx={xAt(history.length-1)} cy={yAt(history[history.length-1])} r="3.5"
        fill="var(--down)" stroke="#0a0d12" strokeWidth="1.5" />
    </svg>
  )
}

function Row2({ k, v, color = 'var(--fg)' }: { k: string; v: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line-2)', fontSize: 12.5 }}>
      <span style={{ color: 'var(--fg-3)' }}>{k}</span>
      <span className="mono" style={{ color, fontWeight: 600 }}>{v}</span>
    </div>
  )
}

export default function SeoDashboardClient({ issues, keywords, recommendations, backlinkSummary, rankHistory, latestRunDate }: Props) {
  const [sev, setSev] = useState('all')

  const filteredIssues = issues.filter((i) => sev === 'all' || i.severity === sev)
  const criticalCount = issues.filter((i) => i.severity === 'critical').length
  const warningCount  = issues.filter((i) => i.severity === 'warning').length

  const prioColor = (p: string) => p === 'critical' ? 'var(--red)' : p === 'high' ? 'var(--warn)' : 'var(--fg-4)'
  const prioLabel = (p: string) => p.toUpperCase().slice(0, 1)

  let runDate = 'latest run'
  try { runDate = format(new Date(latestRunDate), 'dd MMM yyyy · HH:mm') } catch { /* fallback */ }

  return (
    <div>
      <header className="page-head">
        <div>
          <div className="eyebrow">
            <span className="live-pulse-dot" />
            SEO · LATEST RUN
          </div>
          <h1>SEARCH <em>HEALTH</em></h1>
          <div className="sub">
            Technical issues, keyword positions, backlinks, and AI-prioritized recommendations for <span className="mono" style={{ color: 'var(--yellow)' }}>joola.com</span>.
          </div>
        </div>
        <div className="head-actions">
          <span className="pill pill-green">✓ RUN COMPLETE</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>{runDate}</span>
          <a href="/seo-analyze" className="btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
              <path d="M3 12a9 9 0 015-8l3 3" /><path d="M21 12a9 9 0 01-5 8l-3-3" /><path d="M11 7H8V4" /><path d="M13 17h3v3" />
            </svg>
            Re-run
          </a>
        </div>
      </header>

      {/* KPIs */}
      <div className="section">
        <div className="kpi-grid">
          <KpiCard variant="danger" label="ISSUES DETECTED" src={`${criticalCount} critical · ${warningCount} warning`}
            value={issues.length}
            trend={[58,56,54,54,52,52,50,50,52,51,50,50,issues.length]}
            delta="▼ -8 this wk" dir="up" />
          <KpiCard label="GSC CLICKS" src="last 28 days" value={184000}
            trend={[200,210,215,212,208,205,200,196,194,190,188,186,184].map((v)=>v*1000)}
            delta="▼ -1.1%" dir="down" />
          <KpiCard variant="joola" label="IMPRESSIONS" src="last 28 days" value={4824000}
            trend={[4400,4520,4600,4640,4680,4720,4760,4780,4790,4800,4810,4820,4824].map((v)=>v*1000)}
            delta="▲ +9.2%" dir="up" />
          <KpiCard variant="warn" label="AVG POSITION" src="all tracked queries" value={8.4}
            trend={[6.2,6.4,6.8,7.0,7.2,7.4,7.6,7.8,7.9,8.0,8.1,8.3,8.4]}
            delta="▼ -0.8" dir="down" />
        </div>
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <KpiCard label="CTR" src="clicks ÷ impressions" value={3.82} unit="%"
            trend={[4.2,4.1,4.05,4.0,3.95,3.95,3.92,3.9,3.88,3.86,3.84,3.83,3.82]}
            delta="▼ -0.38pp" dir="down" />
          <KpiCard label="BACKLINKS" src={`${fmtNum(backlinkSummary.referring_domains)} ref domains`}
            value={backlinkSummary.total_backlinks}
            trend={[22000,22400,22800,23100,23400,23700,24000,24200,24400,24600,24700,24780,24820]}
            delta="▲ +1.2%" dir="up" />
          <KpiCard variant="joola" label="KEYWORD COVERAGE" src="ranked / target" value="312 / 421"
            trend={[280,285,290,295,298,300,302,305,308,310,311,312,312]}
            delta="▲ +18" dir="up" />
        </div>
      </div>

      {/* AI recos + rank chart */}
      <div className="section">
        <div className="card-grid cg-2-1">
          <div className="card card-pad-lg">
            <div className="card-head">
              <h3>★ AI RECOMMENDATIONS</h3>
              <span className="meta">GPT-4o · ranked by impact</span>
            </div>
            {recommendations.map((r, i) => (
              <div className="reco" key={i}>
                <div className="reco-prio" style={{ background: prioColor(r.priority) + '22', color: prioColor(r.priority), border: `1px solid ${prioColor(r.priority)}55` }}>
                  {prioLabel(r.priority)}
                </div>
                <div className="reco-body">
                  <div className="title">{r.title}</div>
                  <div className="desc">{r.description}</div>
                  <div className="tags">
                    {r.tags.map((t) => <span key={t} className="pill pill-ghost">{t}</span>)}
                  </div>
                </div>
                <button className="btn btn-sm">View →</button>
              </div>
            ))}
          </div>
          <div>
            <div className="card card-pad-lg" style={{ marginBottom: 14 }}>
              <div className="card-head">
                <h3>RANK · &lsquo;pickleball paddles&rsquo;</h3>
                <span className="meta">13 wk · GSC</span>
              </div>
              <RankChart history={rankHistory} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11.5 }}>
                <span style={{ color: 'var(--fg-3)' }}>Current</span>
                <span className="mono" style={{ color: 'var(--down)', fontWeight: 700 }}>
                  position {rankHistory[rankHistory.length - 1]}
                </span>
              </div>
            </div>
            <div className="card card-pad-lg">
              <div className="card-head">
                <h3>BACKLINK PROFILE</h3>
                <span className="meta">DataForSEO</span>
              </div>
              <Row2 k="Total backlinks"    v={fmtNum(backlinkSummary.total_backlinks)} />
              <Row2 k="Referring domains"  v={fmtNum(backlinkSummary.referring_domains)} />
              <Row2 k="Dofollow"           v={backlinkSummary.dofollow_pct + '%'} color="var(--joola)" />
              <Row2 k="Nofollow"           v={(100 - backlinkSummary.dofollow_pct) + '%'} color="var(--fg-3)" />
              <Row2 k="Authority (avg DR)" v={String(backlinkSummary.avg_domain_rating)} color="var(--yellow)" />
            </div>
          </div>
        </div>
      </div>

      {/* Issues + keywords */}
      <div className="section">
        <div className="card-grid cg-2">
          <div className="card card-pad-lg">
            <div className="card-head">
              <h3>TECHNICAL ISSUES</h3>
              <div className="chip-row">
                <button className={'chip ' + (sev === 'all' ? 'on' : '')} onClick={() => setSev('all')}>All ({issues.length})</button>
                <button className={'chip ' + (sev === 'critical' ? 'on' : '')} onClick={() => setSev('critical')}>Critical ({criticalCount})</button>
                <button className={'chip ' + (sev === 'warning' ? 'on' : '')} onClick={() => setSev('warning')}>Warning ({warningCount})</button>
              </div>
            </div>
            {filteredIssues.map((issue, idx) => (
              <div className="issue-row" key={issue.id ?? idx}>
                <span className={'pill ' + (issue.severity === 'critical' ? 'pill-red' : issue.severity === 'warning' ? 'pill-amber' : 'pill-info')}>
                  {issue.severity === 'critical' && '⚠ '}{issue.severity?.toUpperCase()}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 2 }}>{issue.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-4)' }}>{issue.description}</div>
                </div>
                <span style={{ fontSize: 10.5, color: 'var(--fg-4)' }}>{issue.category}</span>
              </div>
            ))}
            {filteredIssues.length === 0 && <div className="empty">No issues in this category.</div>}
          </div>

          <div className="card card-pad-lg">
            <div className="card-head">
              <h3>KEYWORD OPPORTUNITIES</h3>
              <span className="meta">ranked + gaps</span>
            </div>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>KEYWORD</th>
                    <th className="num">VOL</th>
                    <th className="num">KD</th>
                    <th className="num">POS</th>
                    <th>Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((k) => {
                    const delta = k.position != null && k.previous_position != null
                      ? k.previous_position - k.position : null
                    return (
                      <tr key={k.id} className={k.position === 1 ? 'highlight' : ''}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="mono" style={{ fontSize: 11.5 }}>{k.keyword}</span>
                            {k.is_gap && <span className="pill pill-yellow">GAP</span>}
                          </div>
                        </td>
                        <td className="cell-num">{fmtShort(k.search_volume)}</td>
                        <td className="cell-num">{k.difficulty}</td>
                        <td className="cell-num">{k.position ?? '—'}</td>
                        <td className="cell-num">
                          {delta == null
                            ? <span style={{ color: 'var(--fg-4)' }}>—</span>
                            : delta > 0
                              ? <span style={{ color: 'var(--joola)' }}>▲ +{delta}</span>
                              : delta < 0
                                ? <span style={{ color: 'var(--down)' }}>▼ {delta}</span>
                                : <span style={{ color: 'var(--fg-4)' }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* GSC panel */}
      <div className="section">
        <div className="card card-pad-lg">
          <div className="card-head">
            <h3>GOOGLE SEARCH CONSOLE</h3>
            <span className="meta">last 28 days vs prior period</span>
          </div>
          <div className="card-grid cg-3" style={{ gap: 18 }}>
            {[
              { k: 'Top query',       v: 'ben johns paddle',    detail: '33.1k impressions · pos 1' },
              { k: 'Top page',        v: '/products/perseus-pro-v', detail: '184k impressions · 4.2% CTR' },
              { k: 'Biggest mover',   v: 'pickleball ball',     detail: 'pos 14 (was 22) · +482% clicks' },
            ].map((b) => (
              <div key={b.k} style={{ padding: 16, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 8 }}>
                <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>{b.k}</div>
                <div style={{ fontFamily: 'Archivo Black', fontSize: 18, color: 'var(--fg)', marginBottom: 6, wordBreak: 'break-all' }}>{b.v}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{b.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
