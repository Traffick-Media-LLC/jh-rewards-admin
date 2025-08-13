import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AdminOrders: React.FC = () => {
  React.useEffect(() => { document.title = "Admin | Orders"; }, []);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("id, created_at, user_id, total_points, status, shopify_order_name").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 10_000,
  });

  return (
    <div>
      <Table>
        <TableCaption>Latest orders</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Points</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow>
          ) : orders?.length ? (
            orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell>{o.shopify_order_name || "Pending"}</TableCell>
                <TableCell>{new Date(o.created_at).toLocaleString()}</TableCell>
                <TableCell>{o.user_id}</TableCell>
                <TableCell className="text-right">{o.total_points}</TableCell>
                <TableCell>{o.status}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow><TableCell colSpan={5}>No orders</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminOrders;
