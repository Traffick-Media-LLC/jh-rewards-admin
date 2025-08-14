import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "react-day-picker";
import { subDays, format, eachDayOfInterval, parseISO } from "date-fns";

interface AnalyticsParams {
  dateRange?: DateRange;
  refreshInterval?: number;
}

export const useAnalyticsData = ({ dateRange, refreshInterval = 30000 }: AnalyticsParams = {}) => {
  // Default date range: last 30 days
  const defaultDateRange = {
    from: subDays(new Date(), 30),
    to: new Date(),
  };

  const effectiveDateRange = dateRange || defaultDateRange;

  return useQuery({
    queryKey: ["analytics-data", effectiveDateRange],
    queryFn: async () => {
      const fromDate = effectiveDateRange.from?.toISOString();
      const toDate = effectiveDateRange.to?.toISOString();

      // Fetch all data in parallel
      const [
        usersRes,
        ordersRes,
        productsRes,
        pointsRes,
        profilesRes
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, created_at")
          .gte("created_at", fromDate)
          .lte("created_at", toDate),
        
        supabase
          .from("orders")
          .select("id, total_points, status, created_at, items")
          .gte("created_at", fromDate)
          .lte("created_at", toDate),
        
        supabase
          .from("products")
          .select("id, name, active, inventory, price_cents"),
        
        supabase
          .from("points_transactions")
          .select("points, type, created_at")
          .gte("created_at", fromDate)
          .lte("created_at", toDate),
        
        supabase
          .from("profiles")
          .select("id, created_at")
      ]);

      if (usersRes.error) throw usersRes.error;
      if (ordersRes.error) throw ordersRes.error;
      if (productsRes.error) throw productsRes.error;
      if (pointsRes.error) throw pointsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      // Process data for charts
      const dateInterval = eachDayOfInterval({
        start: effectiveDateRange.from || subDays(new Date(), 30),
        end: effectiveDateRange.to || new Date(),
      });

      // Revenue chart data
      const revenueData = dateInterval.map(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayOrders = ordersRes.data.filter(order => 
          format(parseISO(order.created_at), "yyyy-MM-dd") === dateStr
        );
        
        return {
          date: format(date, "MMM dd"),
          revenue: dayOrders.reduce((sum, order) => sum + (order.total_points || 0), 0),
          orders: dayOrders.length,
        };
      });

      // User growth data
      let cumulativeUsers = profilesRes.data.filter(profile => 
        parseISO(profile.created_at) < (effectiveDateRange.from || subDays(new Date(), 30))
      ).length;

      const userGrowthData = dateInterval.map(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        const newUsers = usersRes.data.filter(user => 
          format(parseISO(user.created_at), "yyyy-MM-dd") === dateStr
        ).length;
        
        cumulativeUsers += newUsers;
        
        return {
          date: format(date, "MMM dd"),
          totalUsers: cumulativeUsers,
          newUsers,
        };
      });

      // Order status data
      const ordersByStatus = ordersRes.data.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalOrders = ordersRes.data.length;
      const orderStatusData = Object.entries(ordersByStatus).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: Math.round((count / totalOrders) * 100),
      }));

      // Points activity data
      const pointsActivityData = dateInterval.map(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayPoints = pointsRes.data.filter(point => 
          format(parseISO(point.created_at), "yyyy-MM-dd") === dateStr
        );
        
        const earned = dayPoints
          .filter(p => p.type === "earn")
          .reduce((sum, p) => sum + p.points, 0);
        
        const redeemed = Math.abs(dayPoints
          .filter(p => p.type === "redeem")
          .reduce((sum, p) => sum + p.points, 0));
        
        return {
          date: format(date, "MMM dd"),
          earned,
          redeemed,
        };
      });

      // Top products data (mock data - would need order items analysis)
      const topProductsData = productsRes.data
        .filter(p => p.active)
        .slice(0, 5)
        .map(product => ({
          name: product.name.length > 20 ? product.name.substring(0, 20) + "..." : product.name,
          revenue: Math.floor(Math.random() * 50000) + 10000, // Mock data
          quantity: Math.floor(Math.random() * 100) + 10, // Mock data
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // Calculate key metrics
      const totalRevenue = ordersRes.data.reduce((sum, order) => sum + (order.total_points || 0), 0);
      const totalUsers = profilesRes.data.length;
      const newUsers = usersRes.data.length;
      const totalOrdersCount = ordersRes.data.length;
      const activeProducts = productsRes.data.filter(p => p.active).length;
      const lowStockProducts = productsRes.data.filter(p => p.active && p.inventory < 10).length;
      
      const pointsEarned = pointsRes.data
        .filter(p => p.type === "earn")
        .reduce((sum, p) => sum + p.points, 0);
      
      const pointsRedeemed = Math.abs(pointsRes.data
        .filter(p => p.type === "redeem")
        .reduce((sum, p) => sum + p.points, 0));

      return {
        // Chart data
        revenueData,
        userGrowthData,
        orderStatusData,
        pointsActivityData,
        topProductsData,
        
        // Key metrics
        metrics: {
          totalRevenue,
          totalUsers,
          newUsers,
          totalOrders: totalOrdersCount,
          activeProducts,
          lowStockProducts,
          pointsEarned,
          pointsRedeemed,
          outstandingPoints: pointsEarned - pointsRedeemed,
          averageOrderValue: totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0,
        },
      };
    },
    refetchInterval: refreshInterval,
  });
};