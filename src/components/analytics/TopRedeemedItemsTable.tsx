import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { formatPoints } from "@/lib/pricing";

interface TopRedeemedItem {
  name: string;
  count: number;
  totalPoints: number;
}

interface TopRedeemedItemsTableProps {
  data: TopRedeemedItem[];
  isLoading?: boolean;
}

export function TopRedeemedItemsTable({ data, isLoading }: TopRedeemedItemsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Popular Rewards</CardTitle>
          <CardDescription>Most redeemed items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-sm sm:text-lg">Popular Rewards</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Most frequently redeemed items</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 sm:space-y-3">
          {data.slice(0, 5).map((item, index) => (
            <div key={item.name} className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    #{index + 1}
                  </Badge>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-xs sm:text-sm truncate">
                    {item.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.count} redemptions
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold text-sm sm:text-base">
                  {formatPoints(item.totalPoints)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Value
                </div>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No redemption data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}