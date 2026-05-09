'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface LineChartWidgetProps {
  data: Record<string, unknown>[]
  xKey: string
  lines: { key: string; color: string; name?: string }[]
  title?: string
  height?: number
  yFormatter?: (v: number) => string
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{name: string; value: number; color: string}>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a24] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs">
        <p className="text-[#94a3b8] mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: <span className="font-semibold">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function LineChartWidget({
  data,
  xKey,
  lines,
  title,
  height = 260,
}: LineChartWidgetProps) {
  return (
    <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5">
      {title && <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#1e1e2e' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#1e1e2e' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />}
          {lines.map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.name || l.key}
              stroke={l.color}
              strokeWidth={2}
              dot={{ fill: l.color, r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
