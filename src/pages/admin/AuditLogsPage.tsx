import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FileText, RefreshCw, Eye } from "lucide-react";
import { formatPoints } from "@/lib/pricing";

export function AuditLogsPage() {
  const [selectedAuditLog, setSelectedAuditLog] = useState<any>(null);
  const [auditLogModalOpen, setAuditLogModalOpen] = useState(false);

  // Audit logs for points adjustments with admin email
  const { data: auditLogs, refetch: refetchAuditLogs } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => {
      // First get the audit logs
      const { data: logs, error: logsError } = await supabase
        .from("admin_audit_log")
        .select("*")
        .eq("action_type", "points_adjustment")
        .order("created_at", { ascending: false })
        .limit(100);

      if (logsError) throw logsError;
      if (!logs || logs.length === 0) return [];

      // Get unique admin and user IDs
      const adminIds = [...new Set(logs.map((log) => log.admin_user_id))];
      const userIds = [...new Set(logs.map((log) => log.resource_id).filter(Boolean))];

      // Fetch admin and user profiles
      const [adminResponse, userResponse] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, email, first_name, last_name")
          .in("id", adminIds),
        supabase
          .from("profiles")
          .select("id, email, first_name, last_name")
          .in("id", userIds),
      ]);

      if (adminResponse.error) throw adminResponse.error;
      if (userResponse.error) throw userResponse.error;

      // Combine the data
      return logs.map((log) => ({
        ...log,
        admin_profile: adminResponse.data?.find((profile) => profile.id === log.admin_user_id),
        user_profile: userResponse.data?.find((profile) => profile.id === log.resource_id),
      }));
    },
  });

  const openAuditLogDetail = (log: any) => {
    setSelectedAuditLog(log);
    setAuditLogModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">Track administrative actions and changes</p>
        </div>
        <Button onClick={() => refetchAuditLogs()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Points Adjustment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {log.admin_profile?.first_name} {log.admin_profile?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {log.admin_profile?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {log.user_profile?.first_name} {log.user_profile?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {log.user_profile?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ((log.details as any)?.points_amount || 0) > 0 ? "default" : "destructive"
                      }
                    >
                      {((log.details as any)?.points_amount || 0) > 0 ? "+" : ""}
                      {formatPoints((log.details as any)?.points_amount || 0)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {(log.details as any)?.description || "No description"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAuditLogDetail(log)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Audit Log Detail Modal */}
      <Dialog open={auditLogModalOpen} onOpenChange={setAuditLogModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Complete information about this administrative action
            </DialogDescription>
          </DialogHeader>
          {selectedAuditLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Date & Time
                  </Label>
                  <p className="mt-1 text-sm">
                    {new Date(selectedAuditLog.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Action Type</Label>
                  <p className="mt-1 text-sm">Points Adjustment</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">User Email</Label>
                  <p className="mt-1 text-sm">
                    {selectedAuditLog.user_profile?.email
                      ? `${selectedAuditLog.user_profile.first_name || ""} ${
                          selectedAuditLog.user_profile.last_name || ""
                        }`.trim()
                        ? `${selectedAuditLog.user_profile.first_name || ""} ${
                            selectedAuditLog.user_profile.last_name || ""
                          }`.trim() + ` (${selectedAuditLog.user_profile.email})`
                        : selectedAuditLog.user_profile.email
                      : selectedAuditLog.resource_id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Admin User
                  </Label>
                  <p className="mt-1 text-sm">
                    {selectedAuditLog.admin_profile?.first_name}{" "}
                    {selectedAuditLog.admin_profile?.last_name} (
                    {selectedAuditLog.admin_profile?.email})
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Points Amount
                  </Label>
                  <p className="mt-1 text-sm">
                    <Badge
                      variant={
                        ((selectedAuditLog.details as any)?.points_amount || 0) > 0
                          ? "default"
                          : "destructive"
                      }
                    >
                      {((selectedAuditLog.details as any)?.points_amount || 0) > 0 ? "+" : ""}
                      {formatPoints((selectedAuditLog.details as any)?.points_amount || 0)}
                    </Badge>
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="mt-1 text-sm p-3 bg-muted rounded-lg">
                  {(selectedAuditLog.details as any)?.description || "No description provided"}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Transaction ID
                </Label>
                <p className="mt-1 text-sm font-mono">
                  {(selectedAuditLog.details as any)?.transaction_id}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}