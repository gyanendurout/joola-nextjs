'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import DataTable from '@/components/DataTable'
import BarChartWidget from '@/components/BarChartWidget'
import SentimentBadge from '@/components/SentimentBadge'
import type { IgComplaintLog, IgWishlistItem } from '@/lib/types'
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react'

type ComplaintWithUrl = IgComplaintLog & { post_url?: string }
type WishlistWithUrl = IgWishlistItem & { post_url?: string }

const complaintColumns = [
  {
    key: 'username',
    header: 'User',
    sortable: true,
    render: (row: Record<string, unknown>) => (
      <span className="font-medium text-white whitespace-nowrap">@{String(row.username || '')}</span>
    ),
  },
  {
    key: 'complaint_text',
    header: 'Complaint',
    render: (row: Record<string, unknown>) => (
      <span className="text-[#94a3b8] text-xs leading-relaxed">{String(row.complaint_text || '')}</span>
    ),
  },
  {
    key: 'complaint_category',
    header: 'Category',
    sortable: true,
    render: (row: Record<string, unknown>) => (
      <span className="text-xs text-[#94a3b8] bg-[#1e1e2e] px-2 py-0.5 rounded-md capitalize whitespace-nowrap">
        {String(row.complaint_category || '—')}
      </span>
    ),
  },
  {
    key: 'severity',
    header: 'Severity',
    sortable: true,
    render: (row: Record<string, unknown>) => <SentimentBadge value={String(row.severity || '')} />,
  },
  {
    key: 'joola_responded',
    header: 'Responded',
    sortable: true,
    sortValue: (row: Record<string, unknown>) => (row.joola_responded ? 1 : 0),
    render: (row: Record<string, unknown>) =>
      row.joola_responded ? (
        <CheckCircle size={16} className="text-emerald-400" />
      ) : (
        <XCircle size={16} className="text-red-400" />
      ),
  },
  {
    key: 'complained_at',
    header: 'Date',
    sortable: true,
    sortValue: (row: Record<string, unknown>) => row.complained_at ? new Date(String(row.complained_at)).getTime() : 0,
    render: (row: Record<string, unknown>) =>
      row.complained_at ? (
        <span className="whitespace-nowrap text-[#94a3b8] text-xs">
          {format(new Date(String(row.complained_at)), 'MMM d, yyyy')}
        </span>
      ) : '—',
  },
  {
    key: 'post_url',
    header: 'Post',
    render: (row: Record<string, unknown>) =>
      row.post_url ? (
        <a
          href={String(row.post_url)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00d4ff] hover:text-white transition-colors"
          title="View on Instagram"
        >
          <ExternalLink size={14} />
        </a>
      ) : (
        <span className="text-[#334155]">—</span>
      ),
  },
]

const wishlistColumns = [
  {
    key: 'username',
    header: 'User',
    sortable: true,
    render: (row: Record<string, unknown>) => (
      <span className="font-medium text-white whitespace-nowrap">@{String(row.username || '')}</span>
    ),
  },
  {
    key: 'wishlist_text',
    header: 'Request',
    render: (row: Record<string, unknown>) => (
      <span className="text-[#94a3b8] text-xs leading-relaxed">{String(row.wishlist_text || '')}</span>
    ),
  },
  {
    key: 'category',
    header: 'Category',
    sortable: true,
    render: (row: Record<string, unknown>) => (
      <span className="text-xs text-[#94a3b8] bg-[#1e1e2e] px-2 py-0.5 rounded-md capitalize whitespace-nowrap">
        {String(row.category || '—')}
      </span>
    ),
  },
  {
    key: 'requested_at',
    header: 'Date',
    sortable: true,
    sortValue: (row: Record<string, unknown>) => row.requested_at ? new Date(String(row.requested_at)).getTime() : 0,
    render: (row: Record<string, unknown>) =>
      row.requested_at ? (
        <span className="whitespace-nowrap text-[#94a3b8] text-xs">
          {format(new Date(String(row.requested_at)), 'MMM d, yyyy')}
        </span>
      ) : '—',
  },
  {
    key: 'post_url',
    header: 'Post',
    render: (row: Record<string, unknown>) =>
      row.post_url ? (
        <a
          href={String(row.post_url)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00d4ff] hover:text-white transition-colors"
          title="View on Instagram"
        >
          <ExternalLink size={14} />
        </a>
      ) : (
        <span className="text-[#334155]">—</span>
      ),
  },
]

interface ComplaintsClientProps {
  allComplaints: ComplaintWithUrl[]
  allWishlist: WishlistWithUrl[]
  categoryData: { name: string; count: number }[]
  categories: string[]
}

export default function ComplaintsClient({ allComplaints, allWishlist, categoryData, categories }: ComplaintsClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('')

  const filteredComplaints = useMemo(() => {
    if (!selectedCategory) return allComplaints
    return allComplaints.filter(
      (c) => (c.complaint_category || '').toLowerCase() === selectedCategory.toLowerCase()
    )
  }, [allComplaints, selectedCategory])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Complaints & Wishlist</h1>
        <p className="text-sm text-[#94a3b8] mt-1">
          {allComplaints.length} complaints · {allWishlist.length} wishlist items
        </p>
      </div>

      <BarChartWidget
        title="Complaints by Category"
        data={categoryData}
        xKey="name"
        bars={[{ key: 'count', color: '#f59e0b', name: 'Complaints' }]}
        height={260}
        horizontal={categoryData.length > 5}
      />

      {/* Complaints Table with category filter */}
      <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-white">
            Complaints ({filteredComplaints.length}{selectedCategory ? ` · ${selectedCategory}` : ''})
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748b]">Filter by category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-xs text-white focus:outline-none focus:border-[#00d4ff] transition-colors"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory('')}
                className="text-xs text-[#64748b] hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <DataTable
          data={filteredComplaints as unknown as Record<string, unknown>[]}
          columns={complaintColumns}
          pageSize={20}
          emptyMessage="No complaints found"
        />
      </div>

      {/* Wishlist Table */}
      <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Wishlist Items ({allWishlist.length})</h3>
        <DataTable
          data={allWishlist as unknown as Record<string, unknown>[]}
          columns={wishlistColumns}
          pageSize={20}
          emptyMessage="No wishlist items found"
        />
      </div>
    </div>
  )
}
