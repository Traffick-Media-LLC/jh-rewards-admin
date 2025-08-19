import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Auth from "./pages/Auth";
import { AdminLayout } from "./components/layout/AdminLayout";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { ProductsPage } from "./pages/admin/ProductsPage";
import { OrdersPage } from "./pages/admin/OrdersPage";
import { AuditLogsPage } from "./pages/admin/AuditLogsPage";
import { RedeemedCodesPage } from "./pages/admin/RedeemedCodesPage";
import SettingsPage from "./pages/admin/SettingsPage";
import RequireAdmin from "./components/auth/RequireAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminLayout>
                    <DashboardPage />
                  </AdminLayout>
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequireAdmin>
                  <AdminLayout breadcrumbs={[{ label: "Users" }]}>
                    <UsersPage />
                  </AdminLayout>
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/products"
              element={
                <RequireAdmin>
                  <AdminLayout breadcrumbs={[{ label: "Products" }]}>
                    <ProductsPage />
                  </AdminLayout>
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <RequireAdmin>
                  <AdminLayout breadcrumbs={[{ label: "Orders" }]}>
                    <OrdersPage />
                  </AdminLayout>
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/redeemed-codes"
              element={
                <RequireAdmin>
                  <AdminLayout breadcrumbs={[{ label: "Redeemed Codes" }]}>
                    <RedeemedCodesPage />
                  </AdminLayout>
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <RequireAdmin>
                  <AdminLayout breadcrumbs={[{ label: "Audit Logs" }]}>
                    <AuditLogsPage />
                  </AdminLayout>
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <RequireAdmin>
                  <AdminLayout breadcrumbs={[{ label: "Settings" }]}>
                    <SettingsPage />
                  </AdminLayout>
                </RequireAdmin>
              }
            />
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;