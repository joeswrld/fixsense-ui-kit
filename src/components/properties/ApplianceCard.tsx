import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, AlertTriangle, Trash2, Wrench, ExternalLink } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Appliance {
  id: string;
  name: string;
  type: string;
  brand: string | null;
  model: string | null;
  status: string | null;
  notes: string | null;
}

interface ApplianceCardProps {
  appliance: Appliance;
  onUpdate: () => void;
}

const statusConfig = {
  good: { icon: CheckCircle2, label: "Good", variant: "default" as const, color: "text-green-500" },
  warning: { icon: AlertTriangle, label: "Warning", variant: "secondary" as const, color: "text-yellow-500" },
  critical: { icon: AlertCircle, label: "Critical", variant: "destructive" as const, color: "text-destructive" },
};

export const ApplianceCard = ({ appliance, onUpdate }: ApplianceCardProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const status = statusConfig[appliance.status as keyof typeof statusConfig] || statusConfig.good;
  const StatusIcon = status.icon;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("appliances")
        .delete()
        .eq("id", appliance.id);

      if (error) throw error;

      toast({
        title: "Appliance deleted",
        description: `${appliance.name} has been removed.`,
      });
      onUpdate();
    } catch (error) {
      console.error("Error deleting appliance:", error);
      toast({
        title: "Error",
        description: "Failed to delete appliance.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Card className="border-l-4" style={{ borderLeftColor: status.color === "text-green-500" ? "hsl(var(--primary))" : status.color === "text-yellow-500" ? "hsl(var(--secondary))" : "hsl(var(--destructive))" }}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Wrench className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-semibold">{appliance.name}</h4>
                <Badge variant={status.variant} className="gap-1">
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{appliance.type}</p>
              {(appliance.brand || appliance.model) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {appliance.brand} {appliance.model}
                </p>
              )}
              {appliance.notes && (
                <p className="text-sm text-muted-foreground mt-2 italic">{appliance.notes}</p>
              )}
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate(`/appliances/${appliance.id}`)}
                className="px-0 h-auto mt-2"
              >
                View Details
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appliance?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{appliance.name}". This action cannot be undone.
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
