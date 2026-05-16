'use client'

export interface DonutSlice {
  name: string
  pct: number
  n?: number
  color: string
}

interface DonutProps {
  data: DonutSlice[]
  size?: number
  thickness?: number
}

export function Donut({ data, size = 160, thickness = 28 }: DonutProps) {
  const total = data.reduce((s, d) => s + d.pct, 0) || 1
  const r = size / 2 - thickness / 2
  const c = size / 2
  const circumference = 2 * Math.PI * r
  let acc = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={thickness} />
      {data.map((d, i) => {
        const len = (d.pct / total) * circumference
        const off = -acc
        acc += len
        return (
          <circle key={i} cx={c} cy={c} r={r} fill="none"
            stroke={d.color} strokeWidth={thickness}
            strokeDasharray={`${len} ${circumference - len}`}
            strokeDashoffset={off}
            style={{ transition: 'stroke-dasharray 400ms ease' }}
          />
        )
      })}
    </svg>
  )
}

export function DonutLegend({ data }: { data: DonutSlice[] }) {
  return (
    <div className="donut-legend">
      {data.map((d, i) => (
        <div className="dl-row" key={i}>
          <span className="sw" style={{ background: d.color }} />
          <span className="nm">{d.name}</span>
          {d.n != null && <span className="vl">{d.n.toLocaleString()}</span>}
          <span className="pc">{d.pct.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}
