import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import KPICard from '@/components/KPICard'
import BarChartWidget from '@/components/BarChartWidget'
import LineChartWidget from '@/components/LineChartWidget'
import DonutChartWidget from '@/components/DonutChartWidget'
import PostingTimeHeatmap from '@/components/PostingTimeHeatmap'
import { formatNumber, formatEngagement } from '@/lib/utils'
import type { IgWeeklySnapshot, IgCommentAnalysis, IgPost, IgLoyalUser, IgComplaintLog } from '@/lib/types'
import { BarChart2, MessageCircle, TrendingUp, Users, Star, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OverviewPage() {
  // Fetch all data in parallel
  const [
    { data: posts },
    { data: comments },
    { data: commentAnalysis },
    { data: loyalUsers },
    { data: complaints },
    { data: weeklySnapshots },
  ] = await Promise.all([
    supabase.from('joola_ig_posts').select('post_id, engagement_rate, day_of_week, hour_of_day').returns<Pick<IgPost, 'post_id' | 'engagement_rate' | 'day_of_week' | 'hour_of_day'>[]>(),
    supabase.from('joola_ig_comments').select('comment_id, username').returns<{comment_id: string; username: string}[]>(),
    supabase.from('joola_ig_comment_analysis').select('sentiment').returns<Pick<IgCommentAnalysis, 'sentiment'>[]>(),
    supabase.from('joola_ig_loyal_users').select('username, loyalty_tier, is_potential_ambassador').returns<Pick<IgLoyalUser, 'username' | 'loyalty_tier' | 'is_potential_ambassador'>[]>(),
    supabase.from('joola_ig_complaint_log').select('comment_id, joola_responded').returns<Pick<IgComplaintLog, 'comment_id' | 'joola_responded'>[]>(),
    supabase.from('joola_ig_weekly_snapshot').select('*').order('week_start', { ascending: true }).limit(12).returns<IgWeeklySnapshot[]>(),
  ])

  // KPIs
  const totalPosts = posts?.length ?? 0
  const totalComments = comments?.length ?? 0
  const avgEngagement = posts && posts.length > 0
    ? posts.reduce((acc, p) => acc + (p.engagement_rate || 0), 0) / posts.length
    : 0
  const uniqueUsernames = new Set(comments?.map((c) => c.username) ?? [])
  const uniqueFans = uniqueUsernames.size
  const ambassadors = loyalUsers?.filter((u) => u.is_potential_ambassador).length ?? 0
  const totalComplaints = complaints?.length ?? 0
  const respondedComplaints = complaints?.filter((c) => c.joola_responded).length ?? 0
  const responseRate = totalComplaints > 0 ? (respondedComplaints / totalComplaints) * 100 : 0

  // Weekly chart data (last 12 weeks)
  const weeklyData = (weeklySnapshots ?? []).slice(-12).map((w) => ({
    week: format(new Date(w.week_start), 'MMM d'),
    posts_published: w.posts_published,
    avg_engagement_rate: w.avg_engagement_rate,
    positive: w.positive_comment_pct,
    negative: w.negative_comment_pct,
    neutral: w.neutral_comment_pct,
  }))

  // Sentiment distribution
  const sentimentCounts: Record<string, number> = {}
  for (const ca of commentAnalysis ?? []) {
    const s = (ca.sentiment || 'unknown').toLowerCase()
    sentimentCounts[s] = (sentimentCounts[s] || 0) + 1
  }
  const sentimentDonut = Object.entries(sentimentCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  // Post type breakdown - fetch separately
  const { data: postsWithType } = await supabase
    .from('joola_ig_posts')
    .select('post_type')
    .returns<{ post_type: string }[]>()

  const postTypeCounts: Record<string, number> = {}
  for (const p of postsWithType ?? []) {
    const t = (p.post_type || 'unknown').toLowerCase()
    postTypeCounts[t] = (postTypeCounts[t] || 0) + 1
  }
  const postTypeDonut = Object.entries(postTypeCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  // Posting-time heatmap: avg engagement by day-of-week × hour-of-day
  const cellTotals: Record<string, { sum: number; count: number }> = {}
  for (const p of posts ?? []) {
    if (!p.day_of_week || p.hour_of_day === null || p.hour_of_day === undefined) continue
    const key = `${p.day_of_week}-${p.hour_of_day}`
    if (!cellTotals[key]) cellTotals[key] = { sum: 0, count: 0 }
    cellTotals[key].sum += p.engagement_rate || 0
    cellTotals[key].count += 1
  }
  const heatmapData = Object.entries(cellTotals).map(([key, { sum, count }]) => {
    const sep = key.lastIndexOf('-')
    return {
      day: key.slice(0, sep),
      hour: parseInt(key.slice(sep + 1), 10),
      postCount: count,
      avgEngagement: count > 0 ? sum / count : 0,
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-sm text-[#94a3b8] mt-1">Instagram account intelligence summary</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Posts"
          value={formatNumber(totalPosts)}
          icon={<BarChart2 size={16} />}
          accent
        />
        <KPICard
          title="Total Comments"
          value={formatNumber(totalComments)}
          icon={<MessageCircle size={16} />}
        />
        <KPICard
          title="Avg Engagement"
          value={formatEngagement(avgEngagement)}
          subtitle="Across all posts"
          icon={<TrendingUp size={16} />}
          accent
        />
        <KPICard
          title="Unique Fans"
          value={formatNumber(uniqueFans)}
          icon={<Users size={16} />}
        />
        <KPICard
          title="Ambassadors"
          value={formatNumber(ambassadors)}
          subtitle="Potential ambassadors"
          icon={<Star size={16} />}
          accent
        />
        <KPICard
          title="Complaints"
          value={formatNumber(totalComplaints)}
          subtitle={totalComplaints > 0 ? `${responseRate.toFixed(0)}% responded` : 'None recorded'}
          icon={<AlertCircle size={16} />}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChartWidget
          title="Posts Published Weekly"
          data={weeklyData}
          xKey="week"
          bars={[{ key: 'posts_published', color: '#1a5cff', name: 'Posts' }]}
        />
        <LineChartWidget
          title="Engagement Rate Over Time"
          data={weeklyData}
          xKey="week"
          lines={[{ key: 'avg_engagement_rate', color: '#00d4ff', name: 'Engagement Rate' }]}
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DonutChartWidget
          title="Sentiment Distribution"
          data={sentimentDonut}
          colorMap={{
            positive: '#10b981',
            negative: '#ef4444',
            neutral: '#64748b',
            unknown: '#f59e0b',
          }}
        />
        <DonutChartWidget
          title="Post Type Breakdown"
          data={postTypeDonut}
          colors={['#00d4ff', '#1a5cff', '#a855f7', '#f97316']}
        />
      </div>

      {/* Posting-Time Heatmap */}
      <PostingTimeHeatmap
        title="Posting Time vs Engagement"
        data={heatmapData}
      />
    </div>
  )
}
