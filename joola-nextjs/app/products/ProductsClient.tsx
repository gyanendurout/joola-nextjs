'use client'

import DataTable from '@/components/DataTable'
import BarChartWidget from '@/components/BarChartWidget'
import SentimentBadge from '@/components/SentimentBadge'
import type { IgProductMention, IgAthleteMention } from '@/lib/types'

const productColumns = [
  {
    key: 'product_name',
    header: 'Product',
    sortable: true,
    render: (row: Record<string, unknown>) => (
      <span className="font-medium text-white whitespace-nowrap">{String(row.product_name || '—')}</span>
    ),
  },
  {
    key: 'source',
    header: 'Source',
    sortable: true,
    render: (row: Record<string, unknown>) => (
      <span className="text-xs text-[#94a3b8] bg-[#1e1e2e] px-2 py-0.5 rounded-md capitalize whitespace-nowrap">
        {String(row.source || '—')}
      </span>
    ),
  },
  {
    key: 'mention_context',
    header: 'Context',
    render: (row: Record<string, unknown>) => (
      <span className="text-[#94a3b8] text-xs leading-relaxed">{String(row.mention_context || '')}</span>
    ),
  },
  {
    key: 'sentiment',
    header: 'Sentiment',
    sortable: true,
    render: (row: Record<string, unknown>) => <SentimentBadge value={String(row.sentiment || '')} />,
  },
]

const athleteColumns = [
  {
    key: 'athlete_name',
    header: 'Athlete',
    sortable: true,
    render: (row: Record<string, unknown>) => (
      <span className="font-medium text-white whitespace-nowrap">{String(row.athlete_name || '—')}</span>
    ),
  },
  {
    key: 'source',
    header: 'Source',
    sortable: true,
    render: (row: Record<string, unknown>) => (
      <span className="text-xs text-[#94a3b8] bg-[#1e1e2e] px-2 py-0.5 rounded-md capitalize whitespace-nowrap">
        {String(row.source || '—')}
      </span>
    ),
  },
  {
    key: 'sentiment',
    header: 'Sentiment',
    sortable: true,
    render: (row: Record<string, unknown>) => <SentimentBadge value={String(row.sentiment || '')} />,
  },
]

interface ProductsClientProps {
  products: IgProductMention[]
  athletes: IgAthleteMention[]
  productChartData: { name: string; count: number }[]
  athleteChartData: { name: string; count: number }[]
}

export default function ProductsClient({
  products,
  athletes,
  productChartData,
  athleteChartData,
}: ProductsClientProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Products & Athletes</h1>
        <p className="text-sm text-[#94a3b8] mt-1">
          {products.length} product mentions · {athletes.length} athlete mentions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChartWidget
          title="Top 10 Product Mentions"
          data={productChartData}
          xKey="name"
          bars={[{ key: 'count', color: '#00d4ff', name: 'Mentions' }]}
          height={300}
          horizontal={productChartData.length > 3}
        />
        <BarChartWidget
          title="Top 10 Athlete Mentions"
          data={athleteChartData}
          xKey="name"
          bars={[{ key: 'count', color: '#1a5cff', name: 'Mentions' }]}
          height={300}
          horizontal={athleteChartData.length > 3}
        />
      </div>

      <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Product Mentions ({products.length})</h3>
        <DataTable
          data={products as unknown as Record<string, unknown>[]}
          columns={productColumns}
          pageSize={20}
          emptyMessage="No product mentions found"
        />
      </div>

      <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Athlete Mentions ({athletes.length})</h3>
        <DataTable
          data={athletes as unknown as Record<string, unknown>[]}
          columns={athleteColumns}
          pageSize={20}
          emptyMessage="No athlete mentions found"
        />
      </div>
    </div>
  )
}
