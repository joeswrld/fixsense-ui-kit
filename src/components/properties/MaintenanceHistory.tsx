import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Upload, DollarSign, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";

interface MaintenanceHistoryProps {
  applianceId: string;
}

export const MaintenanceHistory = ({ applianceId }: MaintenanceHistoryProps) => {
  const [open, setOpen] = useState(false);
  const [maintenanceType, setMaintenanceType] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [beforePhoto, setBeforePhoto] = useState<File | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const { format: formatCurrency, symbol } = useCurrency();

  const { data: vendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: history, isLoading } = useQuery({
    queryKey: ["maintenance-history", applianceId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("maintenance_history")
        .select(`
          *,
          vendors (
            name,
            contact_phone,
            contact_email
          )
        `)
        .eq("appliance_id", applianceId)
        .eq("user_id", user.id)
        .order("maintenance_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const uploadPhoto = async (file: File, folder: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${applianceId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("maintenance-photos")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("maintenance-photos")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const addMaintenanceMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let beforePhotoUrl = null;
      let afterPhotoUrl = null;

      if (beforePhoto) {
        beforePhotoUrl = await uploadPhoto(beforePhoto, "before");
      }

      if (afterPhoto) {
        afterPhotoUrl = await uploadPhoto(afterPhoto, "after");
      }

      const { error } = await supabase
        .from("maintenance_history")
        .insert({
          appliance_id: applianceId,
          user_id: user.id,
          vendor_id: vendorId || null,
          maintenance_type: maintenanceType,
          cost: cost ? parseFloat(cost) : null,
          notes,
          before_photo_url: beforePhotoUrl,
          after_photo_url: afterPhotoUrl,
          completed: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-history", applianceId] });
      setOpen(false);
      setMaintenanceType("");
      setVendorId("");
      setCost("");
      setNotes("");
      setBeforePhoto(null);
      setAfterPhoto(null);
      toast.success("Maintenance record added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add maintenance record");
      console.error(error);
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Maintenance History</CardTitle>
            <CardDescription>Track completed maintenance tasks</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Maintenance Record</DialogTitle>
                <DialogDescription>Document completed maintenance</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Maintenance Type</Label>
                  <Input
                    id="type"
                    placeholder="e.g., Oil change, Filter replacement"
                    value={maintenanceType}
                    onChange={(e) => setMaintenanceType(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor">Service Vendor (Optional)</Label>
                  <Select value={vendorId} onValueChange={setVendorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors?.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost ({symbol})</Label>
                  <Input
                    id="cost"
                    type="number"
                    placeholder="0.00"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional details about the maintenance..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="before-photo">Before Photo</Label>
                  <Input
                    id="before-photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBeforePhoto(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="after-photo">After Photo</Label>
                  <Input
                    id="after-photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAfterPhoto(e.target.files?.[0] || null)}
                  />
                </div>
                <Button
                  onClick={() => addMaintenanceMutation.mutate()}
                  disabled={!maintenanceType || addMaintenanceMutation.isPending}
                  className="w-full"
                >
                  {addMaintenanceMutation.isPending ? "Saving..." : "Save Record"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : !history || history.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No maintenance history yet</p>
        ) : (
          <div className="space-y-4">
            {history.map((record) => (
              <div key={record.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{record.maintenance_type}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(record.maintenance_date).toLocaleDateString()}
                    </p>
                    {record.vendors && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Vendor: {record.vendors.name}
                      </p>
                    )}
                  </div>
                  {record.cost && (
                    <div className="font-semibold text-primary">
                      {formatCurrency(record.cost)}
                    </div>
                  )}
                </div>
                {record.notes && (
                  <p className="text-sm">{record.notes}</p>
                )}
                {(record.before_photo_url || record.after_photo_url) && (
                  <div className="grid grid-cols-2 gap-2">
                    {record.before_photo_url && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Before</p>
                        <img
                          src={record.before_photo_url}
                          alt="Before maintenance"
                          className="rounded-md w-full h-32 object-cover"
                        />
                      </div>
                    )}
                    {record.after_photo_url && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">After</p>
                        <img
                          src={record.after_photo_url}
                          alt="After maintenance"
                          className="rounded-md w-full h-32 object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};