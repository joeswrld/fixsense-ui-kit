import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface EditApplianceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appliance: {
    id: string;
    name: string;
    type: string;
    brand: string | null;
    model: string | null;
    notes: string | null;
    purchase_date: string | null;
  };
  onApplianceUpdated: () => void;
}

const applianceTypes = [
  "Air Conditioner", "Refrigerator", "Washing Machine", "Dryer",
  "Dishwasher", "Oven", "Microwave", "Water Heater", "Generator",
  "Ceiling Fan", "Freezer", "Electric Cooker", "Iron", "Blender",
  "Television", "Other"
];

export const EditApplianceDialog = ({ open, onOpenChange, appliance, onApplianceUpdated }: EditApplianceDialogProps) => {
  const [name, setName] = useState(appliance.name);
  const [type, setType] = useState(appliance.type);
  const [brand, setBrand] = useState(appliance.brand || "");
  const [model, setModel] = useState(appliance.model || "");
  const [notes, setNotes] = useState(appliance.notes || "");
  const [purchaseDate, setPurchaseDate] = useState(appliance.purchase_date || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setName(appliance.name);
    setType(appliance.type);
    setBrand(appliance.brand || "");
    setModel(appliance.model || "");
    setNotes(appliance.notes || "");
    setPurchaseDate(appliance.purchase_date || "");
  }, [appliance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("appliances")
        .update({
          name,
          type,
          brand: brand || null,
          model: model || null,
          notes: notes || null,
          purchase_date: purchaseDate || null,
        })
        .eq("id", appliance.id);

      if (error) throw error;

      toast({
        title: "Appliance updated",
        description: "Your appliance details have been saved.",
      });

      onOpenChange(false);
      onApplianceUpdated();
    } catch (error) {
      console.error("Error updating appliance:", error);
      toast({
        title: "Error",
        description: "Failed to update appliance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Appliance</DialogTitle>
          <DialogDescription>Update this appliance's details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Appliance Name *</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type *</Label>
              <Select value={type} onValueChange={setType} required>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {applianceTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-brand">Brand</Label>
                <Input id="edit-brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-model">Model</Label>
                <Input id="edit-model" value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-purchaseDate">Purchase Date</Label>
              <Input id="edit-purchaseDate" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !name || !type}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
