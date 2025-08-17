import React from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FunnelData {
  totalUsers: number;
  codeSubmitters: number;
  redeemers: number;
}

interface ConversionFunnelChartProps {
  data: FunnelData;
  isLoading?: boolean;
}

const chartConfig = {
  users: {
    label: "Users",
    color: "hsl(var(--primary))",
  },
};

export function ConversionFunnelChart({ data, isLoading }: ConversionFunnelChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>User journey from signup to redemption</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 sm:h-64 lg:h-72 bg-muted animate-pulse rounded-md" />
        </CardContent>
      </Card>
    );
  }

  const funnelData = [
    {
      stage: "Members",
      count: data.totalUsers,
      percentage: 100,
      color: "hsl(var(--primary))",
    },
    {
      stage: "Code Submitters",
      count: data.codeSubmitters,
      percentage: data.totalUsers > 0 ? Math.round((data.codeSubmitters / data.totalUsers) * 100) : 0,
      color: "hsl(var(--secondary))",
    },
    {
      stage: "Redeemers",
      count: data.redeemers,
      percentage: data.totalUsers > 0 ? Math.round((data.redeemers / data.totalUsers) * 100) : 0,
      color: "hsl(var(--accent))",
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-sm sm:text-lg">Conversion Funnel</CardTitle>
        <CardDescription className="text-xs sm:text-sm">User journey from signup to redemption</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {funnelData.map((stage, index) => (
            <div key={stage.stage} className="space-y-1">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="font-medium">{stage.stage}</span>
                <span className="text-muted-foreground">
                  {stage.count.toLocaleString()} ({stage.percentage}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 sm:h-3">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${stage.percentage}%`,
                    backgroundColor: stage.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="text-center">
            <div className="font-semibold text-sm">
              {data.totalUsers > 0 ? Math.round((data.codeSubmitters / data.totalUsers) * 100) : 0}%
            </div>
            <div className="text-muted-foreground">Submit Codes</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-sm">
              {data.codeSubmitters > 0 ? Math.round((data.redeemers / data.codeSubmitters) * 100) : 0}%
            </div>
            <div className="text-muted-foreground">Redeem Rewards</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}