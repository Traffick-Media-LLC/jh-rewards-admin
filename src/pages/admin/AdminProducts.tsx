import React, { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ImageUploader from "@/components/admin/ImageUploader";
import LocalImageUploader, { StagedImage } from "@/components/admin/LocalImageUploader";
import { Image as ImageIcon, MoreHorizontal } from "lucide-react";
import { formatPriceWithSale } from "@/lib/pricing";
import { VariantManager } from "@/components/admin/VariantManager";

// Local type to avoid TS mismatch with generated types
export type Product = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  sale_price_cents: number | null;
  currency: string;
  sku: string | null;
  image_url: string | null;
  category: string | null;
  inventory: number;
  active: boolean;
  homepage: boolean;
  has_variants: boolean;
  variant_types: string[];
  created_at: string;
  updated_at: string;
};

export type VariantOption = {
  id: string;
  product_id: string;
  variant_type: string;
  option_name: string;
  sort_order: number;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  variant_combination: Record<string, string>;
  sku_suffix: string | null;
  price_adjustment_cents: number;
  inventory: number;
  active: boolean;
};

const AdminProducts: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => { document.title = "Admin | Products"; }, []);
  const { toast } = useToast();
  const qc = useQueryClient();

  // Fetch products from Supabase
  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Product[];
    }
  });

  // Get unique categories from products
  const categories = useMemo(() => {
    // Get unique categories from products, with fallback to default categories if none exist
    const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
    if (uniqueCategories.length === 0) {
      return ["Electronics", "houshold", "Merch", "Other", "sports & Outdoor"];
    }
    return uniqueCategories.sort();
  }, [products]);

  const addMutation = useMutation({
    mutationFn: async (payload: Partial<Product>) => {
      const { data, error } = await (supabase as any).from("products").insert({
        name: payload.name,
        price_cents: payload.price_cents ?? 0,
        sale_price_cents: payload.sale_price_cents || null,
        currency: payload.currency || 'USD',
        inventory: payload.inventory ?? 0,
        active: payload.active ?? true,
        homepage: payload.homepage ?? false,
        has_variants: payload.has_variants ?? false,
        variant_types: payload.variant_types ?? [],
        sku: payload.sku || null,
        description: payload.description || null,
        image_url: payload.image_url || null,
        category: payload.category || null,
      }).select().single();
      if (error) throw error;
      
      // Log admin action
      await supabase.rpc('log_admin_action', {
        _action_type: 'product_create',
        _resource_type: 'product',
        _resource_id: data.id,
        _details: { name: data.name, price_cents: data.price_cents }
      });
      
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); toast({ title: "Product created" }); },
    onError: (e: any) => toast({ title: "Create failed", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<Product> & { id: string }) => {
      const { error } = await (supabase as any).from("products").update(payload).eq("id", payload.id);
      if (error) throw error;
      
      // Log admin action
      await supabase.rpc('log_admin_action', {
        _action_type: 'product_update',
        _resource_type: 'product',
        _resource_id: payload.id,
        _details: payload
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); toast({ title: "Updated" }); },
    onError: (e: any) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Log admin action before deletion
      await supabase.rpc('log_admin_action', {
        _action_type: 'product_delete',
        _resource_type: 'product',
        _resource_id: id,
        _details: {}
      });
      
      const { error } = await (supabase as any).from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); toast({ title: "Deleted" }); },
    onError: (e: any) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

const [newProduct, setNewProduct] = useState<Partial<Product>>({ name: "", price_cents: 0, inventory: 0, active: true, homepage: false, has_variants: false, variant_types: [] });
const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
const [imagesDrawerProduct, setImagesDrawerProduct] = useState<{ id: string; name: string } | null>(null);

// UI state
const [query, setQuery] = useState("");
const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
const [sort, setSort] = useState<"newest" | "price-asc" | "price-desc" | "inventory-desc">("newest");
const [createOpen, setCreateOpen] = useState(false);
const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
const [creating, setCreating] = useState(false);
const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);

const filteredProducts = useMemo(() => {
  if (!products) return [] as Product[];
  let list = [...products];
  const q = query.trim().toLowerCase();
  if (q) {
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.sku ?? "").toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q)
    );
  }
  if (status !== "all") {
    const isActive = status === "active";
    list = list.filter(p => p.active === isActive);
  }
  switch (sort) {
    case "price-asc":
      list.sort((a,b) => a.price_cents - b.price_cents); break;
    case "price-desc":
      list.sort((a,b) => b.price_cents - a.price_cents); break;
    case "inventory-desc":
      list.sort((a,b) => b.inventory - a.inventory); break;
    default:
      list.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  return list;
}, [products, query, status, sort]);

const createWithImages = async () => {
  try {
    const payload = newProduct;
    if (!payload.name || payload.name.trim() === "") {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setCreating(true);
    // 1) Create product first
    const { data, error } = await (supabase as any)
      .from("products")
      .insert({
        name: payload.name,
        price_cents: payload.price_cents ?? 0,
        sale_price_cents: payload.sale_price_cents || null,
        currency: payload.currency || 'USD',
        inventory: payload.inventory ?? 0,
        active: payload.active ?? true,
        homepage: payload.homepage ?? false,
        sku: payload.sku || null,
        description: payload.description || null,
        image_url: null,
        category: selectedCategories.length > 0 ? selectedCategories[0] : null,
      })
      .select("*")
      .single();
    if (error) throw error;

    // 2) If any staged images, upload them and insert product_images rows
    if (stagedImages.length) {
      const bucket = (supabase as any).storage.from("rewards-products");
      let sort = 1;
      let firstCardUrl: string | null = null;
      for (const img of stagedImages) {
        const base = `products/${data.id}/${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const fullPath = `${base}-full.webp`;
        const cardPath = `${base}-card.webp`;
        const thumbPath = `${base}-thumb.webp`;

        const { error: up1 } = await bucket.upload(fullPath, img.fullBlob, { contentType: "image/webp" });
        if (up1) throw up1;
        const { error: up2 } = await bucket.upload(cardPath, img.cardBlob, { contentType: "image/webp" });
        if (up2) throw up2;
        const { error: up3 } = await bucket.upload(thumbPath, img.thumbBlob, { contentType: "image/webp" });
        if (up3) throw up3;

        const fullUrl = bucket.getPublicUrl(fullPath).data.publicUrl;
        const cardUrl = bucket.getPublicUrl(cardPath).data.publicUrl;
        const thumbUrl = bucket.getPublicUrl(thumbPath).data.publicUrl;
        if (!firstCardUrl) firstCardUrl = cardUrl;

        const { error: insErr } = await (supabase as any)
          .from("product_images")
          .insert({
            product_id: data.id,
            url_full: fullUrl,
            url_card: cardUrl,
            url_thumb: thumbUrl,
            sort,
          });
        if (insErr) throw insErr;
        sort++;
      }
      // 3) Set main image from first upload
      if (firstCardUrl) {
        await (supabase as any)
          .from("products")
          .update({ image_url: firstCardUrl })
          .eq("id", data.id);
      }
    }

    // 4) Finish up
    (qc as any).invalidateQueries({ queryKey: ["admin-products"] });
    toast({ title: "Product created" });
    setCreateOpen(false);
    setNewProduct({ name: "", price_cents: 0, inventory: 0, active: true, homepage: false, has_variants: false, variant_types: [] });
    setSelectedCategories([]);
    setStagedImages([]);
    setVariantOptions([]);
    setProductVariants([]);
  } catch (e: any) {
    toast({ title: "Create failed", description: e.message, variant: "destructive" });
  } finally {
    setCreating(false);
  }
};

const openEditPage = (product: Product) => {
  navigate(`/admin/products/edit/${product.id}`);
};

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Products</h1>
      </header>

      <section aria-label="Product tools" className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex-1">
          <Input placeholder="Search products" value={query} onChange={(e)=>setQuery(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Dialog open={createOpen} onOpenChange={(o)=>{ setCreateOpen(o); if(!o){ setNewProduct({ name: "", price_cents: 0, inventory: 0, active: true, homepage: false, has_variants: false, variant_types: [] }); setSelectedCategories([]); setStagedImages([]); setVariantOptions([]); setProductVariants([]); } }}>
            <DialogTrigger asChild>
              <Button>New product</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create product</DialogTitle>
                <DialogDescription>Add all product details and images in one place.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-3">
                  <Label htmlFor="prod-name">Name</Label>
                  <Input id="prod-name" placeholder="Product name" value={newProduct.name || ""} onChange={(e)=>setNewProduct(p=>({...p,name:e.target.value}))} />
                </div>
                <div>
                  <Label htmlFor="prod-price">Price (points)</Label>
                  <Input id="prod-price" type="number" inputMode="numeric" placeholder="0" value={newProduct.price_cents ?? 0} onChange={(e)=>setNewProduct(p=>({...p,price_cents:parseInt(e.target.value||'0',10)}))} />
                </div>
                <div>
                  <Label htmlFor="prod-sale-price">Sale Price (points)</Label>
                  <Input id="prod-sale-price" type="number" inputMode="numeric" placeholder="Optional" value={newProduct.sale_price_cents ?? ""} onChange={(e)=>setNewProduct(p=>({...p,sale_price_cents:e.target.value ? parseInt(e.target.value,10) : null}))} />
                </div>
                <div>
                  <Label htmlFor="prod-inventory">Inventory</Label>
                  <Input id="prod-inventory" type="number" inputMode="numeric" placeholder="0" value={newProduct.inventory ?? 0} onChange={(e)=>setNewProduct(p=>({...p,inventory:parseInt(e.target.value||'0',10)}))} />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="prod-sku">SKU</Label>
                  <Input id="prod-sku" placeholder="SKU" value={newProduct.sku || ""} onChange={(e)=>setNewProduct(p=>({...p,sku:e.target.value}))} />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="prod-active" className="mr-auto">Active</Label>
                  <Switch id="prod-active" checked={!!newProduct.active} onCheckedChange={(v)=>setNewProduct(p=>({...p,active:v}))} />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="prod-homepage" className="mr-auto">Featured on Homepage</Label>
                  <Switch id="prod-homepage" checked={!!newProduct.homepage} onCheckedChange={(v)=>setNewProduct(p=>({...p,homepage:v}))} />
                </div>
                <div className="md:col-span-6">
                  <Label htmlFor="prod-description">Description</Label>
                  <Textarea id="prod-description" placeholder="Short description" value={newProduct.description ?? ""} onChange={(e)=>setNewProduct(p=>({...p, description: e.target.value}))} />
                </div>
                <div className="md:col-span-6">
                  <Label>Categories</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCategories([category]); // Only allow one category for now
                            } else {
                              setSelectedCategories(selectedCategories.filter(c => c !== category));
                            }
                          }}
                        />
                        <Label htmlFor={`category-${category}`} className="text-sm">{category}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="md:col-span-6">
                  <VariantManager
                    hasVariants={newProduct.has_variants || false}
                    variantTypes={newProduct.variant_types || []}
                    onVariantChange={(hasVariants, variantTypes, options, variants) => {
                      setNewProduct(p => ({ ...p, has_variants: hasVariants, variant_types: variantTypes }));
                      setVariantOptions(options);
                      setProductVariants(variants);
                    }}
                  />
                </div>
                
<div className="flex items-center gap-2 justify-end md:justify-start col-span-full">
  <Button onClick={createWithImages} disabled={creating}>
    {creating ? "Creating..." : "Create"}
  </Button>
</div>
              </div>
<div className="mt-4 border-t pt-4">
  <h3 className="text-sm font-medium">Images</h3>
  <LocalImageUploader staged={stagedImages} onChange={setStagedImages} />
  <p className="text-xs text-muted-foreground">Images will be uploaded after the product is created.</p>
</div>
            </DialogContent>
          </Dialog>
          <Select value={status} onValueChange={(v)=>setStatus(v as any)}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v)=>setSort(v as any)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="inventory-desc">Inventory: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <section aria-label="Products table">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading products...</div>
        ) : filteredProducts.length ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="w-32">Inventory</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="w-12 h-12 bg-muted rounded overflow-hidden">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            No Image
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{p.name}</div>
                        <div className="flex gap-2">
                          {p.category && (
                            <Badge variant="outline" className="text-xs">
                              {p.category}
                            </Badge>
                          )}
                        </div>
                        {p.sku && (
                          <div className="text-xs text-muted-foreground">SKU: {p.sku}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.sale_price_cents && p.sale_price_cents < p.price_cents ? (
                        <div className="space-y-1">
                          <div className="font-medium text-destructive">
                            {formatPriceWithSale(p.price_cents, p.sale_price_cents).salePrice}
                          </div>
                          <div className="text-xs text-muted-foreground line-through">
                            {formatPriceWithSale(p.price_cents, p.sale_price_cents).originalPrice}
                          </div>
                        </div>
                      ) : (
                        <div className="font-medium">
                          {formatPriceWithSale(p.price_cents).display}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMutation.mutate({ id: p.id, inventory: p.inventory - 1 })}
                          disabled={p.inventory <= 0}
                          className="h-6 w-6 p-0"
                        >
                          -
                        </Button>
                        <span className="text-sm font-medium px-2 min-w-8 text-center">{p.inventory}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMutation.mutate({ id: p.id, inventory: p.inventory + 1 })}
                          className="h-6 w-6 p-0"
                        >
                          +
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={p.active ? "default" : "secondary"}
                        onClick={() => updateMutation.mutate({ id: p.id, active: !p.active })}
                        className="h-6 text-xs px-2"
                      >
                        {p.active ? "Active" : "Inactive"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditPage(p)}>
                            Edit Product
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setImagesDrawerProduct({ id: p.id, name: p.name })}>
                            Manage Images
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateMutation.mutate({ id: p.id, sale_price_cents: Math.floor(p.price_cents * 0.8) })}>
                            Apply 80% Sale
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateMutation.mutate({ id: p.id, sale_price_cents: null })}>
                            Remove Sale
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => deleteMutation.mutate(p.id)}
                            className="text-destructive"
                          >
                            Delete Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-6 text-sm text-muted-foreground">No products found</div>
        )}
      </section>

      {imagesDrawerProduct && (
        <Drawer open={!!imagesDrawerProduct} onOpenChange={(open)=>{ if(!open) setImagesDrawerProduct(null) }}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Manage Images — {imagesDrawerProduct.name}</DrawerTitle>
            </DrawerHeader>
            <div className="p-4">
              <ImageUploader productId={imagesDrawerProduct.id} />
            </div>
          </DrawerContent>
        </Drawer>
      )}

    </div>
  );
};

export default AdminProducts;