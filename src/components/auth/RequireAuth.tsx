import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuthUser from "@/hooks/useAuthUser";

type Props = {
  children: React.ReactNode;
};

const RequireAuth: React.FC<Props> = ({ children }) => {
  const { user, isLoading } = useAuthUser();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default RequireAuth;
