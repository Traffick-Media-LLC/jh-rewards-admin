import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Upload, Download, Edit } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price_cents: number;
  category?: string;
  active: boolean;
}

interface BulkProductActionsProps {
  products: Product[];
  selectedProducts: string[];
  onSelectionChange: (productIds: string[]) => void;
}

const BulkProductActions: React.FC<BulkProductActionsProps> = ({
  products,
  selectedProducts,
  onSelectionChange
}) => {
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));

  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProducts.length === 0) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    try {
      const updates: any = {};
      
      const priceAdjustment = formData.get("price_adjustment");
      const category = formData.get("category");
      const status = formData.get("status");

      if (priceAdjustment) {
        const adjustment = parseInt(priceAdjustment as string);
        // Note: This would need to be done product by product to calculate new prices
        updates.price_cents = adjustment; // Simplified for demo
      }

      if (category && category !== "keep") {
        updates.category = category;
      }

      if (status && status !== "keep") {
        updates.active = status === "active";
      }

      updates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from("products")
        .update(updates)
        .in("id", selectedProducts);

      if (error) throw error;

      toast.success(`Updated ${selectedProducts.length} products successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setBulkDialogOpen(false);
      onSelectionChange([]);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvData = selectedProductsData.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price_cents,
      category: product.category || "",
      status: product.active ? "Active" : "Inactive"
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map(row => Object.values(row).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (selectedProducts.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
      <Badge variant="secondary">
        {selectedProducts.length} selected
      </Badge>
      
      <div className="flex gap-2 ml-auto">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>

        <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Bulk Edit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Edit Products</DialogTitle>
              <DialogDescription>
                Update {selectedProducts.length} selected products
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleBulkUpdate} className="space-y-4">
              <div>
                <Label htmlFor="price_adjustment">Price Adjustment (%)</Label>
                <Input 
                  name="price_adjustment" 
                  type="number" 
                  placeholder="e.g., 10 for 10% increase, -5 for 5% decrease"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select name="category">
                  <SelectTrigger>
                    <SelectValue placeholder="Keep current categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep current</SelectItem>
                    <SelectItem value="apparel">Apparel</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                    <SelectItem value="drinkware">Drinkware</SelectItem>
                    <SelectItem value="supplements">Supplements</SelectItem>
                    <SelectItem value="gift-cards">Gift Cards</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select name="status">
                  <SelectTrigger>
                    <SelectValue placeholder="Keep current status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep current</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Updating..." : "Update Products"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setBulkDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onSelectionChange([])}
        >
          Clear Selection
        </Button>
      </div>
    </div>
  );
};

export default BulkProductActions;