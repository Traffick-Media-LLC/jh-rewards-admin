import React, { useEffect } from "react";
import { Shield, RefreshCw } from "lucide-react";
import useAuthUser from "@/hooks/useAuthUser";
import useIsAdmin from "@/hooks/useIsAdmin";

interface RequireAdminProps {
  children: React.ReactNode;
}

export default function RequireAdmin({ children }: RequireAdminProps) {
  const { user, isLoading: authLoading } = useAuthUser();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !adminLoading && (!user || !isAdmin)) {
      window.location.href = "/auth";
    }
  }, [user, isAdmin, authLoading, adminLoading]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You need admin privileges to access this dashboard.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}