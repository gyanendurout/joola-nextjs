'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { History, CheckCircle, Clock, FileText } from 'lucide-react'
import type { Draft } from '@/app/generate/types'

interface DraftHistoryProps {
  refreshKey: number
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25',
    approved: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
    posted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  }
  const icons: Record<string, React.ReactNode> = {
    draft: <Clock size={9} />,
    approved: <FileText size={9} />,
    posted: <CheckCircle size={9} />,
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border capitalize ${styles[status] || styles.draft}`}>
      {icons[status]}
      {status}
    </span>
  )
}

export default function DraftHistory({ refreshKey }: DraftHistoryProps) {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchDrafts = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await fetch('/api/drafts')
      const data = await resp.json() as { drafts: Draft[] }
      setDrafts(data.drafts || [])
    } catch {
      setDrafts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchDrafts()
  }, [refreshKey, fetchDrafts])

  const handleMarkPosted = async (id: string) => {
    await fetch('/api/drafts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'posted' }),
    })
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'posted' as const, posted_at: new Date().toISOString() } : d))
    )
  }

  return (
    <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <History size={15} className="text-[#64748b]" />
        <h3 className="text-sm font-semibold text-white">Draft History</h3>
        {drafts.length > 0 && (
          <span className="px-2 py-0.5 bg-[#1e1e2e] text-[#64748b] text-[10px] rounded-full ml-auto">
            {drafts.length} saved
          </span>
        )}
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-11 bg-[#0d0d14] rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!loading && drafts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-xs text-[#475569]">No drafts yet.</p>
          <p className="text-xs text-[#334155] mt-1">Generate a post and click <span className="text-[#64748b]">Save to Draft</span></p>
        </div>
      )}

      {!loading && drafts.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e2e]">
                {['Topic', 'Theme', 'Format', 'Status', 'Created', 'Engagement Est.', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-[10px] font-medium text-[#64748b] uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e2e]">
              {drafts.map((draft) => (
                <>
                  <tr
                    key={draft.id}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setExpanded(expanded === draft.id ? null : draft.id)}
                  >
                    <td className="px-3 py-2.5 text-xs text-white max-w-[180px]">
                      <span className="truncate block">{draft.topic}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[#94a3b8] whitespace-nowrap">{draft.theme}</td>
                    <td className="px-3 py-2.5 text-xs text-[#94a3b8] capitalize">{draft.format}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={draft.status} /></td>
                    <td className="px-3 py-2.5 text-xs text-[#64748b] whitespace-nowrap">
                      {format(new Date(draft.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[#94a3b8] whitespace-nowrap">
                      {draft.predicted_eng_min != null && draft.predicted_eng_max != null
                        ? `${draft.predicted_eng_min}% – ${draft.predicted_eng_max}%`
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpanded(expanded === draft.id ? null : draft.id) }}
                          className="px-2 py-1 text-[10px] text-[#00d4ff] bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 rounded border border-[#00d4ff]/15 transition-colors"
                        >
                          {expanded === draft.id ? 'Hide' : 'View'}
                        </button>
                        {draft.status !== 'posted' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); void handleMarkPosted(draft.id) }}
                            className="px-2 py-1 text-[10px] text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded border border-emerald-500/15 transition-colors whitespace-nowrap"
                          >
                            Mark Posted
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expanded === draft.id && (
                    <tr key={`${draft.id}-exp`} className="bg-[#0d0d14]">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1.5">Caption</p>
                            <p className="text-xs text-[#94a3b8] leading-relaxed whitespace-pre-wrap">{draft.caption}</p>
                          </div>
                          <div className="space-y-3">
                            {draft.best_day && (
                              <div>
                                <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1">Posting Recommendation</p>
                                <p className="text-xs text-white">{draft.best_day}</p>
                              </div>
                            )}
                            {draft.hashtags?.length > 0 && (
                              <div>
                                <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1.5">Hashtags</p>
                                <div className="flex flex-wrap gap-1">
                                  {(draft.hashtags || []).slice(0, 10).map((h) => (
                                    <span key={h} className="px-2 py-0.5 rounded-full border border-[#00d4ff]/20 text-[#00d4ff] text-[10px] font-mono">
                                      #{h}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {draft.why_this_works && (
                              <div>
                                <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1">Why This Works</p>
                                <p className="text-xs text-[#64748b] leading-relaxed">{draft.why_this_works}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
