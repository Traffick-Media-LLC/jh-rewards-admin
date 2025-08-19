import { NavLink, useLocation } from "react-router-dom";
import { 
  TrendingUp, 
  Users, 
  Package, 
  ShoppingCart, 
  FileText, 
  Settings,
  Home
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: Home,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Products", 
    url: "/admin/products",
    icon: Package,
  },
  {
    title: "Orders",
    url: "/admin/orders", 
    icon: ShoppingCart,
  },
  {
    title: "Audit Logs",
    url: "/admin/audit-logs",
    icon: FileText,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/admin") {
      return currentPath === "/admin";
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = (path: string) =>
    isActive(path) 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-r-2 border-primary" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"}>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 p-4">
          <img 
            src="https://buiyewfwvnpuydzfforc.supabase.co/storage/v1/object/public/public-files/JH%20Rewards%20Logo.png" 
            alt="Juice Head Logo" 
            className="h-8 w-8 rounded-lg object-contain"
          />
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">
                Juice Head
              </h2>
              <p className="text-xs text-sidebar-foreground/70">
                Admin Dashboard
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls(item.url)}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}