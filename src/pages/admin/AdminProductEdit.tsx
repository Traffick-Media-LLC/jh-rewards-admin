import React, { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save, X } from "lucide-react";
import { VariantManager } from "@/components/admin/VariantManager";
import { Product, VariantOption, ProductVariant } from "./AdminProducts";

const AdminProductEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = "Edit Product | Admin";
  }, []);

  // Fetch product data
  const { data: product, isLoading } = useQuery({
    queryKey: ['admin-product', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Product;
    }
  });

  // Fetch categories
  const { data: allProducts = [] } = useQuery({
    queryKey: ['admin-products-for-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch existing variant options
  const { data: existingVariantOptions = [] } = useQuery({
    queryKey: ['variant-options', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('variant_options')
        .select('*')
        .eq('product_id', id);
      
      if (error) throw error;
      return data as VariantOption[];
    }
  });

  // Fetch existing product variants
  const { data: existingProductVariants = [] } = useQuery({
    queryKey: ['product-variants', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', id);
      
      if (error) throw error;
      return data as ProductVariant[];
    }
  });

  const categories = React.useMemo(() => {
    const uniqueCategories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
    if (uniqueCategories.length === 0) {
      return ["Electronics", "houshold", "Merch", "Other", "sports & Outdoor"];
    }
    return uniqueCategories.sort();
  }, [allProducts]);

  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editVariantOptions, setEditVariantOptions] = useState<VariantOption[]>([]);
  const [editProductVariants, setEditProductVariants] = useState<ProductVariant[]>([]);

  // Initialize form data when product loads
  useEffect(() => {
    if (product) {
      setEditProduct(product);
      setSelectedCategory(product.category || "");
    }
  }, [product]);

  // Initialize variant data when loaded
  useEffect(() => {
    if (existingVariantOptions.length > 0) {
      setEditVariantOptions(existingVariantOptions);
    }
  }, [existingVariantOptions]);

  useEffect(() => {
    if (existingProductVariants.length > 0) {
      setEditProductVariants(existingProductVariants);
    }
  }, [existingProductVariants]);

  // Memoized change detection
  const hasChanges = useMemo(() => {
    if (!product || !editProduct) return false;
    
    return JSON.stringify(product) !== JSON.stringify(editProduct) || 
           selectedCategory !== (product.category || "") ||
           JSON.stringify(editVariantOptions) !== JSON.stringify(existingVariantOptions) ||
           JSON.stringify(editProductVariants) !== JSON.stringify(existingProductVariants);
  }, [product, editProduct, selectedCategory, editVariantOptions, existingVariantOptions, editProductVariants, existingProductVariants]);

  // Track changes
  useEffect(() => {
    setHasUnsavedChanges(hasChanges);
  }, [hasChanges]);

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<Product> & { id: string }) => {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product", id] });
      queryClient.invalidateQueries({ queryKey: ["variant-options", id] });
      queryClient.invalidateQueries({ queryKey: ["product-variants", id] });
      toast({ title: "Product updated successfully" });
      setHasUnsavedChanges(false);
    },
    onError: (e: any) => {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    },
  });

  // Variant options mutations
  const saveVariantOptions = async (productId: string, options: VariantOption[]) => {
    // Delete existing options
    await supabase
      .from('variant_options')
      .delete()
      .eq('product_id', productId);

    // Insert new options
    if (options.length > 0) {
      const optionsToInsert = options.map(option => ({
        product_id: productId,
        variant_type: option.variant_type,
        option_name: option.option_name,
        sort_order: option.sort_order
      }));

      const { error } = await supabase
        .from('variant_options')
        .insert(optionsToInsert);
      
      if (error) throw error;
    }
  };

  // Product variants mutations
  const saveProductVariants = async (productId: string, variants: ProductVariant[]) => {
    // Delete existing variants
    await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', productId);

    // Insert new variants
    if (variants.length > 0) {
      const variantsToInsert = variants.map(variant => ({
        product_id: productId,
        variant_combination: variant.variant_combination,
        sku_suffix: variant.sku_suffix,
        price_adjustment_cents: variant.price_adjustment_cents,
        inventory: variant.inventory,
        active: variant.active
      }));

      const { error } = await supabase
        .from('product_variants')
        .insert(variantsToInsert);
      
      if (error) throw error;
    }
  };

  const saveProduct = async () => {
    if (!editProduct) return;
    
    setIsSaving(true);
    try {
      // Save main product data
      await updateMutation.mutateAsync({
        id: editProduct.id,
        name: editProduct.name,
        price_cents: editProduct.price_cents,
        sale_price_cents: editProduct.sale_price_cents,
        inventory: editProduct.inventory,
        active: editProduct.active,
        homepage: editProduct.homepage,
        sku: editProduct.sku,
        description: editProduct.description,
        category: selectedCategory || null,
        has_variants: editProduct.has_variants,
        variant_types: editProduct.variant_types,
      });

      // Save variant data if variants are enabled
      if (editProduct.has_variants) {
        await saveVariantOptions(editProduct.id, editVariantOptions);
        await saveProductVariants(editProduct.id, editProductVariants);
      } else {
        // Clean up variant data if variants are disabled
        await saveVariantOptions(editProduct.id, []);
        await saveProductVariants(editProduct.id, []);
      }

    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
        navigate("/admin/products");
      }
    } else {
      navigate("/admin/products");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product || !editProduct) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Product not found</p>
        <Button onClick={() => navigate("/admin/products")} variant="outline" className="mt-4">
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Edit Product</h1>
            <p className="text-sm text-muted-foreground">{editProduct.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleBack} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={saveProduct} disabled={isSaving || !hasUnsavedChanges}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="product-name">Product Name</Label>
                  <Input
                    id="product-name"
                    value={editProduct.name}
                    onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <Label htmlFor="product-sku">SKU</Label>
                  <Input
                    id="product-sku"
                    value={editProduct.sku || ""}
                    onChange={(e) => setEditProduct({ ...editProduct, sku: e.target.value })}
                    placeholder="Product SKU"
                  />
                </div>
                <div>
                  <Label htmlFor="product-category">Category</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={selectedCategory === category}
                          onCheckedChange={(checked) => {
                            setSelectedCategory(checked ? category : "");
                          }}
                        />
                        <Label htmlFor={`category-${category}`} className="text-sm">
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="product-description">Description</Label>
                  <Textarea
                    id="product-description"
                    value={editProduct.description || ""}
                    onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                    placeholder="Product description"
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variants */}
          <Card>
            <CardHeader>
              <CardTitle>Product Variants</CardTitle>
            </CardHeader>
            <CardContent>
              <VariantManager
                productId={editProduct.id}
                hasVariants={editProduct.has_variants || false}
                variantTypes={editProduct.variant_types || []}
                initialVariantOptions={editVariantOptions}
                initialProductVariants={editProductVariants}
                onVariantChange={(hasVariants, variantTypes, options, variants) => {
                  setEditProduct({
                    ...editProduct,
                    has_variants: hasVariants,
                    variant_types: variantTypes
                  });
                  setEditVariantOptions(options);
                  setEditProductVariants(variants);
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="product-price">Price (points)</Label>
                <Input
                  id="product-price"
                  type="number"
                  value={editProduct.price_cents}
                  onChange={(e) => setEditProduct({ ...editProduct, price_cents: parseInt(e.target.value || "0") })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="product-sale-price">Sale Price (points)</Label>
                <Input
                  id="product-sale-price"
                  type="number"
                  value={editProduct.sale_price_cents || ""}
                  onChange={(e) => setEditProduct({ 
                    ...editProduct, 
                    sale_price_cents: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="product-inventory">Inventory</Label>
                <Input
                  id="product-inventory"
                  type="number"
                  value={editProduct.inventory}
                  onChange={(e) => setEditProduct({ ...editProduct, inventory: parseInt(e.target.value || "0") })}
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="product-active">Active</Label>
                  <p className="text-sm text-muted-foreground">Product is available for purchase</p>
                </div>
                <Switch
                  id="product-active"
                  checked={editProduct.active}
                  onCheckedChange={(checked) => setEditProduct({ ...editProduct, active: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="product-homepage">Featured</Label>
                  <p className="text-sm text-muted-foreground">Show on homepage</p>
                </div>
                <Switch
                  id="product-homepage"
                  checked={editProduct.homepage}
                  onCheckedChange={(checked) => setEditProduct({ ...editProduct, homepage: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save reminder */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">You have unsaved changes</p>
            <Button size="sm" onClick={saveProduct} disabled={isSaving}>
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductEdit;