import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ProductImageUploader from "./ProductImageUploader";
import ProductVariantManager from "./ProductVariantManager";
import CategorySelect from "./CategorySelect";

interface Product {
  id: string;
  name: string;
  description?: string;
  price_cents: number;
  sale_price_cents?: number;
  category?: string;
  sku?: string;
  inventory: number;
  active: boolean;
  homepage: boolean;
  image_url?: string;
}

interface ProductEditDialogProps {
  product: Product;
}

const ProductEditDialog: React.FC<ProductEditDialogProps> = ({ product }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(product.image_url || "");
  const [category, setCategory] = useState(product.category || "");
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      
      const { error } = await supabase
        .from("products")
        .update({
          name: formData.get("name") as string,
          description: formData.get("description") as string,
          price_cents: parseInt(formData.get("price_cents") as string) || 0,
          sale_price_cents: formData.get("sale_price_cents") ? parseInt(formData.get("sale_price_cents") as string) : null,
          category: category,
          sku: formData.get("sku") as string,
          inventory: parseInt(formData.get("inventory") as string) || 0,
          active: formData.get("active") === "on",
          homepage: formData.get("homepage") === "on",
          image_url: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", product.id);

      if (error) throw error;

      toast.success("Product updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (error) throw error;

      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update product information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="media">Images</TabsTrigger>
              <TabsTrigger value="variants">Variants</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input name="name" defaultValue={product.name} required />
                </div>
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input name="sku" defaultValue={product.sku || ""} />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea name="description" rows={3} defaultValue={product.description || ""} />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="price_cents">Price (Points)</Label>
                  <Input name="price_cents" type="number" min="0" defaultValue={product.price_cents} required />
                </div>
                <div>
                  <Label htmlFor="sale_price_cents">Sale Price (Optional)</Label>
                  <Input name="sale_price_cents" type="number" min="0" defaultValue={product.sale_price_cents || ""} />
                </div>
                <div>
                  <Label htmlFor="inventory">Inventory</Label>
                  <Input name="inventory" type="number" min="0" defaultValue={product.inventory} />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <CategorySelect 
                  value={category} 
                  onValueChange={setCategory} 
                  className="w-full" 
                />
              </div>

              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Switch name="active" defaultChecked={product.active} />
                  <Label htmlFor="active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch name="homepage" defaultChecked={product.homepage} />
                  <Label htmlFor="homepage">Featured on Homepage</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
                <ProductImageUploader
                  productId={product.id}
                  onImagesUploaded={(urls) => setImageUrl(urls[0] || "")}
                  currentImages={imageUrl ? [imageUrl] : []}
                />
            </TabsContent>

            <TabsContent value="variants" className="space-y-4">
              <ProductVariantManager productId={product.id} />
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="p-4 border rounded">
                <h3 className="font-medium mb-2">Danger Zone</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This action cannot be undone. This will permanently delete the product.
                </p>
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Product
                </Button>
              </div>
            </TabsContent>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Updating..." : "Update Product"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditDialog;