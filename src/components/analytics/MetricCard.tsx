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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
          {title}
        </CardTitle>
        {icon && (
          <div className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-1 sm:mb-2 break-all">
          {formatValue(value)}
        </div>
        {(change !== undefined || changeLabel) && (
          <div className="flex items-center justify-between text-[10px] sm:text-xs gap-1">
            {change !== undefined && (
              <div className={cn("flex items-center gap-0.5 sm:gap-1 shrink-0", getTrendColor())}>
                {getTrendIcon()}
                <span>
                  {change > 0 ? "+" : ""}{change}%
                </span>
              </div>
            )}
            {changeLabel && (
              <span className="text-muted-foreground truncate">
                {changeLabel}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}