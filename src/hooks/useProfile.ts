import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import useAuthUser from "./useAuthUser";

export default function useProfile() {
  const { user } = useAuthUser();

  const query = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  return { profile: query.data, ...query };
}
