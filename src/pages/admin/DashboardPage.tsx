import React, { useState } from "react";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { Users, UserCheck, Code, Target, TrendingUp, Award, AlertTriangle, BarChart3, Trophy } from "lucide-react";
import { formatPoints } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Analytics components
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { MetricCard } from "@/components/analytics/MetricCard";
import { UserEngagementChart } from "@/components/analytics/UserEngagementChart";
import { CodeSubmissionChart } from "@/components/analytics/CodeSubmissionChart";
import { PointsActivityChart } from "@/components/analytics/PointsActivityChart";
import { ConversionFunnelChart } from "@/components/analytics/ConversionFunnelChart";
import { TopUsersTable } from "@/components/analytics/TopUsersTable";
import { TopRedeemedItemsTable } from "@/components/analytics/TopRedeemedItemsTable";
import { useRewardsAnalytics } from "@/hooks/useRewardsAnalytics";

export function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const { data: rewardsData, isLoading } = useRewardsAnalytics({ 
    dateRange, 
    refreshInterval: 30000 
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rewards Analytics Dashboard</h1>
            <p className="text-muted-foreground">Track user engagement, code submissions, and reward redemptions</p>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-80" />
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = rewardsData?.metrics;

  return (
    <div className="space-y-6">
      {/* Header with Date Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Rewards Analytics Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Track user engagement, code submissions, and reward redemptions</p>
        </div>
        <DateRangePicker 
          date={dateRange} 
          onDateChange={setDateRange}
          className="w-full sm:w-auto"
        />
      </div>

      {/* User Engagement Metrics */}
      <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Members"
          value={metrics?.totalRewardsMembers || 0}
          icon={<Users className="h-4 w-4" />}
          changeLabel="Registered users"
          trend="neutral"
        />
        <MetricCard
          title="Active Members"
          value={metrics?.activeMembers || 0}
          icon={<UserCheck className="h-4 w-4" />}
          changeLabel="Recent activity"
          trend="up"
        />
        <MetricCard
          title="New Members"
          value={metrics?.newMembers || 0}
          icon={<TrendingUp className="h-4 w-4" />}
          changeLabel="This period"
          trend="up"
        />
        <MetricCard
          title="Code Submission Rate"
          value={`${metrics?.codeSubmissionRate || 0}%`}
          icon={<Target className="h-4 w-4" />}
          changeLabel="Of total members"
          trend="up"
        />
      </div>

      {/* Code & Points Flow Metrics */}
      <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Codes Submitted"
          value={metrics?.totalCodesSubmitted || 0}
          icon={<Code className="h-4 w-4" />}
          changeLabel="Total entries"
          trend="up"
        />
        <MetricCard
          title="Points Earned"
          value={formatPoints(metrics?.totalPointsEarned || 0)}
          icon={<Award className="h-4 w-4" />}
          changeLabel="From codes"
          trend="up"
        />
        <MetricCard
          title="Points Redeemed"
          value={formatPoints(metrics?.totalPointsRedeemed || 0)}
          icon={<Trophy className="h-4 w-4" />}
          changeLabel="For rewards"
          trend="up"
        />
        <MetricCard
          title="Outstanding Liability"
          value={formatPoints(metrics?.outstandingPointsLiability || 0)}
          icon={<AlertTriangle className="h-4 w-4" />}
          changeLabel="Unredeemed points"
          trend="neutral"
        />
      </div>

      {/* Redemption Metrics */}
      <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Redemptions"
          value={metrics?.totalRedemptions || 0}
          icon={<BarChart3 className="h-4 w-4" />}
          changeLabel="Completed orders"
          trend="up"
        />
        <MetricCard
          title="Avg Points per Redemption"
          value={formatPoints(metrics?.avgPointsPerRedemption || 0)}
          icon={<Target className="h-4 w-4" />}
          changeLabel="Per transaction"
          trend="neutral"
        />
        <MetricCard
          title="Redemption Rate"
          value={`${metrics?.redemptionRate || 0}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          changeLabel="Code users who redeem"
          trend="up"
        />
      </div>

      {/* Main Analytics Charts */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        <UserEngagementChart 
          data={rewardsData?.userEngagementData || []} 
          isLoading={isLoading}
        />
        <CodeSubmissionChart 
          data={rewardsData?.codeSubmissionData || []} 
          isLoading={isLoading}
        />
      </div>

      {/* Points Flow & Conversion */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        <PointsActivityChart 
          data={rewardsData?.pointsFlowData || []} 
          isLoading={isLoading}
        />
        <ConversionFunnelChart 
          data={rewardsData?.funnelData || { totalUsers: 0, codeSubmitters: 0, redeemers: 0 }} 
          isLoading={isLoading}
        />
      </div>

      {/* Data Tables */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        <TopUsersTable 
          data={rewardsData?.topUsers || []} 
          isLoading={isLoading}
        />
        <TopRedeemedItemsTable 
          data={rewardsData?.topRedeemedItems || []} 
          isLoading={isLoading}
        />
      </div>

    </div>
  );
}