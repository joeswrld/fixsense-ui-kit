import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type UserWithRole = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  country: string;
  subscription_tier: string;
  subscription_status: string;
  created_at: string;
  role: string;
};

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", searchTerm, planFilter, countryFilter],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*");

      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
      }

      if (planFilter !== "all") {
        query = query.eq("subscription_tier", planFilter);
      }

      if (countryFilter !== "all") {
        query = query.eq("country", countryFilter);
      }

      const { data: profiles, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch roles separately for each user
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id)
            .order("role", { ascending: true })
            .limit(1)
            .single();

          return {
            ...profile,
            role: roleData?.role || "free"
          };
        })
      );

      return usersWithRoles as UserWithRole[];
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete existing roles
      await supabase.from("user_roles").delete().eq("user_id", userId);

      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert([{ user_id: userId, role: newRole as any }]);

      if (error) throw error;

      // Log admin action
      await supabase.from("admin_logs").insert({
        admin_id: user.id,
        action: "update_user_role",
        target_user_id: userId,
        details: { new_role: newRole },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User role updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update user role", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateUserStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ subscription_status: status })
        .eq("id", userId);

      if (error) throw error;

      await supabase.from("admin_logs").insert({
        admin_id: user.id,
        action: "update_user_status",
        target_user_id: userId,
        details: { new_status: status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User status updated successfully" });
    },
  });

  const resetUserLimits = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ diagnostics_used_this_month: 0 })
        .eq("id", userId);

      if (error) throw error;

      await supabase.from("admin_logs").insert({
        admin_id: user.id,
        action: "reset_user_limits",
        target_user_id: userId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User limits reset successfully" });
    },
  });

  const countries = [...new Set(users?.map(u => u.country).filter(Boolean))];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage all users and their subscriptions</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map((country) => (
                <SelectItem key={country} value={country || ""}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.full_name || "No name"}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.phone || "—"}</TableCell>
                    <TableCell>{user.country || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={user.subscription_tier === "free" ? "secondary" : "default"}>
                        {user.subscription_tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          user.subscription_status === "active" ? "default" :
                          user.subscription_status === "expired" ? "destructive" : 
                          "secondary"
                        }
                      >
                        {user.subscription_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "destructive" : "outline"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(user.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => updateUserRole.mutate({ userId: user.id, newRole: "pro" })}
                          >
                            Upgrade to Pro
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateUserRole.mutate({ userId: user.id, newRole: "business" })}
                          >
                            Upgrade to Business
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateUserRole.mutate({ userId: user.id, newRole: "free" })}
                          >
                            Downgrade to Free
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateUserStatus.mutate({ 
                              userId: user.id, 
                              status: user.subscription_status === "active" ? "suspended" : "active" 
                            })}
                          >
                            {user.subscription_status === "active" ? "Suspend" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => resetUserLimits.mutate(user.id)}>
                            Reset Usage Limits
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {users && users.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No users found matching your filters.
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
