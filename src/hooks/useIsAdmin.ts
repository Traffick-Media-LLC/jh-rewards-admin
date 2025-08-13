import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function useIsAdmin() {
  const query = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("has_role", { _role: "admin" });
      if (error) throw error;
      return Boolean(data);
    },
    staleTime: 60_000,
  });

  return { isAdmin: query.data ?? false, ...query };
}
