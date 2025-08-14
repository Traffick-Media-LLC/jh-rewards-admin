import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  formatter?: (value: number) => string;
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon, 
  trend,
  formatter,
  className 
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === "up" || (change !== undefined && change > 0)) {
      return <TrendingUp className="h-4 w-4" />;
    }
    if (trend === "down" || (change !== undefined && change < 0)) {
      return <TrendingDown className="h-4 w-4" />;
    }
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (trend === "up" || (change !== undefined && change > 0)) {
      return "text-green-600 dark:text-green-400";
    }
    if (trend === "down" || (change !== undefined && change < 0)) {
      return "text-red-600 dark:text-red-400";
    }
    return "text-muted-foreground";
  };

  const formatValue = (val: string | number) => {
    if (typeof val === "number" && formatter) {
      return formatter(val);
    }
    return val;
  };

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {formatValue(value)}
        </div>
        {(change !== undefined || changeLabel) && (
          <div className="flex items-center gap-1 mt-1">
            <div className={cn("flex items-center gap-1 text-xs", getTrendColor())}>
              {getTrendIcon()}
              {change !== undefined && (
                <span>
                  {change > 0 ? "+" : ""}{change}%
                </span>
              )}
            </div>
            {changeLabel && (
              <span className="text-xs text-muted-foreground">
                {changeLabel}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}