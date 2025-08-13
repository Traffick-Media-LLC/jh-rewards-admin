import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Package } from "lucide-react";
import type { VariantOption, ProductVariant } from "@/pages/admin/AdminProducts";

interface VariantManagerProps {
  productId?: string;
  hasVariants: boolean;
  variantTypes: string[];
  initialVariantOptions?: VariantOption[];
  initialProductVariants?: ProductVariant[];
  onVariantChange: (hasVariants: boolean, variantTypes: string[], options: VariantOption[], variants: ProductVariant[]) => void;
}

const AVAILABLE_VARIANT_TYPES = ["size", "color", "material", "style"];

export const VariantManager: React.FC<VariantManagerProps> = ({
  productId,
  hasVariants,
  variantTypes,
  initialVariantOptions = [],
  initialProductVariants = [],
  onVariantChange,
}) => {
  const [localHasVariants, setLocalHasVariants] = useState(hasVariants);
  const [localVariantTypes, setLocalVariantTypes] = useState<string[]>(variantTypes);
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>(initialVariantOptions);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>(initialProductVariants);
  const [newOptionType, setNewOptionType] = useState("");
  const [newOptionName, setNewOptionName] = useState("");

  // Initialize state from props when they change
  useEffect(() => {
    setLocalHasVariants(hasVariants);
  }, [hasVariants]);

  useEffect(() => {
    setLocalVariantTypes(variantTypes);
  }, [variantTypes]);

  useEffect(() => {
    if (initialVariantOptions.length > 0) {
      setVariantOptions(initialVariantOptions);
    }
  }, [initialVariantOptions]);

  useEffect(() => {
    if (initialProductVariants.length > 0) {
      setProductVariants(initialProductVariants);
    }
  }, [initialProductVariants]);

  // Debounced variant change notification
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onVariantChange(localHasVariants, localVariantTypes, variantOptions, productVariants);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localHasVariants, localVariantTypes, variantOptions, productVariants, onVariantChange]);

  const addVariantType = (type: string) => {
    if (!localVariantTypes.includes(type)) {
      setLocalVariantTypes([...localVariantTypes, type]);
    }
  };

  const removeVariantType = (type: string) => {
    setLocalVariantTypes(localVariantTypes.filter(t => t !== type));
    setVariantOptions(variantOptions.filter(opt => opt.variant_type !== type));
    // Remove variants that include this type
    setProductVariants(productVariants.filter(variant => 
      !variant.variant_combination.hasOwnProperty(type)
    ));
  };

  const addVariantOption = () => {
    if (newOptionType && newOptionName) {
      const newOption: VariantOption = {
        id: `temp-${Date.now()}`,
        product_id: productId || "",
        variant_type: newOptionType,
        option_name: newOptionName,
        sort_order: variantOptions.filter(opt => opt.variant_type === newOptionType).length,
      };
      setVariantOptions([...variantOptions, newOption]);
      setNewOptionName("");
      generateVariants([...variantOptions, newOption]);
    }
  };

  const removeVariantOption = (optionId: string) => {
    const option = variantOptions.find(opt => opt.id === optionId);
    if (option) {
      setVariantOptions(variantOptions.filter(opt => opt.id !== optionId));
      // Remove variants that include this option
      setProductVariants(productVariants.filter(variant =>
        variant.variant_combination[option.variant_type] !== option.option_name
      ));
    }
  };

  const generateVariants = (options: VariantOption[]) => {
    if (localVariantTypes.length === 0) return;

    const optionsByType = localVariantTypes.reduce((acc, type) => {
      acc[type] = options.filter(opt => opt.variant_type === type);
      return acc;
    }, {} as Record<string, VariantOption[]>);

    // Generate all combinations
    const combinations: Record<string, string>[] = [];
    
    const generate = (index: number, current: Record<string, string>) => {
      if (index === localVariantTypes.length) {
        combinations.push({ ...current });
        return;
      }
      
      const type = localVariantTypes[index];
      const options = optionsByType[type] || [];
      
      for (const option of options) {
        current[type] = option.option_name;
        generate(index + 1, current);
        delete current[type];
      }
    };

    generate(0, {});

    // Create variants for new combinations
    const newVariants: ProductVariant[] = [];
    combinations.forEach(combination => {
      const existing = productVariants.find(v => 
        JSON.stringify(v.variant_combination) === JSON.stringify(combination)
      );
      if (!existing) {
        const skuSuffix = Object.values(combination).join("-").toUpperCase();
        newVariants.push({
          id: `temp-${Date.now()}-${JSON.stringify(combination)}`,
          product_id: productId || "",
          variant_combination: combination,
          sku_suffix: skuSuffix,
          price_adjustment_cents: 0,
          inventory: 0,
          active: true,
        });
      }
    });

    setProductVariants([...productVariants.filter(v => 
      combinations.some(c => JSON.stringify(c) === JSON.stringify(v.variant_combination))
    ), ...newVariants]);
  };

  const updateVariant = (variantId: string, field: keyof ProductVariant, value: any) => {
    setProductVariants(productVariants.map(variant =>
      variant.id === variantId ? { ...variant, [field]: value } : variant
    ));
  };

  if (!localHasVariants) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Variants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              checked={localHasVariants}
              onCheckedChange={setLocalHasVariants}
            />
            <Label>Enable variants (size, color, etc.)</Label>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Product Variants
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch
            checked={localHasVariants}
            onCheckedChange={setLocalHasVariants}
          />
          <Label>Enable variants</Label>
        </div>

        {/* Variant Types */}
        <div>
          <Label className="text-sm font-medium">Variant Types</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {localVariantTypes.map(type => (
              <Badge key={type} variant="secondary" className="flex items-center gap-1">
                {type}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => removeVariantType(type)}
                />
              </Badge>
            ))}
          </div>
          <Select onValueChange={addVariantType}>
            <SelectTrigger className="w-full mt-2">
              <SelectValue placeholder="Add variant type..." />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_VARIANT_TYPES.filter(type => !localVariantTypes.includes(type)).map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Variant Options */}
        {localVariantTypes.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Variant Options</Label>
            <div className="space-y-3 mt-2">
              {localVariantTypes.map(type => (
                <div key={type}>
                  <Label className="text-xs text-muted-foreground capitalize">{type}</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {variantOptions
                      .filter(opt => opt.variant_type === type)
                      .map(option => (
                        <Badge key={option.id} variant="outline" className="flex items-center gap-1">
                          {option.option_name}
                          <X 
                            className="h-3 w-3 cursor-pointer hover:text-destructive" 
                            onClick={() => removeVariantOption(option.id)}
                          />
                        </Badge>
                      ))}
                  </div>
                </div>
              ))}
              
              <div className="flex gap-2">
                <Select value={newOptionType} onValueChange={setNewOptionType}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {localVariantTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Option name"
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addVariantOption} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Generated Variants */}
        {productVariants.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Generated Variants</Label>
            <div className="space-y-2 mt-2">
              {productVariants.map(variant => (
                <div key={variant.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {Object.entries(variant.variant_combination).map(([type, value]) => 
                        `${type}: ${value}`
                      ).join(", ")}
                    </span>
                    <Switch
                      checked={variant.active}
                      onCheckedChange={(checked) => updateVariant(variant.id, "active", checked)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">SKU Suffix</Label>
                      <Input
                        value={variant.sku_suffix || ""}
                        onChange={(e) => updateVariant(variant.id, "sku_suffix", e.target.value)}
                        placeholder="e.g., SM-RED"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Price Adjustment ($)</Label>
                      <Input
                        type="number"
                        value={variant.price_adjustment_cents / 100}
                        onChange={(e) => updateVariant(variant.id, "price_adjustment_cents", Number(e.target.value) * 100)}
                        placeholder="0.00"
                        step="0.01"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Inventory</Label>
                      <Input
                        type="number"
                        value={variant.inventory}
                        onChange={(e) => updateVariant(variant.id, "inventory", Number(e.target.value))}
                        placeholder="0"
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};