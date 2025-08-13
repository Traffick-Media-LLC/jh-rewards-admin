import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import OrderDetailsDialog from "@/components/orders/OrderDetailsDialog";

// Lightweight SEO helper (no external deps)
function useSEO({ title, description, canonical }: { title: string; description: string; canonical?: string }) {
  useEffect(() => {
    document.title = title;

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical || `${window.location.origin}/account`;

    // Structured data (ProfilePage)
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "name": "User Account",
      "url": `${window.location.origin}/account`,
      "description": description
    });
    document.head.appendChild(ld);

    return () => {
      document.head.removeChild(ld);
    };
  }, [title, description, canonical]);
}

// Types
type Profile = Tables<'profiles'>;
type PointsTx = Tables<'points_transactions'>;
type Order = Tables<'orders'>;

const Account: React.FC = () => {
  useSEO({
    title: "Account | Juice Head Rewards",
    description: "Manage your profile, points, and recent orders in your Juice Head Rewards account.",
    canonical: `${window.location.origin}/account`,
  });

  const navigate = useNavigate();

  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);

  const [transactions, setTransactions] = useState<PointsTx[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Auth: set up listener first, then read session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setIsAuthReady(true);

      if (session?.user?.id) {
        // Defer fetching to avoid deadlocks
        setTimeout(() => {
          void fetchAll(session.user!.id);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setIsAuthReady(true);
      if (data.session?.user?.id) void fetchAll(data.session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirect if not logged in once auth is ready
  useEffect(() => {
    if (isAuthReady && !userId) {
      navigate('/auth', { replace: true });
    }
  }, [isAuthReady, userId, navigate]);

  async function fetchAll(uid: string) {
    try {
      setLoading(true);
      const [{ data: prof }, { data: tx }, { data: ord }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
        supabase.from('points_transactions').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(10),
        supabase.from('orders').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(10)
      ]);

      if (prof) {
        setProfile(prof as Profile);
        setEditing({
          first_name: prof.first_name ?? '',
          last_name: prof.last_name ?? '',
          email: prof.email ?? '',
          phone: prof.phone ?? '',
          street: prof.street ?? '',
          city: prof.city ?? '',
          state: prof.state ?? '',
          postal_code: prof.postal_code ?? '',
          country: prof.country ?? '',
          marketing_emails: prof.marketing_emails,
          sms_notifications: prof.sms_notifications,
        } as Partial<Profile>);
      }
      setTransactions(tx ?? []);
      setOrders(ord ?? []);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? 'Failed to load account');
    } finally {
      setLoading(false);
    }
  }

  const pointsBalance = useMemo(() => profile?.points_balance ?? 0, [profile]);
  const redeemedThisMonth = useMemo(() => profile?.redeemed_this_month ?? 0, [profile]);

  async function handleSave() {
    if (!userId) return;
    try {
      const update: Partial<Profile> = {
        first_name: editing.first_name ?? null,
        last_name: editing.last_name ?? null,
        email: editing.email ?? null,
        phone: editing.phone ?? null,
        street: editing.street ?? null,
        city: editing.city ?? null,
        state: editing.state ?? null,
        postal_code: editing.postal_code ?? null,
        country: editing.country ?? null,
        marketing_emails: typeof editing.marketing_emails === 'boolean' ? editing.marketing_emails : profile?.marketing_emails ?? true,
        sms_notifications: typeof editing.sms_notifications === 'boolean' ? editing.sms_notifications : profile?.sms_notifications ?? false,
      };

      const { error } = await supabase.from('profiles').update(update).eq('id', userId);
      if (error) throw error;

      toast.success('Profile updated');
      await fetchAll(userId);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? 'Update failed');
    }
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      navigate('/auth', { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? 'Sign out failed');
    }
  }

  // Trigger Shopify sync on mount and every 30s while on Account page
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function runSync() {
      try {
        await supabase.functions.invoke('shopify-sync-orders');
        if (!cancelled) {
          // Refresh local data so tracking updates appear
          await fetchAll(userId);
        }
      } catch (e) {
        console.warn('Sync orders failed', e);
      }
    }

    // Initial sync when arriving or after refresh
    void runSync();

    // Interval sync every 30 seconds
    const id = setInterval(() => { void runSync(); }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [userId]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Account</h1>
          <p className="text-muted-foreground mt-2">Manage your profile, points, and recent orders.</p>
        </header>

        {/* Profile + Points */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-label="Account overview">
          {/* Profile form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <h2 className="text-xl font-semibold text-foreground">Profile</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-muted-foreground">Loading profile...</p>
              ) : (
                <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); void handleSave(); }}>
                  <div>
                    <Label htmlFor="first_name">First name</Label>
                    <Input id="first_name" value={editing.first_name as string || ''} onChange={(e) => setEditing((s) => ({ ...s, first_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last name</Label>
                    <Input id="last_name" value={editing.last_name as string || ''} onChange={(e) => setEditing((s) => ({ ...s, last_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={editing.email as string || ''} onChange={(e) => setEditing((s) => ({ ...s, email: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={editing.phone as string || ''} onChange={(e) => setEditing((s) => ({ ...s, phone: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="street">Street</Label>
                      <Input id="street" value={editing.street as string || ''} onChange={(e) => setEditing((s) => ({ ...s, street: e.target.value }))} />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={editing.city as string || ''} onChange={(e) => setEditing((s) => ({ ...s, city: e.target.value }))} />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input id="state" value={editing.state as string || ''} onChange={(e) => setEditing((s) => ({ ...s, state: e.target.value }))} />
                    </div>
                    <div>
                      <Label htmlFor="postal_code">Postal code</Label>
                      <Input id="postal_code" value={editing.postal_code as string || ''} onChange={(e) => setEditing((s) => ({ ...s, postal_code: e.target.value }))} />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" value={editing.country as string || ''} onChange={(e) => setEditing((s) => ({ ...s, country: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch id="marketing_emails" checked={Boolean(editing.marketing_emails)} onCheckedChange={(v) => setEditing((s) => ({ ...s, marketing_emails: Boolean(v) }))} />
                    <Label htmlFor="marketing_emails">Receive marketing emails</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch id="sms_notifications" checked={Boolean(editing.sms_notifications)} onCheckedChange={(v) => setEditing((s) => ({ ...s, sms_notifications: Boolean(v) }))} />
                    <Label htmlFor="sms_notifications">Receive SMS notifications</Label>
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit">Save changes</Button>
                  </div>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => navigate('/shop')}>Continue shopping</Button>
              <Button variant="destructive" onClick={() => void handleSignOut()}>Sign out</Button>
            </CardFooter>
          </Card>

          {/* Points summary */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <h2 className="text-xl font-semibold text-foreground">Points</h2>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading points...</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current balance</p>
                    <p className="text-3xl font-bold">{pointsBalance}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Codes redeemed this month</p>
                    <p className="text-xl font-semibold">
                      <span className={redeemedThisMonth >= 50 ? "text-orange-600" : redeemedThisMonth >= 60 ? "text-red-600" : ""}>
                        {redeemedThisMonth}/60
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Recent activity */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6" aria-label="Recent activity">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-foreground">Recent point transactions</h2>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading transactions...</p>
              ) : transactions.length === 0 ? (
                <p className="text-muted-foreground">No recent transactions.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{new Date(t.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{t.type}</TableCell>
                        <TableCell className="text-right">{t.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-foreground">Recent orders</h2>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading orders...</p>
              ) : orders.length === 0 ? (
                <p className="text-muted-foreground">No recent orders.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow
                        key={o.id}
                        className="cursor-pointer hover:bg-accent"
                        role="button"
                        tabIndex={0}
                        onClick={() => { setSelectedOrderId(o.id); setOrderDialogOpen(true); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedOrderId(o.id); setOrderDialogOpen(true); } }}
                      >
                        <TableCell>{o.shopify_order_name || "Pending"}</TableCell>
                        <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="capitalize">{o.status}</TableCell>
                        <TableCell className="text-right">{o.total_points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
      <OrderDetailsDialog
        open={orderDialogOpen}
        onOpenChange={(v) => { setOrderDialogOpen(v); if (!v) setSelectedOrderId(null); }}
        orderId={selectedOrderId}
      />
      <Footer />
    </div>
  );
};

export default Account;
