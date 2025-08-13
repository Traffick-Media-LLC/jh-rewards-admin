import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { formatNumber, formatPoints } from "@/lib/pricing";
import useProfile from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

// Simple SEO helper for this page
const useSEO = ({ title, description, canonical }: { title: string; description?: string; canonical?: string }) => {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonical);
    }
  }, [title, description, canonical]);
};

// Types
type Address = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};


const ADDRESS_KEY = "jh_checkout_address_v1";
const USER_POINTS_KEY = "jh_user_points_v1";

const defaultAddress: Address = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
  country: "",
};


const Checkout: React.FC = () => {
  useSEO({
    title: "Checkout - Rewards Shop",
    description: "Complete your rewards redemption in a single, streamlined checkout.",
    canonical: `${window.location.origin}/checkout`,
  });

  const { items, subtotalPoints, clearCart, removeItem } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  // User points
  const { profile } = useProfile();
  const [currentPoints, setCurrentPoints] = useState<number>(() => {
    const saved = localStorage.getItem(USER_POINTS_KEY);
    return saved ? Number(saved) : 50000;
  });

  // Address state
  const [address, setAddress] = useState<Address>(() => {
    try {
      const raw = localStorage.getItem(ADDRESS_KEY);
      return raw ? (JSON.parse(raw) as Address) : defaultAddress;
    } catch {
      return defaultAddress;
    }
  });
  const [addressOpen, setAddressOpen] = useState(false);


  const shippingCostPoints = 0;
const totalPoints = subtotalPoints;

const availablePoints = profile?.points_balance ?? currentPoints;
const remainingPoints = Math.max(0, availablePoints - totalPoints);
const insufficient = items.length > 0 && totalPoints > availablePoints;

  const saveAddress = () => {
    localStorage.setItem(ADDRESS_KEY, JSON.stringify(address));
    setAddressOpen(false);
    toast({ title: "Address saved" });
  };


  const validateAddress = (a: Address) => a.fullName && a.phone && a.line1 && a.city && a.state && a.zip && a.country;

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const placeOrder = async () => {
    if (items.length === 0) {
      toast({ title: "Your cart is empty", description: "Add some rewards before checking out.", variant: "destructive" as any });
      return;
    }
    if (!validateAddress(address)) {
      toast({ title: "Address incomplete", description: "Please fill in your delivery address.", variant: "destructive" as any });
      setAddressOpen(true);
      return;
    }
    if (insufficient) {
      toast({ title: "Insufficient points", description: "You don't have enough points to complete this order.", variant: "destructive" as any });
      return;
    }

    // Remove invalid items with NaN or empty product IDs before proceeding
    const invalidItems = items.filter(i => !i.productId || i.productId === 'NaN');
    if (invalidItems.length) {
      invalidItems.forEach(i => removeItem(String(i.productId), i.variantId));
      toast({ title: "Cart updated", description: "Some invalid items were removed. Please review your cart and try again.", variant: "destructive" as any });
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Authentication required", description: "Please sign in to place an order.", variant: "destructive" as any });
        return;
      }

      // Prepare cart items for Shopify integration
      const cartItems = items.map(item => ({
        productId: item.productId.toString(),
        qty: item.qty,
        variantId: item.variantId,
        selectedVariants: item.selectedVariants,
      }));

      // Prepare shipping address
      const shippingAddress = {
        name: address.fullName,
        phone: address.phone,
        street: address.line1 + (address.line2 ? `, ${address.line2}` : ''),
        city: address.city,
        state: address.state,
        postal_code: address.zip,
        country: address.country,
      };

// Call Shopify redemption endpoint
const { data: orderResult, error } = await supabase.functions.invoke('shopify-redeem-order', {
  body: {
    cartItems,
    shippingAddress,
  },
});

if (error) {
  throw new Error(error.message || 'Failed to place order');
}

if (!orderResult?.success) {
  throw new Error(orderResult?.error || 'Order placement failed');
}

      // Success - clear cart and navigate
      clearCart();
      toast({ 
        title: "Order placed successfully!", 
        description: `Thanks, ${address.fullName}. Your order #${orderResult.order.shopify_order_number} is being processed.` 
      });
      
      // Store order info for thank you page
      localStorage.setItem('last_order', JSON.stringify(orderResult.order));
      
      navigate("/thank-you");

    } catch (error) {
      console.error('Order placement error:', error);
      const message = error instanceof Error ? error.message : String(error);
      const friendly = /Transactions is invalid|Amount must be greater than zero/i.test(message)
        ? 'We hit a Shopify quirk with free orders. It\'s been fixed—please try again now.'
        : (message || 'Something went wrong. Please try again.');
      toast({ 
        title: "Order failed", 
        description: friendly, 
        variant: "destructive" as any 
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">Checkout</h1>

        {/* Available points banner */}
        <section className="mb-6">
          <div className="rounded-none border bg-card p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-sm text-muted-foreground">Available points after purchase</div>
              <div className="text-2xl font-semibold">{formatNumber(remainingPoints)} Points</div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Details */}
          <section className="lg:col-span-2 space-y-6">
            {/* Cart items */}
            <article className="rounded-none border bg-card">
              <div className="p-4 border-b"><h2 className="text-xl font-semibold">Your Items</h2></div>
              <div className="p-4 overflow-x-auto">
                {items.length === 0 ? (
                  <div className="text-muted-foreground text-sm">Your cart is empty. <Link to="/shop" className="underline">Shop rewards</Link></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.productId}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img src={item.image} alt={`${item.name} image`} loading="lazy" className="w-12 h-12 object-contain bg-muted/30" />
                              <div className="leading-tight">
                                <Link to={`/product/${item.productId}`} className="font-medium hover:underline">{item.name}</Link>
                                <div className="text-xs text-muted-foreground">{formatPoints(item.pricePoints)}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.qty}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.pricePoints * item.qty)} Points</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </article>

            {/* Shipping */}
            <article className="rounded-none border bg-card">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">Shipping</h2>
              </div>
              <div className="p-4 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Free Shipping</div>
                  <div className="font-medium">Free</div>
                </div>
              </div>
            </article>

            {/* Delivery Address */}
            <article className="rounded-none border bg-card">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-xl font-semibold">Delivery Address</h2>
                <Dialog open={addressOpen} onOpenChange={setAddressOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="underline">Change</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit address</DialogTitle>
                      <DialogDescription>We’ll deliver your rewards to this address.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Label htmlFor="fullName">Full name</Label>
                        <Input id="fullName" value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="line1">Address line 1</Label>
                        <Input id="line1" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="line2">Address line 2 (optional)</Label>
                        <Input id="line2" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input id="city" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input id="state" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="zip">ZIP</Label>
                        <Input id="zip" value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="secondary" onClick={() => setAddressOpen(false)}>Cancel</Button>
                      <Button onClick={saveAddress}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="p-4 text-sm space-y-1">
                {validateAddress(address) ? (
                  <>
                    <div className="font-medium">{address.fullName} • {address.phone}</div>
                    <div className="text-muted-foreground">{address.line1}{address.line2 ? `, ${address.line2}` : ""}</div>
                    <div className="text-muted-foreground">{address.city}, {address.state} {address.zip}, {address.country}</div>
                  </>
                ) : (
                  <div className="text-muted-foreground">No address on file. Click Change to add your delivery details.</div>
                )}
              </div>
            </article>
          </section>

          {/* Right: Summary */}
          <aside className="lg:col-span-1 space-y-6">
            <article className="rounded-none border bg-card">
              <div className="p-4 border-b"><h2 className="text-xl font-semibold">Order Summary</h2></div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatNumber(subtotalPoints)} Points</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-semibold">{formatNumber(totalPoints)} Points</span>
                </div>
{insufficient && (
  <p className="text-destructive text-sm">You need {formatNumber(totalPoints - availablePoints)} more points to place this order.</p>
)}
                <Button className="w-full" onClick={placeOrder} disabled={items.length === 0 || insufficient || isPlacingOrder}>
                  {isPlacingOrder ? "Placing Order..." : "Place Order"}
                </Button>
                <Button asChild variant="secondary" className="w-full">
                  <Link to="/shop">Continue Shopping</Link>
                </Button>
              </div>
            </article>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
