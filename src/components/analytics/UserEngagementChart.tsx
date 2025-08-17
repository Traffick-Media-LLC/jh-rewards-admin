import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UserEngagementData {
  date: string;
  newUsers: number;
  activeUsers: number;
}

interface UserEngagementChartProps {
  data: UserEngagementData[];
  isLoading?: boolean;
}

const chartConfig = {
  newUsers: {
    label: "New Members",
    color: "hsl(var(--primary))",
  },
  activeUsers: {
    label: "Active Members",
    color: "hsl(var(--secondary))",
  },
};

export function UserEngagementChart({ data, isLoading }: UserEngagementChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Engagement</CardTitle>
          <CardDescription>New vs active members over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 sm:h-64 lg:h-72 bg-muted animate-pulse rounded-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-sm sm:text-lg">User Engagement</CardTitle>
        <CardDescription className="text-xs sm:text-sm">New member signups vs daily active users</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-48 sm:h-64 lg:h-72">
          <LineChart data={data}>
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
              width={30}
            />
            <ChartTooltip 
              content={<ChartTooltipContent 
                formatter={(value, name) => [
                  value,
                  name === "newUsers" ? "New Members" : "Active Members"
                ]}
              />} 
            />
            <Line
              type="monotone"
              dataKey="newUsers"
              stroke="var(--color-newUsers)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, stroke: "var(--color-newUsers)", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="activeUsers"
              stroke="var(--color-activeUsers)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, stroke: "var(--color-activeUsers)", strokeWidth: 2 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}