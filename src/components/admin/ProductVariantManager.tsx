import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, X } from "lucide-react";
import { toast } from "sonner";

interface ProductVariantManagerProps {
  productId: string;
}

interface VariantOption {
  id: string;
  variant_type: string;
  option_name: string;
  sort_order: number;
}

interface ProductVariant {
  id: string;
  variant_combination: Record<string, string>;
  price_adjustment_cents: number;
  inventory: number;
  active: boolean;
  sku_suffix?: string;
}

const ProductVariantManager: React.FC<ProductVariantManagerProps> = ({ productId }) => {
  const [addingVariantType, setAddingVariantType] = useState(false);
  const [newVariantType, setNewVariantType] = useState("");
  const [newOptionName, setNewOptionName] = useState("");
  const queryClient = useQueryClient();

  // Fetch variant options
  const { data: variantOptions = [] } = useQuery({
    queryKey: ["variant-options", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("variant_options")
        .select("*")
        .eq("product_id", productId)
        .order("variant_type")
        .order("sort_order");
      
      if (error) throw error;
      return data as VariantOption[];
    }
  });

  // Fetch product variants
  const { data: productVariants = [] } = useQuery({
    queryKey: ["product-variants", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId);
      
      if (error) throw error;
      return data as ProductVariant[];
    }
  });

  // Group variant options by type
  const variantOptionsByType = variantOptions.reduce((acc, option) => {
    if (!acc[option.variant_type]) {
      acc[option.variant_type] = [];
    }
    acc[option.variant_type].push(option);
    return acc;
  }, {} as Record<string, VariantOption[]>);

  const addVariantOption = async () => {
    if (!newVariantType || !newOptionName) return;

    try {
      const { error } = await supabase
        .from("variant_options")
        .insert({
          product_id: productId,
          variant_type: newVariantType.toLowerCase(),
          option_name: newOptionName,
          sort_order: 0
        });

      if (error) throw error;

      toast.success("Variant option added");
      queryClient.invalidateQueries({ queryKey: ["variant-options", productId] });
      setNewVariantType("");
      setNewOptionName("");
      setAddingVariantType(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteVariantOption = async (optionId: string) => {
    if (!confirm("Are you sure you want to delete this variant option?")) return;

    try {
      const { error } = await supabase
        .from("variant_options")
        .delete()
        .eq("id", optionId);

      if (error) throw error;

      toast.success("Variant option deleted");
      queryClient.invalidateQueries({ queryKey: ["variant-options", productId] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const generateVariantCombinations = async () => {
    const variantTypes = Object.keys(variantOptionsByType);
    if (variantTypes.length === 0) {
      toast.error("Add variant options first");
      return;
    }

    try {
      // Generate all possible combinations
      const combinations: Record<string, string>[] = [];
      
      const generate = (index: number, current: Record<string, string>) => {
        if (index === variantTypes.length) {
          combinations.push({ ...current });
          return;
        }
        
        const variantType = variantTypes[index];
        const options = variantOptionsByType[variantType];
        
        for (const option of options) {
          current[variantType] = option.option_name;
          generate(index + 1, current);
        }
      };
      
      generate(0, {});

      // Insert combinations that don't already exist
      const existingCombinations = productVariants.map(v => JSON.stringify(v.variant_combination));
      
      const newCombinations = combinations.filter(combo => 
        !existingCombinations.includes(JSON.stringify(combo))
      );

      if (newCombinations.length === 0) {
        toast.info("All combinations already exist");
        return;
      }

      const { error } = await supabase
        .from("product_variants")
        .insert(
          newCombinations.map(combo => ({
            product_id: productId,
            variant_combination: combo,
            price_adjustment_cents: 0,
            inventory: 0,
            active: true
          }))
        );

      if (error) throw error;

      toast.success(`Generated ${newCombinations.length} new variant combinations`);
      queryClient.invalidateQueries({ queryKey: ["product-variants", productId] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateVariant = async (variantId: string, updates: Partial<ProductVariant>) => {
    try {
      const { error } = await supabase
        .from("product_variants")
        .update(updates)
        .eq("id", variantId);

      if (error) throw error;

      toast.success("Variant updated");
      queryClient.invalidateQueries({ queryKey: ["product-variants", productId] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteVariant = async (variantId: string) => {
    if (!confirm("Are you sure you want to delete this variant?")) return;

    try {
      const { error } = await supabase
        .from("product_variants")
        .delete()
        .eq("id", variantId);

      if (error) throw error;

      toast.success("Variant deleted");
      queryClient.invalidateQueries({ queryKey: ["product-variants", productId] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Variant Options Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Variant Options
            <Button 
              size="sm" 
              onClick={() => setAddingVariantType(true)}
              disabled={addingVariantType}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {addingVariantType && (
            <div className="flex gap-2 p-3 border rounded">
              <Input
                placeholder="Variant type (e.g., size, color)"
                value={newVariantType}
                onChange={(e) => setNewVariantType(e.target.value)}
              />
              <Input
                placeholder="Option name (e.g., Large, Red)"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
              />
              <Button onClick={addVariantOption} size="sm">
                Add
              </Button>
              <Button 
                onClick={() => setAddingVariantType(false)} 
                variant="outline" 
                size="sm"
              >
                Cancel
              </Button>
            </div>
          )}

          {Object.entries(variantOptionsByType).map(([variantType, options]) => (
            <div key={variantType} className="space-y-2">
              <Label className="capitalize font-medium">{variantType}</Label>
              <div className="flex flex-wrap gap-2">
                {options.map((option) => (
                  <Badge key={option.id} variant="outline" className="flex items-center gap-1">
                    {option.option_name}
                    <button
                      onClick={() => deleteVariantOption(option.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Product Variants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Product Variants
            <Button 
              size="sm" 
              onClick={generateVariantCombinations}
              disabled={Object.keys(variantOptionsByType).length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Combinations
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productVariants.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No variants created yet. Add variant options and generate combinations.
            </p>
          ) : (
            <div className="space-y-4">
              {productVariants.map((variant) => (
                <div key={variant.id} className="border rounded p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-2">
                      {Object.entries(variant.variant_combination).map(([type, value]) => (
                        <Badge key={type} variant="secondary">
                          {type}: {value}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteVariant(variant.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <Label>Price Adjustment (Points)</Label>
                      <Input
                        type="number"
                        value={variant.price_adjustment_cents}
                        onChange={(e) => updateVariant(variant.id, { 
                          price_adjustment_cents: parseInt(e.target.value) || 0 
                        })}
                      />
                    </div>
                    <div>
                      <Label>Inventory</Label>
                      <Input
                        type="number"
                        value={variant.inventory}
                        onChange={(e) => updateVariant(variant.id, { 
                          inventory: parseInt(e.target.value) || 0 
                        })}
                      />
                    </div>
                    <div>
                      <Label>SKU Suffix</Label>
                      <Input
                        value={variant.sku_suffix || ""}
                        onChange={(e) => updateVariant(variant.id, { 
                          sku_suffix: e.target.value 
                        })}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant={variant.active ? "default" : "outline"}
                        onClick={() => updateVariant(variant.id, { active: !variant.active })}
                        className="w-full"
                      >
                        {variant.active ? "Active" : "Inactive"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductVariantManager;