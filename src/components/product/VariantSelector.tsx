import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { VariantOption, ProductVariant } from "@/pages/admin/AdminProducts";

interface VariantSelectorProps {
  productId: string;
  onVariantSelect: (variant: ProductVariant | null, selectedVariants: Record<string, string>) => void;
  variantTypes: string[];
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  productId,
  onVariantSelect,
  variantTypes,
}) => {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Fetch variant options
  const { data: variantOptions = [] } = useQuery({
    queryKey: ['variant-options', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('variant_options')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order');
      
      if (error) throw error;
      return data as VariantOption[];
    },
    enabled: !!productId && variantTypes.length > 0,
  });

  // Fetch product variants
  const { data: productVariants = [] } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .eq('active', true);
      
      if (error) throw error;
      return data as ProductVariant[];
    },
    enabled: !!productId && variantTypes.length > 0,
  });

  // Group options by variant type
  const optionsByType = variantOptions.reduce((acc, option) => {
    if (!acc[option.variant_type]) {
      acc[option.variant_type] = [];
    }
    acc[option.variant_type].push(option);
    return acc;
  }, {} as Record<string, VariantOption[]>);

  // Find matching variant when selections change
  useEffect(() => {
    if (variantTypes.length === 0) {
      onVariantSelect(null, {});
      return;
    }

    // Check if all required variant types are selected
    const allSelected = variantTypes.every(type => selectedVariants[type]);
    
    if (allSelected) {
      // Find matching variant
      const matchingVariant = productVariants.find(variant => {
        return variantTypes.every(type => 
          variant.variant_combination[type] === selectedVariants[type]
        );
      });
      
      onVariantSelect(matchingVariant || null, selectedVariants);
    } else {
      onVariantSelect(null, selectedVariants);
    }
  }, [selectedVariants, productVariants, variantTypes, onVariantSelect]);

  if (variantTypes.length === 0) {
    return null;
  }

  const isSelectionComplete = variantTypes.every(type => selectedVariants[type]);
  const selectedVariant = isSelectionComplete 
    ? productVariants.find(variant => 
        variantTypes.every(type => variant.variant_combination[type] === selectedVariants[type])
      )
    : null;

  return (
    <div className="space-y-4">
      {variantTypes.map(type => {
        const options = optionsByType[type] || [];
        
        return (
          <div key={type} className="space-y-2">
            <Label className="text-sm font-medium capitalize">{type}</Label>
            <Select
              value={selectedVariants[type] || ""}
              onValueChange={(value) => {
                setSelectedVariants(prev => ({
                  ...prev,
                  [type]: value
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${type}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map(option => (
                  <SelectItem key={option.id} value={option.option_name}>
                    {option.option_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}

      {/* Show selected variant summary */}
      {Object.keys(selectedVariants).length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {Object.entries(selectedVariants).map(([type, value]) => (
            <Badge key={type} variant="secondary" className="text-xs">
              {type}: {value}
            </Badge>
          ))}
        </div>
      )}

      {/* Show inventory status for selected variant */}
      {selectedVariant && (
        <div className="text-sm text-muted-foreground">
          {selectedVariant.inventory > 0 
            ? `${selectedVariant.inventory} in stock`
            : "Out of stock"
          }
        </div>
      )}
    </div>
  );
};