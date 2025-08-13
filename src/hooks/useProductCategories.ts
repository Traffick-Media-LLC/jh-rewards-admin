import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useProductCategories = () => {
  return useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("category")
        .not("category", "is", null);
      
      if (error) throw error;
      
      // Get unique categories and filter out empty values
      const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
      return categories.sort();
    }
  });
};