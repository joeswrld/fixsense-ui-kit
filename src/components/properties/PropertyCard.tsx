import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Plus, Trash2, AlertTriangle } from "lucide-react";
import { AddApplianceDialog } from "./AddApplianceDialog";
import { ApplianceCard } from "./ApplianceCard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Property {
  id: string;
  name: string;
  address: string | null;
}

interface Appliance {
  id: string;
  name: string;
  type: string;
  brand: string | null;
  model: string | null;
  status: string | null;
  notes: string | null;
}

interface PropertyCardProps {
  property: Property;
  appliances: Appliance[];
  onUpdate: () => void;
}

export const PropertyCard = ({ property, appliances, onUpdate }: PropertyCardProps) => {
  const [addApplianceOpen, setAddApplianceOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const criticalAppliances = appliances.filter(a => a.status === 'critical').length;
  const warningAppliances = appliances.filter(a => a.status === 'warning').length;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", property.id);

      if (error) throw error;

      toast({
        title: "Property deleted",
        description: "Property and all its appliances have been removed.",
      });
      onUpdate();
    } catch (error) {
      console.error("Error deleting property:", error);
      toast({
        title: "Error",
        description: "Failed to delete property.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                {property.name}
              </CardTitle>
              {property.address && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {property.address}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
          {(criticalAppliances > 0 || warningAppliances > 0) && (
            <div className="flex gap-2 pt-2">
              {criticalAppliances > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {criticalAppliances} Critical
                </Badge>
              )}
              {warningAppliances > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {warningAppliances} Warning
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {appliances.length} {appliances.length === 1 ? 'appliance' : 'appliances'}
            </p>
            <Button size="sm" onClick={() => setAddApplianceOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Appliance
            </Button>
          </div>

          {appliances.length > 0 && (
            <div className="space-y-3">
              {appliances.map((appliance) => (
                <ApplianceCard
                  key={appliance.id}
                  appliance={appliance}
                  onUpdate={onUpdate}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddApplianceDialog
        open={addApplianceOpen}
        onOpenChange={setAddApplianceOpen}
        propertyId={property.id}
        onApplianceAdded={onUpdate}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{property.name}" and all its appliances. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
