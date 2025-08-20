import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, RefreshCw, Eye, Ticket } from "lucide-react";
import { formatPoints } from "@/lib/pricing";

export function RedeemedCodesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRedemption, setSelectedRedemption] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Redeemed codes data with user profiles and validation attempts
  const { data: redeemedCodes, refetch: refetchRedeemedCodes } = useQuery({
    queryKey: ["admin-redeemed-codes", searchTerm],
    queryFn: async () => {
      if (!searchTerm) {
        // No search term - get all recent codes with validation attempts
        const { data: codes, error: codesError } = await supabase
          .from("redeemed_codes")
          .select(`
            *,
            code_validation_attempts!left(status, error_message)
          `)
          .order("created_at", { ascending: false })
          .limit(100);

        if (codesError) throw codesError;
        if (!codes || codes.length === 0) return [];

        // Get user profiles for these codes
        const userIds = [...new Set(codes.map((code) => code.user_id))];
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name")
          .in("id", userIds);

        if (profilesError) throw profilesError;

        return codes.map((code) => ({
          ...code,
          profiles: profiles?.find((profile) => profile.id === code.user_id),
        }));
      }

      // With search term - search both codes and users
      const [codesResult, profilesResult] = await Promise.all([
        // Search codes by code value
        supabase
          .from("redeemed_codes")
          .select(`
            *,
            code_validation_attempts!left(status, error_message)
          `)
          .ilike("code", `%${searchTerm}%`)
          .order("created_at", { ascending: false })
          .limit(50),
        // Search profiles by email/name
        supabase
          .from("profiles")
          .select("id, email, first_name, last_name")
          .or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
      ]);

      if (codesResult.error) throw codesResult.error;
      if (profilesResult.error) throw profilesResult.error;

      const foundCodes = codesResult.data || [];
      const foundProfiles = profilesResult.data || [];

      // Get codes for matching users
      let userCodes: any[] = [];
      if (foundProfiles.length > 0) {
        const userIds = foundProfiles.map(p => p.id);
        const { data: additionalCodes, error: userCodesError } = await supabase
          .from("redeemed_codes")
          .select(`
            *,
            code_validation_attempts!left(status, error_message)
          `)
          .in("user_id", userIds)
          .order("created_at", { ascending: false })
          .limit(50);

        if (userCodesError) throw userCodesError;
        userCodes = additionalCodes || [];
      }

      // Combine and deduplicate codes
      const allCodeIds = new Set();
      const allCodes = [...foundCodes, ...userCodes].filter(code => {
        if (allCodeIds.has(code.id)) return false;
        allCodeIds.add(code.id);
        return true;
      });

      // Get all profiles for the final codes
      const allUserIds = [...new Set(allCodes.map(code => code.user_id))];
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .in("id", allUserIds);

      if (allProfilesError) throw allProfilesError;

      return allCodes
        .map((code) => ({
          ...code,
          profiles: allProfiles?.find((profile) => profile.id === code.user_id),
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 100);
    },
  });

  const openRedemptionDetail = (redemption: any) => {
    setSelectedRedemption(redemption);
    setDetailModalOpen(true);
  };

  const getStatusBadge = (redemption: any) => {
    // Use validation attempt status if available
    if (redemption.code_validation_attempts?.status) {
      const status = redemption.code_validation_attempts.status;
      switch (status) {
        case 'valid':
          return <Badge variant="default">Successfully Redeemed</Badge>;
        case 'invalid':
          return <Badge variant="destructive">Invalid Code</Badge>;
        case 'already_redeemed':
          return <Badge variant="destructive">Already Redeemed</Badge>;
        case 'error':
          return <Badge variant="secondary">Validation Error</Badge>;
        default:
          return <Badge variant="secondary">Unknown Status</Badge>;
      }
    }
    
    // Fallback to API response for legacy entries
    const apiResponse = redemption.api_response;
    if (!apiResponse) return <Badge variant="secondary">Unknown</Badge>;
    
    // Fix the data access path
    const isValid = apiResponse.data?.valid === true;
    
    if (isValid) {
      return <Badge variant="default">Successfully Redeemed</Badge>;
    } else {
      return <Badge variant="destructive">Invalid Code</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Redeemed Codes</h1>
          <p className="text-muted-foreground">View all reward code redemptions</p>
        </div>
        <Button onClick={() => refetchRedeemedCodes()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Code Redemption History
          </CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search codes or users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile view: Card layout */}
          <div className="block sm:hidden space-y-4">
            {redeemedCodes?.map((redemption) => (
              <Card key={redemption.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium font-mono text-sm truncate">
                        {redemption.code}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {redemption.profiles?.first_name} {redemption.profiles?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {redemption.profiles?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(redemption.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="ml-2 shrink-0 text-right">
                      <Badge variant="outline" className="mb-2">
                        {formatPoints(redemption.points_awarded)}
                      </Badge>
                      <div>{getStatusBadge(redemption)}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRedemptionDetail(redemption)}
                      className="h-8 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop view: Table layout */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Points Awarded</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Redeemed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redeemedCodes?.map((redemption) => (
                  <TableRow key={redemption.id}>
                    <TableCell>
                      <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {redemption.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {redemption.profiles?.first_name} {redemption.profiles?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {redemption.profiles?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatPoints(redemption.points_awarded)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(redemption)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(redemption.created_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRedemptionDetail(redemption)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Redemption Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Code Redemption Details</DialogTitle>
            <DialogDescription>
              Complete information about this code redemption
            </DialogDescription>
          </DialogHeader>
          {selectedRedemption && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Redemption Date
                  </Label>
                  <p className="mt-1 text-sm">
                    {new Date(selectedRedemption.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Code</Label>
                  <p className="mt-1 text-sm font-mono bg-muted px-2 py-1 rounded">
                    {selectedRedemption.code}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">User</Label>
                  <p className="mt-1 text-sm">
                    {selectedRedemption.profiles?.first_name} {selectedRedemption.profiles?.last_name}
                    <br />
                    <span className="text-muted-foreground">{selectedRedemption.profiles?.email}</span>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Points Awarded
                  </Label>
                  <p className="mt-1 text-sm">
                    <Badge variant="outline">
                      {formatPoints(selectedRedemption.points_awarded)}
                    </Badge>
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Validation Status
                </Label>
                <div className="mt-1">
                  {getStatusBadge(selectedRedemption)}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  User ID
                </Label>
                <p className="mt-1 text-sm font-mono">
                  {selectedRedemption.user_id}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}