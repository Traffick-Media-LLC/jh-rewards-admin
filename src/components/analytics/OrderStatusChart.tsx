import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface OrderStatusData {
  status: string;
  count: number;
  percentage: number;
}

interface OrderStatusChartProps {
  data: OrderStatusData[];
  isLoading?: boolean;
}

const statusColors = {
  completed: "hsl(142, 76%, 36%)",
  processing: "hsl(45, 93%, 47%)",
  pending: "hsl(25, 95%, 53%)",
  cancelled: "hsl(0, 84%, 60%)",
  shipped: "hsl(217, 91%, 60%)",
  delivered: "hsl(142, 76%, 36%)",
};

const chartConfig = {
  completed: { label: "Completed", color: statusColors.completed },
  processing: { label: "Processing", color: statusColors.processing },
  pending: { label: "Pending", color: statusColors.pending },
  cancelled: { label: "Cancelled", color: statusColors.cancelled },
  shipped: { label: "Shipped", color: statusColors.shipped },
  delivered: { label: "Delivered", color: statusColors.delivered },
};

export function OrderStatusChart({ data, isLoading }: OrderStatusChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Status Distribution</CardTitle>
          <CardDescription>Current order status breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted animate-pulse rounded-md" />
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || "hsl(var(--muted))";
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Order Status Distribution</CardTitle>
        <CardDescription>Breakdown of orders by current status</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-72">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={100}
              paddingAngle={2}
              dataKey="count"
              nameKey="status"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getStatusColor(entry.status)}
                />
              ))}
            </Pie>
            <ChartTooltip 
              content={<ChartTooltipContent 
                formatter={(value, name) => [`${value} orders (${data.find(d => d.status === name)?.percentage}%)`, name]}
              />} 
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span className="text-xs">{value}</span>}
              iconType="circle"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}