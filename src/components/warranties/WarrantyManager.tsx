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
import { Shield, Plus, Calendar, AlertTriangle, FileText, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface WarrantyManagerProps {
  applianceId: string;
}

export const WarrantyManager = ({ applianceId }: WarrantyManagerProps) => {
  const [open, setOpen] = useState(false);
  const [warrantyType, setWarrantyType] = useState("");
  const [provider, setProvider] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [coverageDetails, setCoverageDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [document, setDocument] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data: warranties, isLoading } = useQuery({
    queryKey: ["warranties", applianceId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("warranties")
        .select("*")
        .eq("appliance_id", applianceId)
        .order("expiration_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const uploadDocument = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${applianceId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("warranty-documents")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("warranty-documents")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const addWarrantyMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let documentUrl = null;
      if (document) {
        documentUrl = await uploadDocument(document);
      }

      const { error } = await supabase
        .from("warranties")
        .insert({
          appliance_id: applianceId,
          user_id: user.id,
          warranty_type: warrantyType,
          provider,
          purchase_date: purchaseDate || null,
          expiration_date: expirationDate || null,
          coverage_details: coverageDetails,
          document_url: documentUrl,
          notes,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warranties", applianceId] });
      setOpen(false);
      setWarrantyType("");
      setProvider("");
      setPurchaseDate("");
      setExpirationDate("");
      setCoverageDetails("");
      setNotes("");
      setDocument(null);
      toast.success("Warranty added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add warranty");
      console.error(error);
    },
  });

  const isExpiringSoon = (expirationDate: string) => {
    const expiration = new Date(expirationDate);
    const today = new Date();
    const daysUntilExpiration = Math.floor((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration <= 30 && daysUntilExpiration >= 0;
  };

  const isExpired = (expirationDate: string) => {
    return new Date(expirationDate) < new Date();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Warranty Information
            </CardTitle>
            <CardDescription>Manage warranty documents and expiration dates</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Warranty
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Warranty</DialogTitle>
                <DialogDescription>Add warranty information and documents</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Warranty Type</Label>
                  <Select value={warrantyType} onValueChange={setWarrantyType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manufacturer">Manufacturer Warranty</SelectItem>
                      <SelectItem value="extended">Extended Warranty</SelectItem>
                      <SelectItem value="service_plan">Service Plan</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Input
                    id="provider"
                    placeholder="e.g., Samsung, Best Buy"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchase">Purchase Date</Label>
                    <Input
                      id="purchase"
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiration">Expiration Date</Label>
                    <Input
                      id="expiration"
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coverage">Coverage Details</Label>
                  <Textarea
                    id="coverage"
                    placeholder="What's covered by this warranty..."
                    value={coverageDetails}
                    onChange={(e) => setCoverageDetails(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document">Warranty Document</Label>
                  <Input
                    id="document"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setDocument(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => addWarrantyMutation.mutate()}
                  disabled={!warrantyType || addWarrantyMutation.isPending}
                  className="w-full"
                >
                  {addWarrantyMutation.isPending ? "Saving..." : "Save Warranty"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : !warranties || warranties.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No warranties added yet</p>
        ) : (
          <div className="space-y-4">
            {warranties.map((warranty) => (
              <div key={warranty.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold capitalize">
                        {warranty.warranty_type.replace("_", " ")}
                      </h3>
                      {warranty.expiration_date && isExpired(warranty.expiration_date) && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                      {warranty.expiration_date && isExpiringSoon(warranty.expiration_date) && !isExpired(warranty.expiration_date) && (
                        <Badge variant="secondary" className="gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Expiring Soon
                        </Badge>
                      )}
                      {warranty.expiration_date && !isExpired(warranty.expiration_date) && !isExpiringSoon(warranty.expiration_date) && (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                    {warranty.provider && (
                      <p className="text-sm text-muted-foreground">{warranty.provider}</p>
                    )}
                    {warranty.expiration_date && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        Expires: {new Date(warranty.expiration_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {warranty.document_url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(warranty.document_url!, "_blank")}
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {warranty.coverage_details && (
                  <p className="text-sm">{warranty.coverage_details}</p>
                )}
                {warranty.notes && (
                  <p className="text-sm text-muted-foreground italic">{warranty.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
