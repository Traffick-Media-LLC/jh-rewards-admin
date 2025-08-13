import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/admin/AppSidebar";
import CommandPalette from "@/components/admin/CommandPalette";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const [cmdOpen, setCmdOpen] = React.useState(false);

  React.useEffect(() => {
    document.title = "Admin Dashboard | Manage Users & Products";
  }, []);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInFormField = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.tagName === 'SELECT' || 
                           target.contentEditable === 'true';

      const isCmdK = (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey));
      if (isCmdK) { e.preventDefault(); setCmdOpen(true); }
      if (e.key === "/") { e.preventDefault(); setCmdOpen(true); }
      if (e.key.toLowerCase() === "n") { e.preventDefault(); navigate("/admin/products"); }
      if (e.key.toLowerCase() === "r" && !isInFormField) { e.preventDefault(); window.location.reload(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  const env = /localhost|127\.0\.0\.1/.test(window.location.hostname) ? "Dev" : "Prod";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1">
          <header className={cn(
            "sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          )}>
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <h1 className="text-base font-semibold">Admin</h1>
                <span className="text-xs px-2 py-0.5 rounded-full border text-muted-foreground">{env}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCmdOpen(true)}>Search ⌘K</Button>
                <Button variant="secondary" size="sm" onClick={() => navigate("/admin/products")}>New product</Button>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Refresh</Button>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 py-6">
            <Outlet />
          </main>
        </div>
        <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
