import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Scale, Star, Wrench, DollarSign, Loader2 } from "lucide-react";
import { useState } from "react";

export const VendorComparison = () => {
  const [open, setOpen] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);

  const { data: vendors, isLoading } = useQuery({
    queryKey: ["vendors-comparison"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: vendorsData, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;

      // Fetch stats for each vendor
      const vendorsWithStats = await Promise.all(
        (vendorsData || []).map(async (vendor) => {
          const { data: maintenanceData } = await supabase
            .from("maintenance_history")
            .select("cost")
            .eq("vendor_id", vendor.id);

          const { data: ratingsData } = await supabase
            .from("vendor_ratings")
            .select("rating")
            .eq("vendor_id", vendor.id);

          const totalServices = maintenanceData?.length || 0;
          const totalCost = maintenanceData?.reduce((sum, m) => sum + (Number(m.cost) || 0), 0) || 0;
          const avgCost = totalServices > 0 ? totalCost / totalServices : 0;
          const avgRating = ratingsData && ratingsData.length > 0
            ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
            : 0;

          return {
            ...vendor,
            totalServices,
            totalCost,
            avgCost,
            avgRating: Math.round(avgRating * 10) / 10,
            ratingCount: ratingsData?.length || 0,
          };
        })
      );

      return vendorsWithStats;
    },
  });

  const toggleVendor = (vendorId: string) => {
    setSelectedVendors((prev) => {
      if (prev.includes(vendorId)) {
        return prev.filter((id) => id !== vendorId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, vendorId];
    });
  };

  const selectedVendorData = vendors?.filter((v) => selectedVendors.includes(v.id)) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Scale className="w-4 h-4 mr-2" />
          Compare Vendors
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Service Vendors</DialogTitle>
          <DialogDescription>Select up to 3 vendors to compare their performance</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Vendor Selection */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Select Vendors (Max 3)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vendors?.map((vendor) => (
                  <div key={vendor.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={vendor.id}
                      checked={selectedVendors.includes(vendor.id)}
                      onCheckedChange={() => toggleVendor(vendor.id)}
                      disabled={!selectedVendors.includes(vendor.id) && selectedVendors.length >= 3}
                    />
                    <label
                      htmlFor={vendor.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {vendor.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison Grid */}
            {selectedVendorData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedVendorData.map((vendor) => (
                  <Card key={vendor.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{vendor.name}</CardTitle>
                      {vendor.specialties && vendor.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {vendor.specialties.slice(0, 3).map((specialty: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Rating */}
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">Rating</span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {vendor.avgRating > 0 ? vendor.avgRating : "N/A"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {vendor.ratingCount} review{vendor.ratingCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      {/* Services */}
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">Services</span>
                        </div>
                        <p className="text-lg font-bold">{vendor.totalServices}</p>
                      </div>

                      {/* Average Cost */}
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">Avg Cost</span>
                        </div>
                        <p className="text-lg font-bold">
                          ₦{vendor.avgCost > 0 ? Math.round(vendor.avgCost).toLocaleString() : "0"}
                        </p>
                      </div>

                      {/* Total Spent */}
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">Total Spent</span>
                        </div>
                        <p className="text-lg font-bold">₦{vendor.totalCost.toLocaleString()}</p>
                      </div>

                      {/* Contact */}
                      {vendor.contact_phone && (
                        <div className="pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-1">Contact</p>
                          <p className="text-sm">{vendor.contact_phone}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {selectedVendorData.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Select vendors above to compare their performance
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
