import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UserGrowthData {
  date: string;
  totalUsers: number;
  newUsers: number;
}

interface UserGrowthChartProps {
  data: UserGrowthData[];
  isLoading?: boolean;
}

const chartConfig = {
  totalUsers: {
    label: "Total Users",
    color: "hsl(var(--primary))",
  },
  newUsers: {
    label: "New Users",
    color: "hsl(var(--secondary))",
  },
};

export function UserGrowthChart({ data, isLoading }: UserGrowthChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <CardDescription>User registration trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted animate-pulse rounded-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-sm sm:text-lg">User Growth</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Total users and daily registrations over time</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-48 sm:h-64 lg:h-72">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="totalUsersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-totalUsers)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-totalUsers)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="newUsersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-newUsers)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-newUsers)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={35}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="totalUsers"
              stroke="var(--color-totalUsers)"
              fillOpacity={1}
              fill="url(#totalUsersGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="newUsers"
              stroke="var(--color-newUsers)"
              fillOpacity={1}
              fill="url(#newUsersGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}