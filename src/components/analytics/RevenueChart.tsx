import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPoints } from "@/lib/pricing";

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  isLoading?: boolean;
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
  orders: {
    label: "Orders",
    color: "hsl(var(--secondary))",
  },
};

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>Daily revenue and order volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted animate-pulse rounded-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trends</CardTitle>
        <CardDescription>Daily revenue and order volume over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatPoints(value)}
            />
            <ChartTooltip 
              content={<ChartTooltipContent 
                formatter={(value, name) => [
                  name === "revenue" ? formatPoints(value as number) : value,
                  name === "revenue" ? "Revenue" : "Orders"
                ]}
              />} 
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              strokeWidth={3}
              dot={{ fill: "var(--color-revenue)", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "var(--color-revenue)", strokeWidth: 2 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}