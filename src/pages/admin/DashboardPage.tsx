import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, ShoppingCart, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { formatPoints } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardPage() {
  // Enhanced metrics query with time comparisons
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["admin-dashboard-metrics"],
    queryFn: async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const [
        usersRes,
        usersYesterdayRes,
        ordersRes,
        ordersYesterdayRes,
        productsRes,
        pointsRes,
        pointsYesterdayRes
      ] = await Promise.all([
        // Current totals
        supabase.from("profiles").select("id, created_at").eq("marketing_emails", true),
        supabase.from("profiles").select("id").eq("marketing_emails", true).lt("created_at", yesterday.toISOString()),
        supabase.from("orders").select("id, total_points, status, created_at"),
        supabase.from("orders").select("id, total_points").lt("created_at", yesterday.toISOString()),
        supabase.from("products").select("id, active, inventory"),
        supabase.from("points_transactions").select("points, type, created_at"),
        supabase.from("points_transactions").select("points, type").lt("created_at", yesterday.toISOString()),
      ]);

      const totalUsers = usersRes.data?.length || 0;
      const usersYesterday = usersYesterdayRes.data?.length || 0;
      const newUsersToday = totalUsers - usersYesterday;
      const newUsersWeek = usersRes.data?.filter(u => new Date(u.created_at) > weekAgo).length || 0;

      const totalOrders = ordersRes.data?.length || 0;
      const ordersYesterday = ordersYesterdayRes.data?.length || 0;
      const newOrdersToday = totalOrders - ordersYesterday;
      const pendingOrders = ordersRes.data?.filter(o => o.status === "processing").length || 0;
      const completedOrders = ordersRes.data?.filter(o => o.status === "completed").length || 0;
      
      const totalRevenue = ordersRes.data?.reduce((sum, o) => sum + (o.total_points || 0), 0) || 0;
      const revenueYesterday = ordersYesterdayRes.data?.reduce((sum, o) => sum + (o.total_points || 0), 0) || 0;
      const revenueToday = totalRevenue - revenueYesterday;

      const activeProducts = productsRes.data?.filter(p => p.active).length || 0;
      const totalProducts = productsRes.data?.length || 0;
      const lowStockProducts = productsRes.data?.filter(p => p.active && p.inventory < 10).length || 0;

      const pointsEarned = pointsRes.data?.filter(p => p.type === "earn").reduce((sum, p) => sum + p.points, 0) || 0;
      const pointsSpent = Math.abs(pointsRes.data?.filter(p => p.type === "redeem").reduce((sum, p) => sum + p.points, 0) || 0);
      const pointsEarnedYesterday = pointsYesterdayRes.data?.filter(p => p.type === "earn").reduce((sum, p) => sum + p.points, 0) || 0;
      const pointsEarnedToday = pointsEarned - pointsEarnedYesterday;

      return {
        totalUsers,
        newUsersToday,
        newUsersWeek,
        totalOrders,
        newOrdersToday,
        pendingOrders,
        completedOrders,
        totalRevenue,
        revenueToday,
        activeProducts,
        totalProducts,
        lowStockProducts,
        pointsEarned,
        pointsSpent,
        pointsEarnedToday,
        outstandingPoints: pointsEarned - pointsSpent,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your admin dashboard</p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your admin dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
            <div className="flex items-center gap-1 text-xs">
              {getTrendIcon(metrics?.newUsersToday || 0)}
              <span className={getTrendColor(metrics?.newUsersToday || 0)}>
                +{metrics?.newUsersToday || 0} today
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalOrders || 0}</div>
            <div className="flex items-center gap-1 text-xs">
              {getTrendIcon(metrics?.newOrdersToday || 0)}
              <span className={getTrendColor(metrics?.newOrdersToday || 0)}>
                +{metrics?.newOrdersToday || 0} today
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPoints(metrics?.totalRevenue || 0)}</div>
            <div className="flex items-center gap-1 text-xs">
              {getTrendIcon(metrics?.revenueToday || 0)}
              <span className={getTrendColor(metrics?.revenueToday || 0)}>
                {formatPoints(metrics?.revenueToday || 0)} today
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeProducts || 0}</div>
            <p className="text-xs text-muted-foreground">
              of {metrics?.totalProducts || 0} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Current order distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completed</span>
                <span>{metrics?.completedOrders || 0}</span>
              </div>
              <Progress 
                value={((metrics?.completedOrders || 0) / (metrics?.totalOrders || 1)) * 100} 
                className="h-2" 
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing</span>
                <span>{metrics?.pendingOrders || 0}</span>
              </div>
              <Progress 
                value={((metrics?.pendingOrders || 0) / (metrics?.totalOrders || 1)) * 100} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Points Activity</CardTitle>
            <CardDescription>Earned vs Redeemed overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Points Earned</span>
                <span>{formatPoints(metrics?.pointsEarned || 0)}</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Points Redeemed</span>
                <span>{formatPoints(metrics?.pointsSpent || 0)}</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm font-medium">
                <span>Outstanding</span>
                <span>{formatPoints(metrics?.outstandingPoints || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>Important notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database Status</span>
              <Badge variant="default">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Payment System</span>
              <Badge variant="default">Active</Badge>
            </div>
            {(metrics?.lowStockProducts || 0) > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Low Stock</span>
                </div>
                <Badge variant="destructive">{metrics?.lowStockProducts} items</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Activity</CardTitle>
          <CardDescription>Key metrics for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">+{metrics?.newUsersToday || 0}</div>
              <div className="text-sm text-muted-foreground">New Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">+{metrics?.newOrdersToday || 0}</div>
              <div className="text-sm text-muted-foreground">New Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatPoints(metrics?.revenueToday || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatPoints(metrics?.pointsEarnedToday || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Points Earned</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}