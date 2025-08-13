import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuthUser from "@/hooks/useAuthUser";
import useIsAdmin from "@/hooks/useIsAdmin";

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuthUser();
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const location = useLocation();

  if (isLoading || roleLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default RequireAdmin;
