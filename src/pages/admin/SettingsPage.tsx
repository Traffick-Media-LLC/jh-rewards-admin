import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Settings, Save, Database, Mail, Shield, User, Zap, CheckCircle, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useProfile from "@/hooks/useProfile";
import useIsAdmin from "@/hooks/useIsAdmin";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { supabase } from "@/integrations/supabase/client";

// Form schemas
const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
});

const systemConfigSchema = z.object({
  site_name: z.string().min(1, "Site name is required"),
  company_email: z.string().email("Invalid email address"),
  site_url: z.string().url("Invalid URL"),
  maintenance_mode: z.boolean(),
});

export default function SettingsPage() {
  const { profile, refetch: refetchProfile } = useProfile();
  const { isAdmin } = useIsAdmin();
  const { settings, isLoading: settingsLoading, updateMultipleSettings, isUpdating } = useSystemSettings();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>("");
  const [profileSaving, setProfileSaving] = useState(false);

  // Profile form
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      phone: profile?.phone || "",
    },
  });

  // System config form
  const systemForm = useForm<z.infer<typeof systemConfigSchema>>({
    resolver: zodResolver(systemConfigSchema),
    defaultValues: {
      site_name: settings?.site_name || "Juice Head Rewards",
      company_email: settings?.company_email || "admin@juicehead.com",
      site_url: settings?.site_url || "https://rewards.juicehead.com",
      maintenance_mode: settings?.maintenance_mode === "true",
    },
  });

  // Update form defaults when data loads
  React.useEffect(() => {
    if (profile) {
      profileForm.reset({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
      });
    }
  }, [profile, profileForm]);

  React.useEffect(() => {
    if (settings) {
      systemForm.reset({
        site_name: settings.site_name || "Juice Head Rewards",
        company_email: settings.company_email || "admin@juicehead.com",
        site_url: settings.site_url || "https://rewards.juicehead.com",
        maintenance_mode: settings.maintenance_mode === "true",
      });
    }
  }, [settings, systemForm]);

  const handleTestConnection = async () => {
    setIsLoading(true);
    setSyncStatus("");
    
    try {
      const { data, error } = await supabase.functions.invoke('klaviyo-sync', {
        body: { action: 'test_connection' }
      });

      if (error) throw error;

      setSyncStatus(data.message);
      toast({
        title: "Connection Test",
        description: data.message,
      });
    } catch (error: any) {
      setSyncStatus(`Error: ${error.message}`);
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncAllProfiles = async () => {
    setIsLoading(true);
    setSyncStatus("Syncing all profiles...");
    
    try {
      const { data, error } = await supabase.functions.invoke('klaviyo-sync', {
        body: { action: 'manual_sync_all' }
      });

      if (error) throw error;

      setSyncStatus(`${data.message}. Errors: ${data.errors}`);
      toast({
        title: "Profiles Synced",
        description: data.message,
      });
    } catch (error: any) {
      setSyncStatus(`Error: ${error.message}`);
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncRecentOrders = async () => {
    setIsLoading(true);
    setSyncStatus("Syncing recent orders...");
    
    try {
      const { data, error } = await supabase.functions.invoke('klaviyo-sync', {
        body: { action: 'sync_recent_orders' }
      });

      if (error) throw error;

      setSyncStatus(`${data.message}. Errors: ${data.errors}`);
      toast({
        title: "Orders Synced",
        description: data.message,
      });
    } catch (error: any) {
      setSyncStatus(`Error: ${error.message}`);
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Profile save handler
  const handleSaveProfile = async (data: z.infer<typeof profileSchema>) => {
    setProfileSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone || null,
        })
        .eq("id", profile?.id);

      if (error) throw error;

      await refetchProfile();
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  // System config save handler
  const handleSaveSystemConfig = (data: z.infer<typeof systemConfigSchema>) => {
    updateMultipleSettings({
      site_name: data.site_name,
      company_email: data.company_email,
      site_url: data.site_url,
      maintenance_mode: data.maintenance_mode.toString(),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your admin dashboard and system settings</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Manage your personal information and account preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 pb-4">
              <h3 className="text-lg font-medium">
                {profile?.first_name} {profile?.last_name}
              </h3>
              {isAdmin && (
                <Badge variant="secondary" className="text-xs">
                  Admin
                </Badge>
              )}
            </div>
            
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={profileForm.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email Address</Label>
                    <Input 
                      id="admin-email" 
                      type="email" 
                      value={profile?.email || ''} 
                      disabled 
                      className="bg-muted"
                    />
                  </div>
                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" placeholder="Optional" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button type="submit" disabled={profileSaving}>
                    {profileSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        {/* System Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Configuration
            </CardTitle>
            <CardDescription>
              Basic system settings and configuration options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...systemForm}>
              <form onSubmit={systemForm.handleSubmit(handleSaveSystemConfig)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={systemForm.control}
                    name="site_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={systemForm.control}
                    name="company_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={systemForm.control}
                  name="site_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site URL</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Separator />
                
                <FormField
                  control={systemForm.control}
                  name="maintenance_mode"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Maintenance Mode</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Enable maintenance mode to prevent user access
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4 border-t">
                  <Button type="submit" disabled={isUpdating || settingsLoading}>
                    {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Save System Config
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
            <CardDescription>
              Configure email templates and notification settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input id="smtp-host" defaultValue="smtp.resend.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input id="smtp-port" type="number" defaultValue="587" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="from-email">From Email Address</Label>
              <Input id="from-email" type="email" defaultValue="noreply@juicehead.com" />
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Welcome Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Send welcome email to new users
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Order Confirmation</Label>
                  <p className="text-sm text-muted-foreground">
                    Send confirmation emails for orders
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Code Redemption Notification</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify users when they redeem points codes
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Klaviyo Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Klaviyo Integration
            </CardTitle>
            <CardDescription>
              Real-time marketing automation sync for user profiles and events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">API Key Configured</span>
              <Badge variant="outline" className="ml-auto text-xs">
                Active
              </Badge>
            </div>
            
            <Separator />
            
            {/* Active Sync Events */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Active Sync Events</h4>
              <div className="text-xs text-muted-foreground mb-3">
                These events are automatically synced to Klaviyo based on database triggers:
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span className="text-sm">Profile Updates</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">Auto</Badge>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span className="text-sm">Code Redemptions</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">Auto</Badge>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span className="text-sm">Order Events</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">Auto</Badge>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Manual Sync Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Manual Sync</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-3 w-3" />
                  Test Connection
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSyncAllProfiles}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-3 w-3" />
                  Sync All Profiles
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSyncRecentOrders}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Database className="h-3 w-3" />
                  Sync Recent Orders
                </Button>
              </div>
              
              {syncStatus && (
                <div className="mt-3 p-3 rounded-md bg-muted">
                  <p className="text-sm">{syncStatus}</p>
                </div>
              )}
            </div>
            
            {/* Sync Requirements */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Sync Requirements</h4>
              <div className="text-xs text-muted-foreground">
                Events sync only for users with marketing emails enabled in their profile settings.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Access
            </CardTitle>
            <CardDescription>
              Configure security settings and access controls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                <Input id="session-timeout" type="number" defaultValue="60" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                <Input id="max-login-attempts" type="number" defaultValue="5" />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for admin users
                  </p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">IP Restriction</Label>
                  <p className="text-sm text-muted-foreground">
                    Restrict admin access to specific IP addresses
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Save Settings */}
        <div className="flex justify-end">
          <Button size="lg">
            <Save className="h-4 w-4 mr-2" />
            Save All Settings
          </Button>
        </div>
      </div>
    </div>
  );
}