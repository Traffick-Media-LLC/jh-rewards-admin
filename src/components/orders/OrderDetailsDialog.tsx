import React, { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<'orders'>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | null;
};

function formatAddress(o: Order | null) {
  if (!o) return null;
  const parts = [o.shipping_name, o.shipping_street, [o.shipping_city, o.shipping_state, o.shipping_postal_code].filter(Boolean).join(', '), o.shipping_country].filter(Boolean);
  return parts.length ? parts : null;
}

export const OrderDetailsDialog: React.FC<Props> = ({ open, onOpenChange, orderId }) => {
  const { data: order, refetch, isFetching } = useQuery({
    queryKey: ["order", orderId],
    enabled: open && !!orderId,
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();
      if (error) throw error;
      return data as Order | null;
    },
    staleTime: 10_000,
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
  });

  // Realtime subscription to auto-update when webhooks write tracking info
  useEffect(() => {
    if (!open || !orderId) return;
    const channel = supabase
      .channel(`orders-updates-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        () => {
          void refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, orderId, refetch]);

  const items = useMemo(() => {
    const raw = order?.items as unknown;
    if (!raw) return [] as any[];
    if (Array.isArray(raw)) return raw as any[];
    if (typeof raw === 'object') return [raw as any];
    return [] as any[];
  }, [order]);

  // Fetch products for items that have productId
  const productIds = useMemo(() => {
    return items
      .map(item => item?.productId)
      .filter(Boolean) as string[];
  }, [items]);

  const { data: products } = useQuery({
    queryKey: ["order-products", productIds],
    enabled: productIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .in("id", productIds);
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

  // Create a mapping of productId to product name
  const productMap = useMemo(() => {
    const map: Record<string, string> = {};
    products?.forEach(product => {
      map[product.id] = product.name;
    });
    return map;
  }, [products]);

  const addressLines = formatAddress(order);
  const hasTracking = !!(order?.tracking_number || order?.tracking_url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Order details</DialogTitle>
          <DialogDescription>
            {order ? `Placed on ${new Date(order.created_at).toLocaleString()}` : 'Loading order...'}
          </DialogDescription>
        </DialogHeader>

        {order && (
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-medium text-foreground">Summary</h3>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>Order</div>
                <div className="text-right">{order.shopify_order_name || "Pending"}</div>
                <div>Status</div>
                <div className="text-right capitalize">{order.status}</div>
                <div>Fulfillment</div>
                <div className="text-right capitalize">{order.fulfillment_status ?? 'pending'}</div>
                <div>Total points</div>
                <div className="text-right">{order.total_points}</div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-medium text-foreground">Items</h3>
              {items.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((it, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{it?.name || it?.title || it?.product_name || it?.product?.name || it?.product?.title || (it?.productId && productMap[it.productId]) || 'Product'}</div>
                            {it?.variant_title && (
                              <div className="text-sm text-muted-foreground">{it.variant_title}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{it?.quantity ?? it?.qty ?? 1}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No items data available.</p>
              )}
            </section>

            <section>
              <h3 className="text-sm font-medium text-foreground">Shipping</h3>
              {addressLines ? (
                <address className="mt-2 not-italic text-sm text-muted-foreground">
                  {addressLines.map((l, i) => (
                    <div key={i}>{l}</div>
                  ))}
                </address>
              ) : (
                <p className="text-sm text-muted-foreground">No shipping address on file.</p>
              )}
            </section>

            <section>
              <h3 className="text-sm font-medium text-foreground">Tracking</h3>
              {hasTracking ? (
                <div className="mt-2 text-sm">
                  {order.tracking_number && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tracking number</span>
                      <span className="font-medium">{order.tracking_number}</span>
                    </div>
                  )}
                  {order.tracking_url && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-muted-foreground">Tracking link</span>
                      <a className="font-medium underline underline-offset-4" href={order.tracking_url} target="_blank" rel="noreferrer">View shipment</a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Awaiting fulfillment. Tracking will appear here automatically once available.
                </p>
              )}
            </section>
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isFetching}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
