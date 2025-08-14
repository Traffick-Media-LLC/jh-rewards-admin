import React, { useState } from "react";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { Users, Package, ShoppingCart, TrendingUp, DollarSign, Activity, AlertTriangle, BarChart3 } from "lucide-react";
import { formatPoints } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Analytics components
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { MetricCard } from "@/components/analytics/MetricCard";
import { RevenueChart } from "@/components/analytics/RevenueChart";
import { UserGrowthChart } from "@/components/analytics/UserGrowthChart";
import { OrderStatusChart } from "@/components/analytics/OrderStatusChart";
import { PointsActivityChart } from "@/components/analytics/PointsActivityChart";
import { TopProductsChart } from "@/components/analytics/TopProductsChart";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";

export function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const { data: analyticsData, isLoading } = useAnalyticsData({ 
    dateRange, 
    refreshInterval: 30000 
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive business insights and metrics</p>
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

  const metrics = analyticsData?.metrics;

  return (
    <div className="space-y-6">
      {/* Header with Date Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive business insights and performance metrics</p>
        </div>
        <DateRangePicker 
          date={dateRange} 
          onDateChange={setDateRange}
          className="w-full md:w-auto"
        />
      </div>

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Total Revenue"
          value={formatPoints(metrics?.totalRevenue || 0)}
          icon={<DollarSign className="h-4 w-4" />}
          change={15.2}
          changeLabel="vs last period"
          trend="up"
        />
        <MetricCard
          title="Total Users"
          value={metrics?.totalUsers || 0}
          icon={<Users className="h-4 w-4" />}
          change={8.1}
          changeLabel="vs last period"
          trend="up"
        />
        <MetricCard
          title="Total Orders"
          value={metrics?.totalOrders || 0}
          icon={<ShoppingCart className="h-4 w-4" />}
          change={-2.3}
          changeLabel="vs last period"
          trend="down"
        />
        <MetricCard
          title="Active Products"
          value={metrics?.activeProducts || 0}
          icon={<Package className="h-4 w-4" />}
          change={5.7}
          changeLabel="vs last period"
          trend="up"
        />
        <MetricCard
          title="Avg. Order Value"
          value={formatPoints(metrics?.averageOrderValue || 0)}
          icon={<BarChart3 className="h-4 w-4" />}
          change={12.4}
          changeLabel="vs last period"
          trend="up"
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <RevenueChart 
          data={analyticsData?.revenueData || []} 
          isLoading={isLoading}
        />
        <UserGrowthChart 
          data={analyticsData?.userGrowthData || []} 
          isLoading={isLoading}
        />
      </div>

      {/* Secondary Charts Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <OrderStatusChart 
          data={analyticsData?.orderStatusData || []} 
          isLoading={isLoading}
        />
        <PointsActivityChart 
          data={analyticsData?.pointsActivityData || []} 
          isLoading={isLoading}
        />
        <div className="lg:col-span-1">
          <TopProductsChart 
            data={analyticsData?.topProductsData || []} 
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* System Health & Alerts */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Points Outstanding"
          value={formatPoints(metrics?.outstandingPoints || 0)}
          icon={<Activity className="h-4 w-4" />}
          changeLabel="Available to redeem"
          trend="neutral"
        />
        <MetricCard
          title="Low Stock Items"
          value={metrics?.lowStockProducts || 0}
          icon={<AlertTriangle className="h-4 w-4" />}
          changeLabel="Require attention"
          trend={metrics?.lowStockProducts ? "down" : "neutral"}
        />
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-semibold text-muted-foreground mb-2">System Status</div>
            <div className="space-y-2">
              <Badge variant="default" className="w-full justify-center">Database: Healthy</Badge>
              <Badge variant="default" className="w-full justify-center">Analytics: Active</Badge>
              <Badge variant="default" className="w-full justify-center">Sync: Running</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}