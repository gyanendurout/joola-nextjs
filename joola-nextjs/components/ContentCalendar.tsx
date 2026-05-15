'use client'

type DayData = {
  date: string
  avgEngagement: number
  postCount: number
}

interface ContentCalendarProps {
  title?: string
  data: DayData[]
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const NUM_WEEKS = 26

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function cellColor(avg: number, max: number) {
  if (avg <= 0) return '#1e1e2e'
  const t = Math.min(avg / max, 1)
  return `rgba(0, 212, 255, ${(0.15 + t * 0.85).toFixed(2)})`
}

export default function ContentCalendar({ title = 'Content Calendar', data }: ContentCalendarProps) {
  const dataMap = new Map(data.map((d) => [d.date, d]))
  const maxEng = Math.max(...data.map((d) => d.avgEngagement), 1)

  const today = new Date()
  const dow = today.getDay() // 0=Sun
  const toMon = dow === 0 ? 6 : dow - 1
  const lastMon = new Date(today)
  lastMon.setDate(today.getDate() - toMon)

  const start = new Date(lastMon)
  start.setDate(lastMon.getDate() - (NUM_WEEKS - 1) * 7)

  const weeks: Date[][] = Array.from({ length: NUM_WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (__, d) => {
      const dt = new Date(start)
      dt.setDate(start.getDate() + w * 7 + d)
      return dt
    })
  )

  const monthLabels: { weekIdx: number; label: string }[] = []
  weeks.forEach((week, i) => {
    if (week[0].getDate() <= 7) {
      monthLabels.push({ weekIdx: i, label: MONTHS[week[0].getMonth()] })
    }
  })

  const bestDay = data.reduce<DayData | null>(
    (best, d) => (!best || d.avgEngagement > best.avgEngagement ? d : best),
    null
  )

  return (
    <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1 min-w-max">
          {/* Month labels */}
          <div className="flex gap-1 ml-8">
            {weeks.map((_, i) => {
              const lbl = monthLabels.find((m) => m.weekIdx === i)
              return (
                <div key={i} className="w-3 text-center" style={{ fontSize: 9, color: '#475569' }}>
                  {lbl ? lbl.label : ''}
                </div>
              )
            })}
          </div>

          {DAYS.map((day, di) => (
            <div key={day} className="flex items-center gap-1">
              <span className="w-7 text-right pr-1" style={{ fontSize: 9, color: '#475569' }}>
                {day}
              </span>
              {weeks.map((week, wi) => {
                const dt = week[di]
                const iso = fmtDate(dt)
                const isFuture = dt > today
                if (isFuture) return <div key={wi} className="w-3 h-3 rounded-sm" />
                const entry = dataMap.get(iso)
                const bg = entry ? cellColor(entry.avgEngagement, maxEng) : '#1e1e2e'
                const tip = entry
                  ? `${iso}: ${entry.postCount} post${entry.postCount !== 1 ? 's' : ''}, avg ${entry.avgEngagement.toFixed(2)}%`
                  : `${iso}: no posts`
                return (
                  <div
                    key={wi}
                    className="w-3 h-3 rounded-sm cursor-default"
                    style={{ backgroundColor: bg }}
                    title={tip}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span style={{ fontSize: 10, color: '#475569' }}>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <div
            key={t}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: t === 0 ? '#1e1e2e' : `rgba(0, 212, 255, ${(0.15 + t * 0.85).toFixed(2)})` }}
          />
        ))}
        <span style={{ fontSize: 10, color: '#475569' }}>More engaged</span>
        {bestDay && (
          <span className="ml-auto" style={{ fontSize: 10, color: '#64748b' }}>
            Best day: <span style={{ color: '#00d4ff' }}>{bestDay.date}</span> ({bestDay.avgEngagement.toFixed(2)}%)
          </span>
        )}
      </div>
    </div>
  )
}
