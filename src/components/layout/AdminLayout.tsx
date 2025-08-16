import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import useAuthUser from "@/hooks/useAuthUser";

interface AdminLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function AdminLayout({ children, breadcrumbs = [] }: AdminLayoutProps) {
  const { user } = useAuthUser();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-header h-16 flex items-center justify-between px-3 sm:px-4 lg:px-6">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <SidebarTrigger />
              
              {breadcrumbs.length > 0 && (
                <div className="min-w-0 flex-1">
                  {/* Mobile: Show only current page */}
                  <div className="sm:hidden">
                    <span className="text-sm font-medium text-foreground truncate">
                      {breadcrumbs[breadcrumbs.length - 1].label}
                    </span>
                  </div>
                  {/* Desktop: Show full breadcrumb */}
                  <div className="hidden sm:block">
                    <Breadcrumb>
                      <BreadcrumbList>
                        <BreadcrumbItem>
                          <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
                        </BreadcrumbItem>
                        {breadcrumbs.map((crumb, index) => (
                          <React.Fragment key={index}>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                              {crumb.href ? (
                                <BreadcrumbLink href={crumb.href}>
                                  {crumb.label}
                                </BreadcrumbLink>
                              ) : (
                                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                              )}
                            </BreadcrumbItem>
                          </React.Fragment>
                        ))}
                      </BreadcrumbList>
                    </Breadcrumb>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Mobile: Show only sign out button */}
              <div className="sm:hidden">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => supabase.auth.signOut()}
                  className="h-8 px-2"
                >
                  Sign Out
                </Button>
              </div>
              {/* Desktop: Show welcome message and sign out */}
              <div className="hidden sm:flex items-center gap-4">
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  Welcome, {user?.email}
                </div>
                <Button variant="outline" onClick={() => supabase.auth.signOut()}>
                  Sign Out
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-3 sm:p-4 lg:p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}