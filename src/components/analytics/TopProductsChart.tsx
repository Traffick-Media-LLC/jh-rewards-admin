import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPoints } from "@/lib/pricing";

interface TopProductData {
  name: string;
  revenue: number;
  quantity: number;
}

interface TopProductsChartProps {
  data: TopProductData[];
  isLoading?: boolean;
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
};

export function TopProductsChart({ data, isLoading }: TopProductsChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
          <CardDescription>Best performing products by revenue</CardDescription>
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
        <CardTitle className="text-lg">Top Products</CardTitle>
        <CardDescription>Best performing products by revenue</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-72">
          <BarChart 
            data={data} 
            layout="horizontal"
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              type="number"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatPoints(value)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              type="category"
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
              width={80}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip 
              content={<ChartTooltipContent 
                formatter={(value, name, props) => [
                  formatPoints(value as number),
                  `Revenue (${props.payload?.quantity} sold)`
                ]}
              />} 
            />
            <Bar
              dataKey="revenue"
              fill="var(--color-revenue)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}