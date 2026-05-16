'use client'

import { useState, useEffect, useRef } from 'react'

interface PipelineStep {
  n: number
  label: string
  meta?: string
}

const PIPELINE: PipelineStep[] = [
  { n: 1,  label: 'DNS + HTTP fetch',         meta: 'crawl4ai · headless' },
  { n: 2,  label: 'HTML parse & extract',      meta: 'BeautifulSoup' },
  { n: 3,  label: 'Technical issue scan',      meta: 'custom ruleset' },
  { n: 4,  label: 'Keyword extraction',        meta: 'DataForSEO NLP' },
  { n: 5,  label: 'SERP position lookup',      meta: 'DataForSEO SERP' },
  { n: 6,  label: 'Competitor gap analysis',   meta: 'DataForSEO' },
  { n: 7,  label: 'Backlink profile',          meta: 'DataForSEO Backlinks' },
  { n: 8,  label: 'GSC data pull',             meta: 'Google Search Console API' },
  { n: 9,  label: 'AI recommendation engine',  meta: 'GPT-4o' },
  { n: 10, label: 'Report generation',         meta: 'persist to Supabase' },
]

type StepStatus = 'pending' | 'running' | 'done' | 'error'

interface Run {
  id: string
  started: string
  duration: string
  issues: number
  keywords: number
  avgPos: number
  status: 'complete' | 'partial' | 'failed'
}

const PAST_RUNS: Run[] = [
  { id: 'run_2026-05-15', started: 'Today 07:00', duration: '4m 28s', issues: 50, keywords: 421, avgPos: 8.4, status: 'complete' },
  { id: 'run_2026-05-08', started: 'May 8 · 07:00', duration: '4m 12s', issues: 47, keywords: 418, avgPos: 7.6, status: 'complete' },
  { id: 'run_2026-05-01', started: 'May 1 · 07:00', duration: '3m 58s', issues: 52, keywords: 412, avgPos: 7.4, status: 'complete' },
  { id: 'run_2026-04-24', started: 'Apr 24 · 07:00', duration: '4m 02s', issues: 54, keywords: 408, avgPos: 6.8, status: 'complete' },
  { id: 'run_2026-04-17', started: 'Apr 17 · 07:00', duration: '4m 18s', issues: 58, keywords: 401, avgPos: 6.4, status: 'partial' },
]

function SSEDots() {
  return <span style={{ color: 'var(--yellow)', fontFamily: 'JetBrains Mono', letterSpacing: 4 }}>● ● ●</span>
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function SeoAnalyzePage() {
  const [url, setUrl] = useState('joola.com')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(6)
  const [runId, setRunId] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  function startDemo() {
    setRunning(true)
    setProgress(0)
    let i = 0
    const tick = () => {
      i++
      setProgress(i)
      if (i < PIPELINE.length) setTimeout(tick, 1100)
      else setRunning(false)
    }
    setTimeout(tick, 800)
  }

  async function startRealRun() {
    try {
      const res = await fetch('/seo-api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) throw new Error('API unavailable')
      const { run_id } = await res.json()
      setRunId(run_id)
      setRunning(true)
      setProgress(0)

      const es = new EventSource(`/seo-api/analyze/${run_id}/events`)
      eventSourceRef.current = es

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.step != null) setProgress(data.step)
          if (data.done) { setRunning(false); es.close() }
        } catch { /* ignore */ }
      }
      es.onerror = () => { setRunning(false); es.close() }
    } catch {
      startDemo()
    }
  }

  useEffect(() => {
    return () => { eventSourceRef.current?.close() }
  }, [])

  const steps = PIPELINE.map((s, i) => {
    let status: StepStatus = 'pending'
    if (i < progress) status = 'done'
    else if (i === progress && running) status = 'running'
    return { ...s, status }
  })

  const doneCount = steps.filter((s) => s.status === 'done').length
  const pct = Math.round((doneCount / PIPELINE.length) * 100)

  return (
    <div>
      <header className="page-head">
        <div>
          <div className="eyebrow">
            <span className="live-pulse-dot" />
            SEO · LIVE ANALYSIS PIPELINE
          </div>
          <h1>RUN <em>ANALYSIS</em></h1>
          <div className="sub">
            10-step automated crawl: fetch, parse, detect issues, research keywords, score SERP positions, generate AI recommendations.
          </div>
        </div>
        <div className="head-actions">
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>
            Last run: today 07:00 IST · {PAST_RUNS.length} total runs
          </span>
        </div>
      </header>

      {/* Run card */}
      <div className="section">
        <div className="card card-pad-lg">
          <div className="card-head">
            <h3>NEW ANALYSIS RUN</h3>
            <span className="meta">DataForSEO · OpenAI · GSC</span>
          </div>

          {/* URL input row */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 6, padding: '4px 4px 4px 14px', flex: 1, minWidth: 320 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 010 18" /><path d="M12 3a14 14 0 000 18" />
              </svg>
              <span className="mono" style={{ fontSize: 13, color: 'var(--fg-4)' }}>https://</span>
              <input
                className="fld"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={{ border: 0, background: 'transparent', flex: 1, padding: '8px 4px' }}
              />
              <button className="btn btn-yellow" onClick={startRealRun} disabled={running}>
                {running
                  ? '▶ Running…'
                  : <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                        <path d="M13 2L3 14h7l-1 8 11-12h-7l1-8z" />
                      </svg>
                      Run analysis
                    </>}
              </button>
            </div>
            <select className="fld">
              <option>US market · desktop</option>
              <option>US market · mobile</option>
              <option>Global · desktop</option>
            </select>
            <select className="fld">
              <option>Compare to last run</option>
              <option>Standalone</option>
            </select>
          </div>

          <div className="divider" />

          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)', letterSpacing: '0.06em' }}>PROGRESS</span>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: pct + '%', height: '100%', background: 'linear-gradient(90deg, var(--yellow), var(--yellow-deep))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)', transition: 'width 400ms ease' }} />
            </div>
            <span className="mono" style={{ fontSize: 12, color: 'var(--yellow)', fontWeight: 700 }}>{pct}%</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>{doneCount}/{PIPELINE.length} steps</span>
          </div>

          {/* Pipeline steps */}
          <div className="pipeline">
            {steps.map((s) => {
              const st = s.status as StepStatus
              return (
              <div className={'pipe-step ' + st} key={s.n}>
                <div className="pipe-num">
                  {st === 'done'    ? <CheckIcon /> :
                   st === 'running' ? <span className="live-pulse-dot" style={{ width: 6, height: 6, background: '#000' }} /> :
                   st === 'error'   ? '✗' :
                   s.n}
                </div>
                <div>
                  <div className="pipe-label">{s.label}</div>
                  {s.meta && <div className="pipe-meta">{s.meta}</div>}
                </div>
                <div className="pipe-meta">
                  {st === 'running' && <SSEDots />}
                  {st === 'done' && <span style={{ color: 'var(--fg-4)' }}>done</span>}
                </div>
                <span className={'pipe-status ' + (
                  st === 'done'    ? 'ps-done' :
                  st === 'running' ? 'ps-running' :
                  st === 'error'   ? 'ps-error' :
                  'ps-pending'
                )}>
                  {st}
                </span>
              </div>
            )})}

          </div>
        </div>
      </div>

      {/* Historical runs */}
      <div className="section">
        <div className="card card-pad-lg">
          <div className="card-head">
            <h3>HISTORICAL RUNS</h3>
            <span className="meta">{PAST_RUNS.length} runs · last 90 days</span>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>RUN</th>
                  <th>STARTED</th>
                  <th className="num">DURATION</th>
                  <th className="num">ISSUES</th>
                  <th className="num">KEYWORDS</th>
                  <th className="num">AVG POS</th>
                  <th>STATUS</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {PAST_RUNS.map((r, i) => (
                  <tr key={r.id} className={i === 0 ? 'highlight' : ''}>
                    <td className="mono" style={{ fontSize: 11 }}>
                      {r.id}{i === 0 && <span className="you-badge">LATEST</span>}
                    </td>
                    <td>{r.started}</td>
                    <td className="cell-num">{r.duration}</td>
                    <td className="cell-num" style={{ color: r.issues > 50 ? 'var(--warn)' : 'var(--fg)' }}>{r.issues}</td>
                    <td className="cell-num">{r.keywords}</td>
                    <td className="cell-num">{r.avgPos}</td>
                    <td>
                      {r.status === 'complete'
                        ? <span className="pill pill-green">✓ COMPLETE</span>
                        : <span className="pill pill-amber">PARTIAL</span>}
                    </td>
                    <td>
                      <a href="/seo-dashboard" className="tlink" style={{ fontSize: 11 }}>↗ open</a>
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
