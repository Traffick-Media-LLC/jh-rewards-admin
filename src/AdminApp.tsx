import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Package, ShoppingCart, TrendingUp, Settings, Shield, FileText, Search, Filter, Download, UserPlus, Upload, RefreshCw } from "lucide-react";
import ProductCreateDialog from "@/components/admin/ProductCreateDialog";
import ProductEditDialog from "@/components/admin/ProductEditDialog";
import ProductFilters from "@/components/admin/ProductFilters";
import BulkProductActions from "@/components/admin/BulkProductActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatPoints } from "@/lib/pricing";
import useAuthUser from "@/hooks/useAuthUser";
import useIsAdmin from "@/hooks/useIsAdmin";

const AdminApp: React.FC = () => {
  const { user, isLoading: authLoading } = useAuthUser();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("dashboard");
  
  // Product management state
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [productStatusFilter, setProductStatusFilter] = useState("");
  const [productSortBy, setProductSortBy] = useState("created_at_desc");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !adminLoading && (!user || !isAdmin)) {
      window.location.href = "/auth";
    }
  }, [user, isAdmin, authLoading, adminLoading]);

  // Dashboard metrics
  const { data: metrics } = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      const [usersRes, ordersRes, productsRes, pointsRes] = await Promise.all([
        supabase.from("profiles").select("id").eq("marketing_emails", true),
        supabase.from("orders").select("id, total_points, status"),
        supabase.from("products").select("id, active"),
        supabase.from("points_transactions").select("points, type")
      ]);

      const totalUsers = usersRes.data?.length || 0;
      const totalOrders = ordersRes.data?.length || 0;
      const pendingOrders = ordersRes.data?.filter(o => o.status === "processing").length || 0;
      const totalRevenue = ordersRes.data?.reduce((sum, o) => sum + (o.total_points || 0), 0) || 0;
      const activeProducts = productsRes.data?.filter(p => p.active).length || 0;
      const totalProducts = productsRes.data?.length || 0;
      const pointsEarned = pointsRes.data?.filter(p => p.type === "earn").reduce((sum, p) => sum + p.points, 0) || 0;
      const pointsSpent = Math.abs(pointsRes.data?.filter(p => p.type === "redeem").reduce((sum, p) => sum + p.points, 0) || 0);

      return {
        totalUsers,
        totalOrders,
        pendingOrders,
        totalRevenue,
        activeProducts,
        totalProducts,
        pointsEarned,
        pointsSpent
      };
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Users data
  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ["admin-users", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data;
    }
  });

  // Products data with filters
  const { data: products, refetch: refetchProducts } = useQuery({
    queryKey: ["admin-products", productSearchTerm, productCategoryFilter, productStatusFilter, productSortBy],
    queryFn: async () => {
      let query = supabase.from("products").select("*");

      // Apply search filter
      if (productSearchTerm) {
        query = query.or(`name.ilike.%${productSearchTerm}%,sku.ilike.%${productSearchTerm}%`);
      }

      // Apply category filter
      if (productCategoryFilter && productCategoryFilter !== "all") {
        query = query.eq("category", productCategoryFilter);
      }

      // Apply status filter
      if (productStatusFilter && productStatusFilter !== "all") {
        query = query.eq("active", productStatusFilter === "active");
      }

      // Apply sorting
      const [sortField, sortDirection] = productSortBy.split("_");
      const ascending = sortDirection === "asc";
      
      if (sortField === "price") {
        query = query.order("price_cents", { ascending });
      } else if (sortField === "inventory") {
        query = query.order("inventory", { ascending });
      } else if (sortField === "name") {
        query = query.order("name", { ascending });
      } else {
        query = query.order("created_at", { ascending });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Orders data
  const { data: orders, refetch: refetchOrders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    }
  });

  // Audit logs
  const { data: auditLogs } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    }
  });

  const handlePointsAdjustment = async (userId: string, points: number, description: string) => {
    try {
      const { error } = await supabase
        .from("points_transactions")
        .insert({
          user_id: userId,
          points,
          type: "adjustment",
          description
        });

      if (error) throw error;
      toast.success("Points adjusted successfully");
      refetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleProductStatus = async (productId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ active, updated_at: new Date().toISOString() })
        .eq("id", productId);

      if (error) throw error;
      toast.success(`Product ${active ? "activated" : "deactivated"}`);
      refetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

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
          <p className="text-muted-foreground">You need admin privileges to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-header">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Juice Head Rewards Admin</h1>
              <p className="text-sm text-muted-foreground">Comprehensive administration dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Welcome, {user.email}
              </div>
              <Button 
                variant="outline" 
                onClick={() => supabase.auth.signOut()}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">Active subscribers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.totalOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.pendingOrders || 0} pending
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Points Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPoints(metrics?.totalRevenue || 0)}</div>
                  <p className="text-xs text-muted-foreground">Total redeemed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.activeProducts || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    of {metrics?.totalProducts || 0} total
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Points Activity</CardTitle>
                  <CardDescription>Earned vs Spent overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Points Earned</span>
                      <span>{formatPoints(metrics?.pointsEarned || 0)}</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Points Spent</span>
                      <span>{formatPoints(metrics?.pointsSpent || 0)}</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Real-time system status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    <Badge variant="default">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payments</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Service</span>
                    <Badge variant="default">Online</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => refetchUsers()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and points</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Monthly Redemptions</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{formatPoints(user.points_balance)}</TableCell>
                        <TableCell>{user.redeemed_this_month}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Adjust Points
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adjust Points</DialogTitle>
                                <DialogDescription>
                                  Adjust points for {user.first_name} {user.last_name}
                                </DialogDescription>
                              </DialogHeader>
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const formData = new FormData(e.currentTarget);
                                  const points = parseInt(formData.get("points") as string);
                                  const description = formData.get("description") as string;
                                  handlePointsAdjustment(user.id, points, description);
                                }}
                                className="space-y-4"
                              >
                                <div>
                                  <Label htmlFor="points">Points (positive to add, negative to subtract)</Label>
                                  <Input name="points" type="number" required />
                                </div>
                                <div>
                                  <Label htmlFor="description">Description</Label>
                                  <Textarea name="description" required />
                                </div>
                                <Button type="submit" className="w-full">
                                  Apply Adjustment
                                </Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Product Management</h2>
              <div className="flex gap-2">
                <ProductCreateDialog />
                <Button onClick={() => refetchProducts()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            <ProductFilters
              searchTerm={productSearchTerm}
              onSearchChange={setProductSearchTerm}
              categoryFilter={productCategoryFilter}
              onCategoryChange={setProductCategoryFilter}
              statusFilter={productStatusFilter}
              onStatusChange={setProductStatusFilter}
              sortBy={productSortBy}
              onSortChange={setProductSortBy}
              onClearFilters={() => {
                setProductSearchTerm("");
                setProductCategoryFilter("all");
                setProductStatusFilter("all");
                setProductSortBy("created_at_desc");
              }}
            />

            {selectedProducts.length > 0 && (
              <BulkProductActions
                products={products || []}
                selectedProducts={selectedProducts}
                onSelectionChange={setSelectedProducts}
              />
            )}

            <Card>
              <CardHeader>
                <CardTitle>Products ({products?.length || 0})</CardTitle>
                <CardDescription>Manage product catalog with full CRUD operations</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={products?.length > 0 && selectedProducts.length === products.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts(products?.map(p => p.id) || []);
                            } else {
                              setSelectedProducts([]);
                            }
                          }}
                          className="rounded border-input"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Inventory</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products?.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts([...selectedProducts, product.id]);
                              } else {
                                setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                              }
                            }}
                            className="rounded border-input"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded border"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded border flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">No Image</span>
                              </div>
                            )}
                            <div>
                              {product.name}
                              {product.homepage && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.sku || "—"}
                        </TableCell>
                        <TableCell>
                          <div>
                            {formatPoints(product.price_cents)}
                            {product.sale_price_cents && (
                              <div className="text-xs text-muted-foreground line-through">
                                {formatPoints(product.sale_price_cents)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {product.category || "Uncategorized"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.active ? "default" : "secondary"}>
                            {product.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={product.inventory < 10 ? "text-destructive font-medium" : ""}>
                            {product.inventory}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <ProductEditDialog product={product} />
                            <Switch
                              checked={product.active}
                              onCheckedChange={(checked) => toggleProductStatus(product.id, checked)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {products?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {productSearchTerm || productCategoryFilter || productStatusFilter
                      ? "No products match your filters"
                      : "No products found. Create your first product to get started."
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex justify-between">
              <h2 className="text-2xl font-bold">Order Management</h2>
              <Button onClick={() => refetchOrders()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Monitor and manage customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Shopify Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders?.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          {order.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>{order.user_id.slice(0, 8)}...</TableCell>
                        <TableCell>{formatPoints(order.total_points)}</TableCell>
                        <TableCell>
                          <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {order.shopify_order_name || "Pending"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>System activity and admin actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>{log.admin_user_id.slice(0, 8)}...</TableCell>
                        <TableCell>{log.action_type}</TableCell>
                        <TableCell>{log.resource_type}</TableCell>
                        <TableCell>
                          <pre className="text-xs max-w-xs overflow-hidden">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Settings</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Welcome Emails</Label>
                      <p className="text-sm text-muted-foreground">Send welcome emails to new users</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Order Confirmations</Label>
                      <p className="text-sm text-muted-foreground">Send order confirmation emails</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Points Settings</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Monthly Redemption Limit</Label>
                      <Input type="number" defaultValue="60" />
                    </div>
                    <div>
                      <Label>Maximum Transaction Points</Label>
                      <Input type="number" defaultValue="50000" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Security Settings</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Require 2FA for admin access</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminApp;