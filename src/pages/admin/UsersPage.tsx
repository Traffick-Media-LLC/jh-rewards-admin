import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, RefreshCw, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { formatPoints } from "@/lib/pricing";

export function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({});
  const [submittingPoints, setSubmittingPoints] = useState<Record<string, boolean>>({});

  // Users data
  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ["admin-users", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(
          `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
  });

  const handlePointsAdjustment = async (
    userId: string,
    points: number,
    description: string,
    onSuccess?: () => void
  ) => {
    // Prevent double submission
    if (submittingPoints[userId]) {
      return;
    }

    try {
      setSubmittingPoints((prev) => ({ ...prev, [userId]: true }));
      
      // Validate input
      if (!points || points === 0) {
        throw new Error("Points amount cannot be zero");
      }
      if (!description.trim()) {
        throw new Error("Description is required");
      }
      if (Math.abs(points) > 50000) {
        throw new Error("Points adjustment cannot exceed 50,000");
      }

      console.log(`Adjusting points for user ${userId}: ${points} points (${description})`);
      
      const { data, error } = await supabase.from("points_transactions").insert({
        user_id: userId,
        points,
        type: "adjustment",
        description: description.trim(),
      }).select();

      if (error) throw error;
      
      console.log("Points adjustment transaction created:", data);
      toast.success(`Points adjusted successfully: ${points > 0 ? '+' : ''}${points} points`);
      refetchUsers();

      // Close dialog and reset form on success
      setOpenDialogs((prev) => ({ ...prev, [userId]: false }));
      onSuccess?.();
    } catch (error: any) {
      console.error("Points adjustment error:", error);
      toast.error(error.message || "Failed to adjust points");
    } finally {
      setSubmittingPoints((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and points</p>
        </div>
        <Button className="w-full sm:w-auto">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => refetchUsers()} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile view: Card layout */}
          <div className="block sm:hidden space-y-4">
            {users?.map((user) => (
              <Card key={user.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium truncate">
                        {user.first_name} {user.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                    </div>
                    <Badge variant="outline" className="ml-2 shrink-0">
                      {formatPoints(user.points_balance || 0)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <Badge variant={user.marketing_emails ? "default" : "secondary"} className="text-xs">
                        {user.marketing_emails ? "Emails: Yes" : "Emails: No"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Monthly: {user.redeemed_this_month || 0}
                      </Badge>
                    </div>
                    
                    <Dialog
                      open={openDialogs[user.id] || false}
                      onOpenChange={(open) =>
                        setOpenDialogs((prev) => ({ ...prev, [user.id]: open }))
                      }
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          Adjust Points
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="mx-4 max-w-md">
                        <DialogHeader>
                          <DialogTitle>Adjust Points</DialogTitle>
                          <DialogDescription>
                            Adjust points balance for {user.first_name} {user.last_name}
                          </DialogDescription>
                        </DialogHeader>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const points = parseInt(formData.get("points") as string);
                            const description = formData.get("description") as string;
                            if (points && description) {
                              handlePointsAdjustment(user.id, points, description, () => {
                                e.currentTarget.reset();
                              });
                            }
                          }}
                          className="space-y-4"
                        >
                          <div>
                            <Label htmlFor="points">Points Amount</Label>
                            <Input
                              id="points"
                              name="points"
                              type="number"
                              placeholder="Enter points (positive to add, negative to deduct)"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              name="description"
                              placeholder="Reason for adjustment..."
                              required
                              className="min-h-[80px]"
                            />
                          </div>
                          <Button
                            type="submit"
                            disabled={submittingPoints[user.id]}
                            className="w-full"
                          >
                            {submittingPoints[user.id] ? "Processing..." : "Adjust Points"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop view: Table layout */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Points Balance</TableHead>
                  <TableHead>Redeemed This Month</TableHead>
                  <TableHead>Marketing Emails</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {user.id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatPoints(user.points_balance || 0)}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.redeemed_this_month || 0}</TableCell>
                    <TableCell>
                      <Badge variant={user.marketing_emails ? "default" : "secondary"}>
                        {user.marketing_emails ? "Subscribed" : "Unsubscribed"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog
                        open={openDialogs[user.id] || false}
                        onOpenChange={(open) =>
                          setOpenDialogs((prev) => ({ ...prev, [user.id]: open }))
                        }
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Adjust Points
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adjust Points</DialogTitle>
                            <DialogDescription>
                              Adjust points balance for {user.first_name} {user.last_name}
                            </DialogDescription>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const formData = new FormData(e.currentTarget);
                              const points = parseInt(formData.get("points") as string);
                              const description = formData.get("description") as string;
                              if (points && description) {
                                handlePointsAdjustment(user.id, points, description, () => {
                                  e.currentTarget.reset();
                                });
                              }
                            }}
                            className="space-y-4"
                          >
                            <div>
                              <Label htmlFor="points">Points Amount</Label>
                              <Input
                                id="points"
                                name="points"
                                type="number"
                                placeholder="Enter points (positive to add, negative to deduct)"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="description">Description</Label>
                              <Textarea
                                id="description"
                                name="description"
                                placeholder="Reason for adjustment..."
                                required
                              />
                            </div>
                            <Button
                              type="submit"
                              disabled={submittingPoints[user.id]}
                              className="w-full"
                            >
                              {submittingPoints[user.id] ? "Processing..." : "Adjust Points"}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}