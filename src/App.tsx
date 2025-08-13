import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Checkout from "./pages/Checkout";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import ThankYou from "./pages/ThankYou";
import Account from "./pages/Account";
import { CartProvider } from "./contexts/CartContext";
import CartSheet from "./components/cart/CartSheet";
import RequireAuth from "./components/auth/RequireAuth";
import RequireAdmin from "./components/auth/RequireAdmin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductEdit from "./pages/admin/AdminProductEdit";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CartSheet />
            <Routes>
              <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
              <Route path="/shop" element={<RequireAuth><Shop /></RequireAuth>} />
              <Route path="/product/:id" element={<RequireAuth><Product /></RequireAuth>} />
              <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
              <Route path="/thank-you" element={<RequireAuth><ThankYou /></RequireAuth>} />
              {/* Admin routes */}
              <Route path="/admin" element={<RequireAuth><RequireAdmin><AdminLayout /></RequireAdmin></RequireAuth>}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/edit/:id" element={<AdminProductEdit />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="audit-logs" element={<AdminAuditLogs />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
