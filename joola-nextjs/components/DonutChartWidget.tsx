'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface DonutChartWidgetProps {
  data: { name: string; value: number }[]
  colors?: string[]
  colorMap?: Record<string, string>
  title?: string
  height?: number
}

const DEFAULT_COLORS = [
  '#00d4ff',
  '#1a5cff',
  '#a855f7',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#64748b',
  '#f97316',
]

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{name: string; value: number; payload: {percent: number}}> }) => {
  if (active && payload && payload.length) {
    const item = payload[0]
    return (
      <div className="bg-[#1a1a24] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs">
        <p className="text-white font-medium">{item.name}</p>
        <p className="text-[#94a3b8]">
          {item.value.toLocaleString()} ({(item.payload.percent * 100).toFixed(1)}%)
        </p>
      </div>
    )
  }
  return null
}

export default function DonutChartWidget({
  data,
  colors = DEFAULT_COLORS,
  colorMap,
  title,
  height = 260,
}: DonutChartWidgetProps) {
  const resolveColor = (name: string, index: number) => {
    if (colorMap) {
      const hit = colorMap[name] ?? colorMap[name.toLowerCase()]
      if (hit) return hit
    }
    return colors[index % colors.length]
  }

  return (
    <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5">
      {title && <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={resolveColor(entry.name, index)} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
