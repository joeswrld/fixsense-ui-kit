import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, TrendingUp, Users, Loader2, Download, Calendar } from "lucide-react";
import { format, subDays, isWithinInterval, parseISO } from "date-fns";
import { exportToCSV, transactionExportColumns } from "@/lib/csvExport";
import { useToast } from "@/hooks/use-toast";

const AdminSubscriptions = () => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

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
      // Fetch from transaction_summary
      const { data: summaryData, error: summaryError } = await supabase
        .from("transaction_summary")
        .select("*")
        .order("created_at", { ascending: false });

      if (summaryError) console.error("Error fetching transaction_summary:", summaryError);

      // Fetch from transactions table
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (transactionsError) console.error("Error fetching transactions:", transactionsError);

      // Combine both datasets and add source identifier
      const combined = [
        ...(summaryData || []).map(t => ({ ...t, source: 'summary' })),
        ...(transactionsData || []).map(t => ({ ...t, source: 'transactions' }))
      ];

      // Sort by created_at descending
      combined.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });

      return combined;
    },
  });

  // Filter transactions by date range
  const filteredTransactions = transactions?.filter(t => {
    if (!t.created_at) return true;
    const txDate = parseISO(t.created_at);
    return isWithinInterval(txDate, {
      start: parseISO(startDate),
      end: new Date(endDate + "T23:59:59"),
    });
  });

  const handleExportCSV = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      toast({ title: "No transactions to export", variant: "destructive" });
      return;
    }
    exportToCSV(filteredTransactions, transactionExportColumns, `fixsense_transactions_${startDate}_to_${endDate}`);
    toast({ title: "Transactions exported successfully" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Subscription Management</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Monitor revenue and subscriptions</p>
          </div>
        </div>

        {statsLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Monthly Recurring Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">₦{stats?.mrr.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.pro} Pro + {stats?.business} Business
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Pro Subscribers</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{stats?.pro}</div>
                <p className="text-xs text-muted-foreground">
                  ₦{((stats?.pro || 0) * 5300).toLocaleString()}/mo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Business Subscribers</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{stats?.business}</div>
                <p className="text-xs text-muted-foreground">
                  ₦{((stats?.business || 0) * 14300).toLocaleString()}/mo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Free Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{stats?.free}</div>
                <p className="text-xs text-muted-foreground">
                  Potential: ₦{((stats?.free || 0) * 5300).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Transaction History
                <Badge variant="outline" className="text-xs">
                  {filteredTransactions?.length || 0} records
                </Badge>
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="grid grid-cols-2 gap-4 w-full sm:w-auto">
                  <div className="space-y-1">
                    <Label htmlFor="startDate" className="text-xs">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="endDate" className="text-xs">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                <Button onClick={handleExportCSV} variant="outline" className="w-full sm:w-auto">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="hidden sm:table-cell">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Method</TableHead>
                      <TableHead className="hidden lg:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions?.map((transaction) => (
                      <TableRow key={`${transaction.source}-${transaction.id}`}>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium truncate max-w-[180px]">{transaction.user_email}</div>
                            <div className="text-muted-foreground text-xs truncate max-w-[150px]">{transaction.reference}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge>{transaction.plan}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell font-medium">
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
                        <TableCell className="hidden md:table-cell text-sm capitalize">
                          {transaction.payment_method || "card"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {transaction.created_at ? format(new Date(transaction.created_at), "MMM d, yyyy") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredTransactions?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions found for the selected date range.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
