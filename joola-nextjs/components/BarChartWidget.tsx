'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface BarChartWidgetProps {
  data: Record<string, unknown>[]
  xKey: string
  bars: { key: string; color: string; name?: string }[]
  title?: string
  height?: number
  horizontal?: boolean
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{name: string; value: number; color: string}>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a24] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs">
        <p className="text-[#94a3b8] mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: <span className="font-semibold">{p.value?.toLocaleString()}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function BarChartWidget({
  data,
  xKey,
  bars,
  title,
  height = 260,
  horizontal = false,
}: BarChartWidgetProps) {
  return (
    <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5">
      {title && <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        {horizontal ? (
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#1e1e2e' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey={xKey}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#1e1e2e' }}
              tickLine={false}
              width={130}
            />
            <Tooltip content={<CustomTooltip />} />
            {bars.map((b) => (
              <Bar key={b.key} dataKey={b.key} name={b.name || b.key} fill={b.color} radius={[0, 4, 4, 0]} />
            ))}
          </BarChart>
        ) : (
          <BarChart
            data={data}
            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
          >
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
            {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />}
            {bars.map((b) => (
              <Bar key={b.key} dataKey={b.key} name={b.name || b.key} fill={b.color} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
