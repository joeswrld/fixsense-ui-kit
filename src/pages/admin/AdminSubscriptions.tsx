import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, TrendingUp, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";

const AdminSubscriptions = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-subscription-stats"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("subscription_tier, subscription_status");

      const free = profiles?.filter(p => p.subscription_tier === "free").length || 0;
      const pro = profiles?.filter(p => p.subscription_tier === "pro" && p.subscription_status === "active").length || 0;
      const business = profiles?.filter(p => p.subscription_tier === "business" && p.subscription_status === "active").length || 0;

      // Assuming pro = ₦5,300/month, business = ₦14,300/month
      const mrr = (pro * 5300) + (business * 14300);

      return { free, pro, business, mrr, total: profiles?.length || 0 };
    },
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transaction_summary")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">Monitor revenue and subscriptions</p>
        </div>

        {statsLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{stats?.mrr.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  From {stats?.pro} Pro + {stats?.business} Business
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pro Subscribers</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pro}</div>
                <p className="text-xs text-muted-foreground">
                  ₦{((stats?.pro || 0) * 5300).toLocaleString()}/month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Business Subscribers</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.business}</div>
                <p className="text-xs text-muted-foreground">
                  ₦{((stats?.business || 0) * 14300).toLocaleString()}/month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Free Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.free}</div>
                <p className="text-xs text-muted-foreground">
                  Potential revenue: ₦{((stats?.free || 0) * 5300).toLocaleString()}/mo
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{transaction.user_email}</div>
                          <div className="text-muted-foreground text-xs">{transaction.reference}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge>{transaction.plan}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.amount ? `₦${(transaction.amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            transaction.status === "success" ? "default" :
                            transaction.status === "failed" ? "destructive" :
                            "secondary"
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {transaction.payment_method || "card"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {transaction.created_at ? format(new Date(transaction.created_at), "MMM d, yyyy") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
