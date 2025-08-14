import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPoints } from "@/lib/pricing";

interface PointsActivityData {
  date: string;
  earned: number;
  redeemed: number;
}

interface PointsActivityChartProps {
  data: PointsActivityData[];
  isLoading?: boolean;
}

const chartConfig = {
  earned: {
    label: "Points Earned",
    color: "hsl(142, 76%, 36%)",
  },
  redeemed: {
    label: "Points Redeemed",
    color: "hsl(0, 84%, 60%)",
  },
};

export function PointsActivityChart({ data, isLoading }: PointsActivityChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Points Activity</CardTitle>
          <CardDescription>Daily points earned vs redeemed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted animate-pulse rounded-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Points Activity</CardTitle>
        <CardDescription>Daily comparison of points earned vs redeemed</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-72">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatPoints(value)}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <ChartTooltip 
              content={<ChartTooltipContent 
                formatter={(value, name) => [
                  formatPoints(value as number),
                  name === "earned" ? "Points Earned" : "Points Redeemed"
                ]}
              />} 
            />
            <Bar
              dataKey="earned"
              fill="var(--color-earned)"
              radius={[2, 2, 0, 0]}
              name="earned"
            />
            <Bar
              dataKey="redeemed"
              fill="var(--color-redeemed)"
              radius={[2, 2, 0, 0]}
              name="redeemed"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}