import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
}

interface ProductEditDialogProps {
  product: Product;
}

const ProductEditDialog: React.FC<ProductEditDialogProps> = ({ product }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
          category: formData.get("category") as string,
          sku: formData.get("sku") as string,
          inventory: parseInt(formData.get("inventory") as string) || 0,
          active: formData.get("active") === "on",
          homepage: formData.get("homepage") === "on",
          updated_at: new Date().toISOString()
        })
        .eq("id", product.id);

      if (error) throw error;

      toast.success("Product updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update product information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Select name="category" defaultValue={product.category || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apparel">Apparel</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
                <SelectItem value="drinkware">Drinkware</SelectItem>
                <SelectItem value="supplements">Supplements</SelectItem>
                <SelectItem value="gift-cards">Gift Cards</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
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

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Updating..." : "Update Product"}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditDialog;