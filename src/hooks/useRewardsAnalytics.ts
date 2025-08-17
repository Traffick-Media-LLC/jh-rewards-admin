import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "react-day-picker";
import { subDays, format, eachDayOfInterval, parseISO, startOfMonth, endOfMonth, differenceInDays } from "date-fns";

interface RewardsAnalyticsParams {
  dateRange?: DateRange;
  refreshInterval?: number;
}

export const useRewardsAnalytics = ({ dateRange, refreshInterval = 30000 }: RewardsAnalyticsParams = {}) => {
  const defaultDateRange = {
    from: subDays(new Date(), 30),
    to: new Date(),
  };

  const effectiveDateRange = dateRange || defaultDateRange;

  return useQuery({
    queryKey: ["rewards-analytics", effectiveDateRange],
    queryFn: async () => {
      const fromDate = effectiveDateRange.from?.toISOString();
      const toDate = effectiveDateRange.to?.toISOString();

      // Fetch all rewards-specific data
      const [
        codesRes,
        pointsRes,
        ordersRes,
        profilesRes,
        allProfilesRes
      ] = await Promise.all([
        supabase
          .from("redeemed_codes")
          .select("user_id, code, points_awarded, created_at")
          .gte("created_at", fromDate)
          .lte("created_at", toDate),
        
        supabase
          .from("points_transactions")
          .select("user_id, points, type, created_at, description, metadata")
          .gte("created_at", fromDate)
          .lte("created_at", toDate),
        
        supabase
          .from("orders")
          .select("id, user_id, total_points, status, created_at, items")
          .gte("created_at", fromDate)
          .lte("created_at", toDate),
        
        supabase
          .from("profiles")
          .select("id, created_at, points_balance")
          .gte("created_at", fromDate)
          .lte("created_at", toDate),
        
        supabase
          .from("profiles")
          .select("id, created_at, points_balance")
      ]);

      if (codesRes.error) throw codesRes.error;
      if (pointsRes.error) throw pointsRes.error;
      if (ordersRes.error) throw ordersRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (allProfilesRes.error) throw allProfilesRes.error;

      const dateInterval = eachDayOfInterval({
        start: effectiveDateRange.from || subDays(new Date(), 30),
        end: effectiveDateRange.to || new Date(),
      });

      // User Engagement Metrics
      const totalRewardsMembers = allProfilesRes.data.length;
      const newMembers = profilesRes.data.length;
      
      // Active members (users with recent activity)
      const activeUserIds = new Set([
        ...pointsRes.data.map(p => p.user_id),
        ...codesRes.data.map(c => c.user_id),
        ...ordersRes.data.map(o => o.user_id)
      ]);
      const activeMembers = activeUserIds.size;

      // User engagement over time
      const userEngagementData = dateInterval.map(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayNewUsers = profilesRes.data.filter(user => 
          format(parseISO(user.created_at), "yyyy-MM-dd") === dateStr
        ).length;
        
        const dayActiveUsers = new Set([
          ...pointsRes.data.filter(p => format(parseISO(p.created_at), "yyyy-MM-dd") === dateStr).map(p => p.user_id),
          ...codesRes.data.filter(c => format(parseISO(c.created_at), "yyyy-MM-dd") === dateStr).map(c => c.user_id)
        ]).size;

        return {
          date: format(date, "MMM dd"),
          newUsers: dayNewUsers,
          activeUsers: dayActiveUsers,
        };
      });

      // Code & Points Flow
      const codeSubmissionData = dateInterval.map(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayCodes = codesRes.data.filter(code => 
          format(parseISO(code.created_at), "yyyy-MM-dd") === dateStr
        );
        
        const dayRedemptions = ordersRes.data.filter(order => 
          format(parseISO(order.created_at), "yyyy-MM-dd") === dateStr
        );

        return {
          date: format(date, "MMM dd"),
          codesSubmitted: dayCodes.length,
          redemptions: dayRedemptions.length,
        };
      });

      // Points flow data
      const pointsFlowData = dateInterval.map(date => {
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

      // Redemption Analysis
      const redemptionData = ordersRes.data.map(order => ({
        points: order.total_points,
        items: Array.isArray(order.items) ? order.items.length : 0,
        date: order.created_at
      }));

      const avgPointsPerRedemption = redemptionData.length > 0 
        ? redemptionData.reduce((sum, r) => sum + r.points, 0) / redemptionData.length 
        : 0;

      // Platform Funnel Metrics
      const usersWhoSubmittedCodes = new Set(codesRes.data.map(c => c.user_id)).size;
      const usersWhoRedeemed = new Set(ordersRes.data.map(o => o.user_id)).size;
      const usersWithSufficientPoints = allProfilesRes.data.filter(p => p.points_balance >= 1000).length; // Assuming 1000 is minimum redemption

      const codeSubmissionRate = totalRewardsMembers > 0 ? (usersWhoSubmittedCodes / totalRewardsMembers) * 100 : 0;
      const redemptionRate = usersWhoSubmittedCodes > 0 ? (usersWhoRedeemed / usersWhoSubmittedCodes) * 100 : 0;

      // System Health Metrics
      const totalPointsEarned = pointsRes.data
        .filter(p => p.type === "earn")
        .reduce((sum, p) => sum + p.points, 0);
      
      const totalPointsRedeemed = Math.abs(pointsRes.data
        .filter(p => p.type === "redeem")
        .reduce((sum, p) => sum + p.points, 0));

      const outstandingPointsLiability = totalPointsEarned - totalPointsRedeemed;

      // Top Users by Points (from current balances)
      const topUsers = allProfilesRes.data
        .filter(p => p.points_balance > 0)
        .sort((a, b) => b.points_balance - a.points_balance)
        .slice(0, 10)
        .map(user => ({
          userId: user.id,
          points: user.points_balance,
          rank: 0 // Will be set by index + 1
        }))
        .map((user, index) => ({ ...user, rank: index + 1 }));

      // Most Redeemed Items (from orders)
      const itemFrequency: Record<string, { count: number; totalPoints: number }> = {};
      ordersRes.data.forEach(order => {
        if (Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const itemName = item.name || 'Unknown Item';
            if (!itemFrequency[itemName]) {
              itemFrequency[itemName] = { count: 0, totalPoints: 0 };
            }
            itemFrequency[itemName].count += 1;
            itemFrequency[itemName].totalPoints += order.total_points;
          });
        }
      });

      const topRedeemedItems = Object.entries(itemFrequency)
        .map(([name, data]) => ({
          name,
          count: data.count,
          totalPoints: data.totalPoints,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        // User Engagement
        userEngagementData,
        
        // Code & Points Flow
        codeSubmissionData,
        pointsFlowData,
        
        // Platform Funnel
        funnelData: {
          totalUsers: totalRewardsMembers,
          codeSubmitters: usersWhoSubmittedCodes,
          redeemers: usersWhoRedeemed,
        },

        // Top Data
        topUsers,
        topRedeemedItems,
        
        // Key Metrics
        metrics: {
          // User Engagement
          totalRewardsMembers,
          newMembers,
          activeMembers,
          
          // Code & Points
          totalCodesSubmitted: codesRes.data.length,
          totalPointsEarned,
          totalPointsRedeemed,
          outstandingPointsLiability,
          
          // Redemptions
          totalRedemptions: ordersRes.data.length,
          avgPointsPerRedemption: Math.round(avgPointsPerRedemption),
          
          // Conversion Rates
          codeSubmissionRate: Math.round(codeSubmissionRate * 10) / 10,
          redemptionRate: Math.round(redemptionRate * 10) / 10,
          
          // System Health
          averageTimeToRedemption: 7, // Mock data - would need complex calculation
          fraudFlags: 0, // Mock data - would need fraud detection logic
        },
      };
    },
    refetchInterval: refreshInterval,
  });
};