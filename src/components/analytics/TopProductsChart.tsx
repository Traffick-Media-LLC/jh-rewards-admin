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
    <Card>
      <CardHeader>
        <CardTitle>Top Products</CardTitle>
        <CardDescription>Best performing products by revenue</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <BarChart 
            data={data} 
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              type="number"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatPoints(value)}
            />
            <YAxis 
              type="category"
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
              width={120}
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