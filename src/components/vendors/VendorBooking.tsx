import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

interface VendorBookingProps {
  vendorId: string;
  vendorName: string;
}

export const VendorBooking = ({ vendorId, vendorName }: VendorBookingProps) => {
  const [open, setOpen] = useState(false);
  const [serviceType, setServiceType] = useState("");
  const [applianceId, setApplianceId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: appliances } = useQuery({
    queryKey: ["user-appliances"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("appliances")
        .select(`
          id,
          name,
          type,
          properties (
            name
          )
        `)
        .eq("properties.user_id", user.id);

      if (error) throw error;
      return data;
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("vendor_bookings").insert({
        user_id: user.id,
        vendor_id: vendorId,
        appliance_id: applianceId || null,
        service_type: serviceType,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        notes: notes || null,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-bookings"] });
      setOpen(false);
      setServiceType("");
      setApplianceId("");
      setScheduledDate("");
      setScheduledTime("");
      setNotes("");
      toast.success("Booking request sent successfully");
    },
    onError: (error) => {
      toast.error("Failed to create booking");
      console.error(error);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Calendar className="w-4 h-4 mr-2" />
          Book Service
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book Service with {vendorName}</DialogTitle>
          <DialogDescription>Schedule a service appointment</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service-type">Service Type *</Label>
            <Input
              id="service-type"
              placeholder="e.g., AC Repair, Refrigerator Maintenance"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="appliance">Appliance (Optional)</Label>
            <Select value={applianceId} onValueChange={setApplianceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an appliance" />
              </SelectTrigger>
              <SelectContent>
                {appliances?.map((appliance) => (
                  <SelectItem key={appliance.id} value={appliance.id}>
                    {appliance.name} ({appliance.type}) - {appliance.properties?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional details about the service needed..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button
            onClick={() => bookingMutation.mutate()}
            disabled={!serviceType || !scheduledDate || !scheduledTime || bookingMutation.isPending}
            className="w-full"
          >
            {bookingMutation.isPending ? "Booking..." : "Confirm Booking"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
