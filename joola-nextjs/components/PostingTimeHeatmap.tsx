'use client'

interface HeatmapCell {
  day: string
  hour: number
  postCount: number
  avgEngagement: number
}

interface PostingTimeHeatmapProps {
  data: HeatmapCell[]
  title?: string
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_LABELS: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
}

function formatHourLabel(h: number) {
  if (h === 0) return '12a'
  if (h === 12) return '12p'
  return h < 12 ? `${h}a` : `${h - 12}p`
}

export default function PostingTimeHeatmap({ data, title }: PostingTimeHeatmapProps) {
  const byKey = new Map(data.map((d) => [`${d.day}-${d.hour}`, d]))
  const maxEngagement = data.reduce((m, d) => Math.max(m, d.avgEngagement), 0)

  // Pick the best slot to call out
  const bestCell = [...data]
    .filter((d) => d.postCount >= 2)
    .sort((a, b) => b.avgEngagement - a.avgEngagement)[0]

  return (
    <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5">
      {title && (
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {bestCell && (
            <p className="text-xs text-[#94a3b8]">
              Best slot:{' '}
              <span className="text-[#00d4ff] font-medium">
                {DAY_LABELS[bestCell.day] ?? bestCell.day} {formatHourLabel(bestCell.hour)}
              </span>{' '}
              <span className="text-[#64748b]">
                · {(bestCell.avgEngagement * 100).toFixed(2)}% avg engagement ({bestCell.postCount} posts)
              </span>
            </p>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-[44px_repeat(24,minmax(0,1fr))] gap-[2px] text-[10px] text-[#64748b] mb-1">
            <div></div>
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="text-center">
                {h % 3 === 0 ? formatHourLabel(h) : ''}
              </div>
            ))}
          </div>

          {DAY_ORDER.map((day) => (
            <div
              key={day}
              className="grid grid-cols-[44px_repeat(24,minmax(0,1fr))] gap-[2px] mb-[2px]"
            >
              <div className="text-[10px] text-[#94a3b8] flex items-center pr-1">
                {DAY_LABELS[day]}
              </div>
              {Array.from({ length: 24 }, (_, h) => {
                const cell = byKey.get(`${day}-${h}`)
                const intensity =
                  cell && maxEngagement > 0 ? cell.avgEngagement / maxEngagement : 0
                const bg = cell
                  ? `rgba(0, 212, 255, ${0.12 + intensity * 0.78})`
                  : 'rgba(30, 30, 46, 0.4)'
                const tooltip = cell
                  ? `${DAY_LABELS[day]} ${formatHourLabel(h)} · ${cell.postCount} post${cell.postCount === 1 ? '' : 's'} · ${(cell.avgEngagement * 100).toFixed(2)}% avg engagement`
                  : `${DAY_LABELS[day]} ${formatHourLabel(h)} · no posts`
                return (
                  <div
                    key={h}
                    className="aspect-square rounded-[3px] border border-[#1e1e2e]/50"
                    style={{ backgroundColor: bg }}
                    title={tooltip}
                  />
                )
              })}
            </div>
          ))}

          <div className="flex items-center gap-2 mt-3 text-[10px] text-[#64748b]">
            <span>Less engagement</span>
            <div className="flex gap-[2px]">
              {[0.12, 0.3, 0.5, 0.7, 0.9].map((i) => (
                <div
                  key={i}
                  className="w-4 h-3 rounded-[2px]"
                  style={{ backgroundColor: `rgba(0, 212, 255, ${i})` }}
                />
              ))}
            </div>
            <span>More engagement</span>
            <span className="ml-3">·</span>
            <span>Hover a cell for details</span>
          </div>
        </div>
      </div>
    </div>
  )
}
