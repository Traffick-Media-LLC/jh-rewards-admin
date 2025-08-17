import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CodeSubmissionData {
  date: string;
  codesSubmitted: number;
  redemptions: number;
}

interface CodeSubmissionChartProps {
  data: CodeSubmissionData[];
  isLoading?: boolean;
}

const chartConfig = {
  codesSubmitted: {
    label: "Codes Submitted",
    color: "hsl(var(--primary))",
  },
  redemptions: {
    label: "Redemptions",
    color: "hsl(var(--secondary))",
  },
};

export function CodeSubmissionChart({ data, isLoading }: CodeSubmissionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Code Activity</CardTitle>
          <CardDescription>Codes submitted vs redemptions</CardDescription>
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
        <CardTitle className="text-sm sm:text-lg">Code Activity</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Daily code submissions vs redemptions</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-48 sm:h-64 lg:h-72">
          <BarChart data={data}>
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
                  name === "codesSubmitted" ? "Codes Submitted" : "Redemptions"
                ]}
              />} 
            />
            <Bar
              dataKey="codesSubmitted"
              fill="var(--color-codesSubmitted)"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="redemptions"
              fill="var(--color-redemptions)"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}