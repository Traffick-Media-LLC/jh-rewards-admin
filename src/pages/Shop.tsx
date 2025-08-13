import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { formatPoints } from "@/lib/pricing";
import { useCart } from "@/contexts/CartContext";
import useProfile from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Simple SEO helper without external deps
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
    link.href = canonical || `${window.location.origin}/shop`;
  }, [title, description, canonical]);
}

type SortKey = "featured" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

interface Product {
  id: string;
  name: string;
  price_cents: number;
  sale_price_cents?: number | null;
  category: string;
  image_url?: string;
  description?: string;
  inventory: number;
  active: boolean;
  has_variants?: boolean;
  variant_types?: string[];
  shopify_variant_id?: string | null;
}

const Shop: React.FC = () => {
  useSEO({
    title: "Shop | Juice Head Rewards",
    description: "Browse rewards: e-liquid, disposables, pouches, swag, and gift cards.",
    canonical: `${window.location.origin}/shop`,
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortKey>("featured");
  const { profile } = useProfile();
  const userPoints = profile?.points_balance ?? 0;
  const { addItem, openCart } = useCart();

  // Fetch products from Supabase
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data as Product[];
    }
  });

  // Get unique categories from products
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(p => p.category))].sort();
    return uniqueCategories;
  }, [products]);

  const toggleCategory = (cat: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const list = products.filter(p => selected.size === 0 || selected.has(p.category));
    switch (sort) {
      case "price-asc":
        return [...list].sort((a, b) => a.price_cents - b.price_cents);
      case "price-desc":
        return [...list].sort((a, b) => b.price_cents - a.price_cents);
      case "name-asc":
        return [...list].sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return [...list].sort((a, b) => b.name.localeCompare(a.name));
      default:
        return list; // featured
    }
  }, [products, selected, sort]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <section className="mb-8 pb-6" aria-label="Shop hero">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7">
                <h1 className="text-4xl font-bold text-foreground">Shop Rewards</h1>
                <p className="text-muted-foreground mt-3 max-w-prose">
                  Browse rewards: e-liquid, disposables, pouches, swag, and gift cards. Filter and sort to find exactly what you want.
                </p>
                <Button className="mt-6" size="lg" asChild aria-label="Go to My Account">
                  <Link to="/account">MY ACCOUNT</Link>
                </Button>
              </div>
              <div className="md:col-span-5 flex justify-center">
                <div className="relative w-56 h-56">
                  <img
                    src="/lovable-uploads/2e28fb7a-9357-4c19-ba47-a4225791d584.png"
                    alt="Rewards points badge background"
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center drop-shadow">
                      <div className="text-4xl font-bold">{userPoints}</div>
                      <div className="text-lg">POINTS</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

        <section className="grid grid-cols-1 md:grid-cols-12 gap-8" aria-label="Shop layout">
          {/* Sidebar */}
          <aside className="md:col-span-3 space-y-6" aria-label="Filters">
            <Card>
              <CardHeader className="pb-2">
                <h2 className="text-lg font-semibold text-foreground">Categories</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories.map((cat) => (
                  <div key={cat} className="flex items-center gap-3">
                    <Checkbox id={`cat-${cat}`} checked={selected.has(cat)} onCheckedChange={() => toggleCategory(cat)} />
                    <Label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer text-foreground">{cat}</Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <h2 className="text-lg font-semibold text-foreground">Sort</h2>
              </CardHeader>
              <CardContent>
                <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Featured" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="name-asc">Name: A to Z</SelectItem>
                    <SelectItem value="name-desc">Name: Z to A</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </aside>

          {/* Product Grid */}
          <section className="md:col-span-9" aria-label="Products">
            {isLoading ? (
              <p className="text-muted-foreground">Loading products...</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground">No products match your filters.</p>
            ) : (
              <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p) => (
                  <Card key={p.id} className="overflow-hidden group hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
                    <CardContent className="p-0">
                      <Link to={`/product/${p.id}`} aria-label={`View ${p.name}`}>
                        <div className="aspect-[4/3] w-full bg-card border-b">
                          <img
                            src={p.image_url || '/placeholder.svg'}
                            alt={`${p.name} product image`}
                            loading="lazy"
                            className="w-full h-full object-contain p-4"
                          />
                        </div>
                      </Link>
                    </CardContent>
                    <div className="flex flex-col flex-1">
                      <CardHeader className="p-4 pb-2 flex-1">
                        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                          <Link to={`/product/${p.id}`} className="hover:underline group-hover:text-primary transition-colors">{p.name}</Link>
                        </h3>
                      </CardHeader>
                      <CardFooter className="flex items-center justify-between p-4 pt-2">
                        <div className="text-sm">
                          {p.sale_price_cents ? (
                            <div className="space-y-1">
                              <span className="text-muted-foreground line-through text-xs">{formatPoints(p.price_cents)}</span>
                              <div className="text-destructive font-medium">{formatPoints(p.sale_price_cents)}</div>
                            </div>
                          ) : (
                            <span className="text-foreground font-medium">{formatPoints(p.price_cents)}</span>
                          )}
                        </div>
<Button 
  size="sm" 
  variant="secondary" 
  aria-label={`Add ${p.name} to cart`} 
  disabled={!p.has_variants && !p.shopify_variant_id}
  onClick={() => { 
    if (p.has_variants) {
      // Navigate to product page for variant selection
      window.location.href = `/product/${p.id}`;
    } else {
      if (!p.shopify_variant_id) return; // guard
      // Convert database product to cart product format
      const cartProduct = {
        id: p.id,
        name: p.name,
        price: p.price_cents,
        category: p.category as any,
        image: p.image_url || '/placeholder.svg',
        description: p.description
      };
      addItem(cartProduct as any, 1); 
      openCart(); 
    }
  }}
>
 {p.has_variants ? "View Options" : (!p.shopify_variant_id ? "Unavailable" : "Add to Cart")}
</Button>
                      </CardFooter>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Shop;
