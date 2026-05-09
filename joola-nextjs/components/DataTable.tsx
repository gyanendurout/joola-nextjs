'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react'

export interface Column {
  key: string
  header: string
  /** Optional JSX to replace the plain header text (e.g. to embed a tooltip) */
  headerNode?: React.ReactNode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (row: any, index?: number) => React.ReactNode
  className?: string
  sortable?: boolean
  // raw value extractor for sorting when render is used
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sortValue?: (row: any) => string | number
}

interface DataTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  columns: Column[]
  pageSize?: number
  emptyMessage?: string
  onSortChange?: (key: string | null, dir: SortDir) => void
}

type SortDir = 'asc' | 'desc'

export default function DataTable({
  data,
  columns,
  pageSize = 20,
  emptyMessage = 'No data available',
  onSortChange,
}: DataTableProps) {
  const [page, setPage] = useState(0)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // Reset to page 0 whenever the data set changes (e.g. filters applied)
  const prevDataRef = useRef(data)
  useEffect(() => {
    if (prevDataRef.current !== data) {
      prevDataRef.current = data
      setPage(0)
    }
  }, [data])

  const handleSort = (col: Column) => {
    if (!col.sortable) return
    let newKey = sortKey
    let newDir: SortDir = sortDir
    if (sortKey === col.key) {
      newDir = sortDir === 'asc' ? 'desc' : 'asc'
      setSortDir(newDir)
    } else {
      newKey = col.key
      newDir = 'asc'
      setSortKey(newKey)
      setSortDir('asc')
    }
    setPage(0)
    onSortChange?.(newKey, newDir)
  }

  const handleNext = () => setPage((p) => (p + 1 < totalPages ? p + 1 : p))
  const handlePrev = () => setPage((p) => Math.max(0, p - 1))

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const col = columns.find((c) => c.key === sortKey)
        const aVal = col?.sortValue ? col.sortValue(a) : (a[sortKey] ?? '')
        const bVal = col?.sortValue ? col.sortValue(b) : (b[sortKey] ?? '')
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal
        }
        return sortDir === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal))
      })
    : data

  const totalPages = Math.ceil(sorted.length / pageSize)
  const pageData = sorted.slice(page * pageSize, (page + 1) * pageSize)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-[#475569] text-sm">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border border-[#1e1e2e]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e1e2e] bg-[#0d0d14]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col)}
                  className={`px-4 py-3 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider ${col.className || ''} ${col.sortable ? 'cursor-pointer select-none hover:text-white transition-colors' : ''}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.headerNode ?? col.header}
                    {col.sortable && (
                      sortKey === col.key ? (
                        sortDir === 'asc'
                          ? <ChevronUp size={12} className="text-[#00d4ff]" />
                          : <ChevronDown size={12} className="text-[#00d4ff]" />
                      ) : (
                        <ChevronsUpDown size={12} className="text-[#475569]" />
                      )
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e1e2e]">
            {pageData.map((row, i) => (
              <tr
                key={i}
                className="hover:bg-white/[0.02] transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-[#e2e8f0] ${col.className || ''}`}
                  >
                    {col.render
                      ? col.render(row, page * pageSize + i)
                      : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-[#64748b]">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={page === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-[#94a3b8] bg-[#1e1e2e] rounded-md hover:bg-[#2a2a3e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={12} /> Prev
            </button>
            <span className="text-xs text-[#64748b]">{page + 1} / {totalPages}</span>
            <button
              type="button"
              onClick={handleNext}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-[#94a3b8] bg-[#1e1e2e] rounded-md hover:bg-[#2a2a3e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
