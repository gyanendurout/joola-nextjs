import { supabase } from '@/lib/supabase'
import SeoDashboardClient from './SeoDashboardClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface SeoRun { id: string; run_date: string; status: string }
interface SeoIssue { id: string; run_id: string; issue_type: string; severity: string; title: string; description: string; url: string; category: string }
interface SeoKeyword { id: string; run_id: string; keyword: string; search_volume: number; difficulty: number; position: number; previous_position: number; is_gap: boolean }
interface SeoReco { title: string; description: string; priority: string; tags: string[] }
interface BacklinkSummary { total_backlinks: number; referring_domains: number; dofollow_pct: number; avg_domain_rating: number }

async function fetchSeoData() {
  // Try to fetch from Supabase SEO tables; fallback to mock on error
  try {
    const [
      { data: runs },
      { data: issues },
      { data: keywords },
    ] = await Promise.all([
      supabase.from('runs').select('id, run_date, status').order('run_date', { ascending: false }).limit(1).returns<SeoRun[]>(),
      supabase.from('issues').select('id, run_id, issue_type, severity, title, description, url, category').limit(30).returns<SeoIssue[]>(),
      supabase.from('domain_ranked_keywords').select('id, run_id, keyword, search_volume, difficulty, position, previous_position, is_gap').limit(20).returns<SeoKeyword[]>(),
    ])
    return { runs: runs ?? [], issues: issues ?? [], keywords: keywords ?? [] }
  } catch {
    return { runs: [], issues: [], keywords: [] }
  }
}

export default async function SeoDashboardPage() {
  const { runs, issues, keywords } = await fetchSeoData()

  const latestRun = runs[0]

  // Mock data for display when DB data is sparse
  const mockIssues: SeoIssue[] = issues.length > 0 ? issues : [
    { id: '1', run_id: '', issue_type: 'missing_meta', severity: 'critical', title: 'Missing meta descriptions', description: '14 pages lack meta descriptions — direct CTR impact.', url: '', category: 'On-Page' },
    { id: '2', run_id: '', issue_type: 'slow_lcp',     severity: 'critical', title: 'LCP > 4s on product pages', description: 'Core Web Vitals failure on 8 pages.', url: '', category: 'Performance' },
    { id: '3', run_id: '', issue_type: 'broken_links',  severity: 'warning',  title: '3 broken internal links', description: 'Return 404 and dilute crawl budget.', url: '', category: 'Technical' },
    { id: '4', run_id: '', issue_type: 'thin_content',  severity: 'warning',  title: 'Thin content on blog posts', description: '6 posts under 400 words — low ranking potential.', url: '', category: 'Content' },
    { id: '5', run_id: '', issue_type: 'dup_title',     severity: 'warning',  title: 'Duplicate title tags', description: '4 pages share identical titles.', url: '', category: 'On-Page' },
  ]

  const mockKeywords: SeoKeyword[] = keywords.length > 0 ? keywords : [
    { id: '1', run_id: '', keyword: 'ben johns paddle',       search_volume: 27100, difficulty: 62, position: 1,   previous_position: 1,  is_gap: false },
    { id: '2', run_id: '', keyword: 'pickleball paddles',     search_volume: 60500, difficulty: 78, position: 7,   previous_position: 9,  is_gap: false },
    { id: '3', run_id: '', keyword: 'joola perseus pro v',    search_volume: 4400,  difficulty: 31, position: 2,   previous_position: 4,  is_gap: false },
    { id: '4', run_id: '', keyword: 'best pickleball paddle', search_volume: 40500, difficulty: 82, position: 14,  previous_position: 17, is_gap: false },
    { id: '5', run_id: '', keyword: 'carbon pickleball',      search_volume: 9900,  difficulty: 55, position: null as unknown as number, previous_position: null as unknown as number, is_gap: true },
    { id: '6', run_id: '', keyword: 'pickleball ball',        search_volume: 8100,  difficulty: 48, position: 14,  previous_position: 22, is_gap: false },
  ]

  const mockRecos: SeoReco[] = [
    { title: 'Fix missing meta descriptions on 14 pages', description: 'Add unique, keyword-rich meta descriptions to all product and category pages. Estimated +12–18% CTR improvement.', priority: 'critical', tags: ['On-Page', 'CTR', 'Quick Win'] },
    { title: 'Create content hub for "pickleball paddles"', description: 'Publish a comprehensive buying guide targeting high-volume head term. Potential to rank top-5 in 60–90 days.', priority: 'high', tags: ['Content', 'Organic', 'Top Funnel'] },
    { title: 'Resolve LCP issues on product detail pages', description: 'Compress hero images and implement lazy loading. LCP < 2.5s required for good CWV score.', priority: 'high', tags: ['Performance', 'CWV', 'Ranking Signal'] },
    { title: 'Acquire 5 new DR 50+ backlinks', description: 'Target pickleball publications and sports media for outreach. Competitor analysis shows backlink gap of ~300 domains.', priority: 'medium', tags: ['Link Building', 'Authority', 'Off-Page'] },
  ]

  const backlinkSummary: BacklinkSummary = {
    total_backlinks: 24820,
    referring_domains: 2847,
    dofollow_pct: 68,
    avg_domain_rating: 48,
  }

  const rankHistory = [6.2, 6.4, 6.8, 7.0, 7.2, 7.4, 7.6, 7.8, 7.9, 8.0, 8.1, 8.3, 8.4]

  return (
    <SeoDashboardClient
      issues={mockIssues}
      keywords={mockKeywords}
      recommendations={mockRecos}
      backlinkSummary={backlinkSummary}
      rankHistory={rankHistory}
      latestRunDate={latestRun?.run_date ?? '2026-05-15T07:00:00'}
    />
  )
}
