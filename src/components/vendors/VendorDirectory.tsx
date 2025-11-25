import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Phone, Mail, Globe, Star, Loader2, MapPin, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { VendorAnalytics } from "./VendorAnalytics";

export const VendorDirectory = () => {
  const [open, setOpen] = useState(false);
  const [analyticsVendorId, setAnalyticsVendorId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: vendors, isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: vendorsData, error: vendorsError } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (vendorsError) throw vendorsError;

      // Fetch ratings for each vendor
      const vendorsWithRatings = await Promise.all(
        (vendorsData || []).map(async (vendor) => {
          const { data: ratings } = await supabase
            .from("vendor_ratings")
            .select("rating")
            .eq("vendor_id", vendor.id);

          const avgRating = ratings && ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

          return {
            ...vendor,
            avgRating: Math.round(avgRating * 10) / 10,
            ratingCount: ratings?.length || 0,
          };
        })
      );

      return vendorsWithRatings;
    },
  });

  const addVendorMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const specialtiesArray = specialties
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const { error } = await supabase
        .from("vendors")
        .insert({
          user_id: user.id,
          name,
          contact_email: email || null,
          contact_phone: phone || null,
          address: address || null,
          website: website || null,
          specialties: specialtiesArray.length > 0 ? specialtiesArray : null,
          notes: notes || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setWebsite("");
      setSpecialties("");
      setNotes("");
      toast.success("Vendor added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add vendor");
      console.error(error);
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Service Vendor Directory
            </CardTitle>
            <CardDescription>Manage your trusted service providers</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Service Vendor</DialogTitle>
                <DialogDescription>Add a trusted service provider</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Vendor Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., ABC Appliance Repair"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@vendor.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Main St, City, State"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://vendor.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialties">Specialties (comma-separated)</Label>
                  <Input
                    id="specialties"
                    placeholder="HVAC, Refrigerator, Plumbing"
                    value={specialties}
                    onChange={(e) => setSpecialties(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional information..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => addVendorMutation.mutate()}
                  disabled={!name || addVendorMutation.isPending}
                  className="w-full"
                >
                  {addVendorMutation.isPending ? "Saving..." : "Save Vendor"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !vendors || vendors.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No vendors added yet</p>
        ) : (
          <div className="space-y-4">
              {vendors.map((vendor) => (
              <div key={vendor.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{vendor.name}</h3>
                      {vendor.ratingCount > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {vendor.avgRating} ({vendor.ratingCount})
                        </Badge>
                      )}
                    </div>
                    {vendor.specialties && vendor.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {vendor.specialties.map((specialty: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAnalyticsVendorId(vendor.id)}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </Button>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {vendor.contact_phone && (
                    <a
                      href={`tel:${vendor.contact_phone}`}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      <Phone className="w-3 h-3" />
                      {vendor.contact_phone}
                    </a>
                  )}
                  {vendor.contact_email && (
                    <a
                      href={`mailto:${vendor.contact_email}`}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      <Mail className="w-3 h-3" />
                      {vendor.contact_email}
                    </a>
                  )}
                  {vendor.website && (
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      <Globe className="w-3 h-3" />
                      Website
                    </a>
                  )}
                </div>
                {vendor.address && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {vendor.address}
                  </p>
                )}
                {vendor.notes && (
                  <p className="text-sm text-muted-foreground italic">{vendor.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Analytics Dialog */}
      <Dialog open={!!analyticsVendorId} onOpenChange={(open) => !open && setAnalyticsVendorId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vendor Analytics</DialogTitle>
            <DialogDescription>Performance metrics and service history</DialogDescription>
          </DialogHeader>
          {analyticsVendorId && <VendorAnalytics vendorId={analyticsVendorId} />}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
