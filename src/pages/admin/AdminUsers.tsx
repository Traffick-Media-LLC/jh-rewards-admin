import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const AdminUsers: React.FC = () => {
  React.useEffect(() => { document.title = "Admin | Users & Points"; }, []);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, email, first_name, last_name, points_balance, redeemed_this_month, created_at");
      if (error) throw error;
      return data;
    },
    staleTime: 20_000,
  });

  const adjustMutation = useMutation({
    mutationFn: async ({ userId, amount, description }: { userId: string; amount: number; description?: string }) => {
      const payload = {
        user_id: userId,
        points: amount,
        type: "adjustment" as const,
        description: description || null,
      };
      const { error } = await supabase.from("points_transactions").insert(payload as any);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast({ title: "Points adjusted" });
      await qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: any) => toast({ title: "Failed to adjust points", description: err.message, variant: "destructive" }),
  });

  const [selectedUser, setSelectedUser] = React.useState<string | null>(null);
  const [amount, setAmount] = React.useState<string>("");
  const [desc, setDesc] = React.useState<string>("");

  return (
    <div>
      <Table>
        <TableCaption>All users and their point balances</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Points</TableHead>
            <TableHead className="text-right">Redeemed (mo)</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow>
          ) : users?.length ? (
            users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.email}</TableCell>
                <TableCell>{[u.first_name, u.last_name].filter(Boolean).join(" ") || "-"}</TableCell>
                <TableCell className="text-right">{u.points_balance}</TableCell>
                <TableCell className="text-right">{u.redeemed_this_month}</TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="secondary" onClick={() => setSelectedUser(u.id)}>Adjust points</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adjust Points</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 mt-2">
                        <div>
                          <label className="text-sm">Amount (use negative to deduct)</label>
                          <Input type="number" value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="e.g. 100 or -50" />
                        </div>
                        <div>
                          <label className="text-sm">Description (optional)</label>
                          <Input value={desc} onChange={(e)=>setDesc(e.target.value)} placeholder="Reason for adjustment" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => {
                            if (!selectedUser) return;
                            const amt = parseInt(amount, 10);
                            if (Number.isNaN(amt) || amt === 0) {
                              toast({ title: "Enter a non-zero amount", variant: "destructive" });
                              return;
                            }
                            adjustMutation.mutate({ userId: selectedUser, amount: amt, description: desc });
                            setAmount("");
                            setDesc("");
                          }}
                        >
                          Save
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow><TableCell colSpan={5}>No users found</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminUsers;
