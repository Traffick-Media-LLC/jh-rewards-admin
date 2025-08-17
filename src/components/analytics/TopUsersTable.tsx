import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { formatPoints } from "@/lib/pricing";

interface TopUser {
  userId: string;
  points: number;
  rank: number;
}

interface TopUsersTableProps {
  data: TopUser[];
  isLoading?: boolean;
}

export function TopUsersTable({ data, isLoading }: TopUsersTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Users</CardTitle>
          <CardDescription>Highest points balances</CardDescription>
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    if (rank <= 3) return "default";
    if (rank <= 5) return "secondary";
    return "outline";
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-sm sm:text-lg">Top Users</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Members with highest points balances</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 sm:space-y-3">
          {data.slice(0, 10).map((user) => (
            <div key={user.userId} className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1">
                  {getRankIcon(user.rank)}
                  <Badge variant={getRankBadgeVariant(user.rank)} className="text-xs px-1.5 py-0.5">
                    #{user.rank}
                  </Badge>
                </div>
                <div>
                  <div className="font-medium text-xs sm:text-sm">
                    User {user.userId.slice(-8)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Member ID
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-sm sm:text-base">
                  {formatPoints(user.points)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Balance
                </div>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No users with points balances found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}