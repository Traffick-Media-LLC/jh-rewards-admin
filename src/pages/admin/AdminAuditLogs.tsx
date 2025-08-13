import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AuditLogWithProfile = {
  id: string;
  admin_user_id: string;
  action_type: string;
  resource_type: string;
  resource_id: string | null;
  details: any;
  created_at: string;
  admin_profile?: {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  };
};

const AdminAuditLogs: React.FC = () => {
  React.useEffect(() => { document.title = "Admin | Audit Logs"; }, []);
  const [query, setQuery] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState<string>("all");

  const { data: logs, isLoading } = useQuery<AuditLogWithProfile[]>({
    queryKey: ["admin-audit-logs", query, actionFilter],
    queryFn: async (): Promise<AuditLogWithProfile[]> => {
      let queryBuilder = supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (actionFilter !== "all") {
        queryBuilder = queryBuilder.eq("action_type", actionFilter);
      }

      if (query.trim()) {
        queryBuilder = queryBuilder.or(`resource_id.ilike.%${query}%,action_type.ilike.%${query}%`);
      }

      const { data: logsData, error } = await queryBuilder;
      if (error) throw error;

      // Get admin user details
      if (logsData && logsData.length > 0) {
        const userIds = [...new Set(logsData.map(log => log.admin_user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name")
          .in("id", userIds);

        // Merge user data
        return logsData.map(log => ({
          ...log,
          admin_profile: profiles?.find(p => p.id === log.admin_user_id)
        }));
      }

      return logsData || [];
    },
    staleTime: 10_000,
  });

  const getActionBadgeVariant = (actionType: string) => {
    switch (actionType) {
      case 'points_adjustment':
        return 'destructive';
      case 'product_create':
      case 'product_update':
        return 'default';
      case 'user_role_change':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatDetails = (details: any) => {
    if (!details || typeof details !== 'object') return '';
    
    const entries = Object.entries(details);
    if (entries.length === 0) return '';
    
    return entries.map(([key, value]) => `${key}: ${value}`).join(', ');
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Admin Audit Logs</h1>
        <p className="text-sm text-muted-foreground">Track all administrative actions and changes</p>
      </header>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input 
            placeholder="Search by resource ID or action type..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="points_adjustment">Points Adjustments</SelectItem>
            <SelectItem value="product_create">Product Creation</SelectItem>
            <SelectItem value="product_update">Product Updates</SelectItem>
            <SelectItem value="user_role_change">Role Changes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableCaption>Recent administrative actions (last 100 entries)</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Admin User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading audit logs...</TableCell>
              </TableRow>
            ) : logs?.length ? (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {log.admin_profile ? 
                      `${log.admin_profile.first_name || ''} ${log.admin_profile.last_name || ''}`.trim() || log.admin_profile.email :
                      log.admin_user_id
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action_type)}>
                      {log.action_type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.resource_type}</div>
                      {log.resource_id && (
                        <div className="text-xs text-muted-foreground font-mono">{log.resource_id}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDetails(log.details)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No audit logs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminAuditLogs;