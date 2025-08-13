import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Security enhancement: Track authentication state more securely
export default function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAuthCheck, setLastAuthCheck] = useState<number>(Date.now());

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      if (!mounted) return;

      // Security: Log authentication events for monitoring
      console.log('Auth state change:', { event, userId: sess?.user?.id });
      
      // Only synchronous state updates here to avoid deadlocks
      setSession(sess);
      setUser(sess?.user ?? null);
      setLastAuthCheck(Date.now());

      // Security: Clear sensitive data on sign out
      if (event === 'SIGNED_OUT') {
        // Clear any cached sensitive data
        localStorage.removeItem('recentSearches');
        sessionStorage.clear();
      }
    });

    // Initialize session after setting up the listener
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;

      if (error) {
        console.error('Error getting session:', error);
      }

      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      setLastAuthCheck(Date.now());
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Security: Provide a way to force re-authentication check
  const refreshAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      setSession(session);
      setUser(session?.user ?? null);
      setLastAuthCheck(Date.now());
      
      return session;
    } catch (error) {
      console.error('Error refreshing auth:', error);
      return null;
    }
  };

  // Security: Check if the session is getting stale (older than 5 minutes)
  const isSessionStale = () => {
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - lastAuthCheck > fiveMinutes;
  };

  return { 
    user, 
    session, 
    isLoading, 
    refreshAuth,
    isSessionStale,
    lastAuthCheck 
  };
}
