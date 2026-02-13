import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Camera, X } from "lucide-react";

interface AddApplianceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onApplianceAdded: () => void;
}

const applianceTypes = [
  "Air Conditioner", "Refrigerator", "Washing Machine", "Dryer",
  "Dishwasher", "Oven", "Microwave", "Water Heater", "Generator",
  "Ceiling Fan", "Freezer", "Electric Cooker", "Iron", "Blender",
  "Television", "Other"
];

export const AddApplianceDialog = ({ open, onOpenChange, propertyId, onApplianceAdded }: AddApplianceDialogProps) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [notes, setNotes] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Photo must be under 5MB.", variant: "destructive" });
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl: string | null = null;

      if (photo) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const fileExt = photo.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('appliance-photos')
          .upload(fileName, photo);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('appliance-photos')
          .getPublicUrl(fileName);

        photoUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("appliances")
        .insert({
          property_id: propertyId,
          name,
          type,
          brand: brand || null,
          model: model || null,
          notes: notes || null,
          purchase_date: purchaseDate || null,
          photo_url: photoUrl,
          status: "good"
        });

      if (error) throw error;

      toast({
        title: "Appliance added",
        description: "Your appliance has been added successfully.",
      });

      setName("");
      setType("");
      setBrand("");
      setModel("");
      setNotes("");
      setPurchaseDate("");
      removePhoto();
      onOpenChange(false);
      onApplianceAdded();
    } catch (error) {
      console.error("Error adding appliance:", error);
      toast({
        title: "Error",
        description: "Failed to add appliance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Appliance</DialogTitle>
          <DialogDescription>
            Add an appliance to track its maintenance and status.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Photo (Optional)</Label>
              {photoPreview ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={removePhoto}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <label htmlFor="appliance-photo" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                    <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to add a photo</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG (max 5MB)</p>
                  </div>
                  <input
                    id="appliance-photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Appliance Name *</Label>
              <Input id="name" placeholder="e.g., Living Room AC" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={type} onValueChange={setType} required>
                <SelectTrigger><SelectValue placeholder="Select appliance type" /></SelectTrigger>
                <SelectContent>
                  {applianceTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" placeholder="e.g., Samsung" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input id="model" placeholder="e.g., AR5000" value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input id="purchaseDate" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !name || !type}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Appliance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
