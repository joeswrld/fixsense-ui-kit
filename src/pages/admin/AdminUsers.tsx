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
import { Search, MoreVertical, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { exportToCSV, userExportColumns } from "@/lib/csvExport";

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

  const updateUserPlan = useMutation({
    mutationFn: async ({ userId, newTier }: { userId: string; newTier: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update subscription tier in profiles
      const { error } = await supabase
        .from("profiles")
        .update({ subscription_tier: newTier })
        .eq("id", userId);

      if (error) throw error;

      // Log admin action
      await supabase.from("admin_logs").insert({
        admin_id: user.id,
        action: "update_user_plan",
        target_user_id: userId,
        details: { new_tier: newTier },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User plan updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update user plan", 
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

  const handleExportCSV = () => {
    if (!users || users.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    exportToCSV(users, userExportColumns, "fixsense_users");
    toast({ title: "Users exported successfully" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Manage all users and their subscriptions</p>
          </div>
          <Button onClick={handleExportCSV} variant="outline" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-full">
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
            <SelectTrigger className="w-full">
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

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-3">
              {users?.map((user) => (
                <div key={user.id} className="border rounded-lg p-4 bg-card space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{user.full_name || "No name"}</div>
                      <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateUserPlan.mutate({ userId: user.id, newTier: "pro" })}>
                          Upgrade to Pro
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateUserPlan.mutate({ userId: user.id, newTier: "business" })}>
                          Upgrade to Business
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateUserPlan.mutate({ userId: user.id, newTier: "free" })}>
                          Downgrade to Free
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateUserStatus.mutate({ userId: user.id, status: user.subscription_status === "active" ? "suspended" : "active" })}>
                          {user.subscription_status === "active" ? "Suspend" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => resetUserLimits.mutate(user.id)}>
                          Reset Usage Limits
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={user.subscription_tier === "free" ? "secondary" : "default"}>
                      {user.subscription_tier}
                    </Badge>
                    <Badge variant={user.subscription_status === "active" ? "default" : user.subscription_status === "expired" ? "destructive" : "secondary"}>
                      {user.subscription_status}
                    </Badge>
                    <Badge variant={user.role === "admin" ? "destructive" : "outline"}>
                      {user.role}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{user.country || "No country"}</span>
                    <span>{format(new Date(user.created_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="hidden lg:table-cell">Country</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Role</TableHead>
                    <TableHead className="hidden lg:table-cell">Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.full_name || "No name"}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-[180px]">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{user.phone || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{user.country || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={user.subscription_tier === "free" ? "secondary" : "default"}>
                          {user.subscription_tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.subscription_status === "active" ? "default" : user.subscription_status === "expired" ? "destructive" : "secondary"}>
                          {user.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={user.role === "admin" ? "destructive" : "outline"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
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
                            <DropdownMenuItem onClick={() => updateUserPlan.mutate({ userId: user.id, newTier: "pro" })}>
                              Upgrade to Pro
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateUserPlan.mutate({ userId: user.id, newTier: "business" })}>
                              Upgrade to Business
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateUserPlan.mutate({ userId: user.id, newTier: "free" })}>
                              Downgrade to Free
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateUserStatus.mutate({ userId: user.id, status: user.subscription_status === "active" ? "suspended" : "active" })}>
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
            </div>
          </>
        )}

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
