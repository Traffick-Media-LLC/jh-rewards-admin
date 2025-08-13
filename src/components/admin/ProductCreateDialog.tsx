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
import { Plus } from "lucide-react";
import { toast } from "sonner";
import ProductImageUploader from "./ProductImageUploader";
import CategorySelect from "./CategorySelect";

const ProductCreateDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("");
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      
      const { error } = await supabase
        .from("products")
        .insert({
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
          currency: "USD"
        });

      if (error) throw error;

      toast.success("Product created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      setOpen(false);
      setImageUrl("");
      setCategory("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
          <DialogDescription>
            Add a new product to the catalog
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="media">Images</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input name="name" required />
                </div>
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input name="sku" />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea name="description" rows={3} />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="price_cents">Price (Points)</Label>
                  <Input name="price_cents" type="number" min="0" required />
                </div>
                <div>
                  <Label htmlFor="sale_price_cents">Sale Price (Optional)</Label>
                  <Input name="sale_price_cents" type="number" min="0" />
                </div>
                <div>
                  <Label htmlFor="inventory">Inventory</Label>
                  <Input name="inventory" type="number" min="0" defaultValue="0" />
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
                  <Switch name="active" defaultChecked />
                  <Label htmlFor="active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch name="homepage" />
                  <Label htmlFor="homepage">Featured on Homepage</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
                <ProductImageUploader
                  onImagesUploaded={(urls) => setImageUrl(urls[0] || "")}
                  currentImages={imageUrl ? [imageUrl] : []}
                />
            </TabsContent>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Creating..." : "Create Product"}
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

export default ProductCreateDialog;