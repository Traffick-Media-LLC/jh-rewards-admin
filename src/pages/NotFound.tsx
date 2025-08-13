import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";

const NotFound: React.FC = () => {
  React.useEffect(() => {
    document.title = "404 - Page Not Found | Admin";
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        <AlertCircle className="h-24 w-24 mx-auto text-muted-foreground" />
        <div>
          <h1 className="text-4xl font-bold text-foreground">404</h1>
          <p className="text-xl text-muted-foreground mt-2">Page Not Found</p>
          <p className="text-sm text-muted-foreground mt-4 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin">Return to Admin Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
