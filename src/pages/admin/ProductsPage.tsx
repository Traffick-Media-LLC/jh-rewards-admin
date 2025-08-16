import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatPoints } from "@/lib/pricing";
import ProductCreateDialog from "@/components/admin/ProductCreateDialog";
import ProductEditDialog from "@/components/admin/ProductEditDialog";
import ProductFilters from "@/components/admin/ProductFilters";
import MobileFilters from "@/components/admin/MobileFilters";
import BulkProductActions from "@/components/admin/BulkProductActions";

export function ProductsPage() {
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [productStatusFilter, setProductStatusFilter] = useState("");
  const [productSortBy, setProductSortBy] = useState("created_at_desc");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Products data with filters
  const { data: products, refetch: refetchProducts } = useQuery({
    queryKey: [
      "admin-products",
      productSearchTerm,
      productCategoryFilter,
      productStatusFilter,
      productSortBy,
    ],
    queryFn: async () => {
      let query = supabase.from("products").select("*");

      // Apply search filter
      if (productSearchTerm) {
        query = query.or(`name.ilike.%${productSearchTerm}%,sku.ilike.%${productSearchTerm}%`);
      }

      // Apply category filter
      if (productCategoryFilter && productCategoryFilter !== "all") {
        query = query.eq("category", productCategoryFilter);
      }

      // Apply status filter
      if (productStatusFilter && productStatusFilter !== "all") {
        query = query.eq("active", productStatusFilter === "active");
      }

      // Apply sorting
      const [sortField, sortDirection] = productSortBy.split("_");
      const ascending = sortDirection === "asc";
      if (sortField === "price") {
        query = query.order("price_cents", { ascending });
      } else if (sortField === "inventory") {
        query = query.order("inventory", { ascending });
      } else if (sortField === "name") {
        query = query.order("name", { ascending });
      } else {
        query = query.order("created_at", { ascending });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const toggleProductStatus = async (productId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({
          active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId);

      if (error) throw error;
      toast.success(`Product ${active ? "activated" : "deactivated"}`);
      refetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getInventoryBadgeVariant = (inventory: number) => {
    if (inventory === 0) return "destructive";
    if (inventory < 10) return "secondary";
    return "default";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ProductCreateDialog />
          <Button onClick={() => refetchProducts()} className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Management</CardTitle>
          <div className="space-y-4">
            {/* Mobile filters */}
            <MobileFilters
              searchTerm={productSearchTerm}
              onSearchChange={setProductSearchTerm}
              categoryFilter={productCategoryFilter}
              onCategoryChange={setProductCategoryFilter}
              statusFilter={productStatusFilter}
              onStatusChange={setProductStatusFilter}
              sortBy={productSortBy}
              onSortChange={setProductSortBy}
              onClearFilters={() => {
                setProductSearchTerm("");
                setProductCategoryFilter("");
                setProductStatusFilter("");
                setProductSortBy("created_at_desc");
              }}
            />
            
            {/* Desktop filters */}
            <ProductFilters
              searchTerm={productSearchTerm}
              onSearchChange={setProductSearchTerm}
              categoryFilter={productCategoryFilter}
              onCategoryChange={setProductCategoryFilter}
              statusFilter={productStatusFilter}
              onStatusChange={setProductStatusFilter}
              sortBy={productSortBy}
              onSortChange={setProductSortBy}
              onClearFilters={() => {
                setProductSearchTerm("");
                setProductCategoryFilter("");
                setProductStatusFilter("");
                setProductSortBy("created_at_desc");
              }}
            />
            {selectedProducts.length > 0 && (
              <BulkProductActions
                selectedProducts={selectedProducts}
                products={products || []}
                onSelectionChange={setSelectedProducts}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:gap-4">
            {products?.map((product) => (
              <div
                key={product.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg"
              >
                {/* Mobile layout */}
                <div className="block sm:hidden space-y-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts([...selectedProducts, product.id]);
                        } else {
                          setSelectedProducts(selectedProducts.filter((id) => id !== product.id));
                        }
                      }}
                      className="rounded mt-1 shrink-0"
                    />
                    
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg shrink-0"
                      />
                    )}
                    
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                      <div className="font-medium text-sm mt-1">
                        {formatPoints(product.price_cents)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">{product.category}</Badge>
                    <Badge variant={getInventoryBadgeVariant(product.inventory)} className="text-xs">
                      {product.inventory} stock
                    </Badge>
                    {product.active ? (
                      <Badge variant="default" className="text-xs">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={product.active}
                        onCheckedChange={(checked) => toggleProductStatus(product.id, checked)}
                        className="scale-75"
                      />
                      <span className="text-xs text-muted-foreground">
                        {product.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <ProductEditDialog product={product} />
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden sm:flex sm:items-center sm:justify-between sm:w-full">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts([...selectedProducts, product.id]);
                        } else {
                          setSelectedProducts(selectedProducts.filter((id) => id !== product.id));
                        }
                      }}
                      className="rounded"
                    />
                    
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.sku}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{product.category}</Badge>
                        <Badge variant={getInventoryBadgeVariant(product.inventory)}>
                          {product.inventory} in stock
                        </Badge>
                        {product.active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatPoints(product.price_cents)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Cost: {formatPoints((product as any).cost_cents || 0)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={product.active}
                        onCheckedChange={(checked) => toggleProductStatus(product.id, checked)}
                      />
                      <ProductEditDialog product={product} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}