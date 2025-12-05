import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft,
  Loader2, 
  CheckCircle2, 
  Download, 
  Calendar,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";

const EnhancedCalendar = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(undefined);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [newDate, setNewDate] = useState(undefined);
  
  const [maintenanceType, setMaintenanceType] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);

  const queryClient = useQueryClient();
  const { format: formatCurrency, symbol } = useCurrency();

  // Fetch scheduled maintenance (appliances with next_maintenance_date)
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["scheduled-maintenance"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("appliances")
        .select(`
          id,
          name,
          type,
          next_maintenance_date,
          properties!inner (
            id,
            name,
            user_id
          )
        `)
        .eq("properties.user_id", user.id)
        .not("next_maintenance_date", "is", null)
        .order("next_maintenance_date", { ascending: true });

      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        next_maintenance_date: item.next_maintenance_date,
        property: {
          id: item.properties.id,
          name: item.properties.name
        }
      }));
    },
  });

  // Fetch maintenance history
  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ["maintenance-history-calendar"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("maintenance_history")
        .select(`
          id,
          maintenance_type,
          maintenance_date,
          cost,
          notes,
          appliances!inner (
            id,
            name,
            type,
            properties!inner (
              id,
              name,
              user_id
            )
          ),
          vendors (
            name
          )
        `)
        .eq("user_id", user.id)
        .order("maintenance_date", { ascending: false });

      if (error) throw error;

      return (data || []).map(record => ({
        id: record.id,
        appliance_id: record.appliances.id,
        maintenance_type: record.maintenance_type,
        maintenance_date: record.maintenance_date,
        cost: record.cost,
        notes: record.notes,
        appliance_name: record.appliances.name,
        appliance_type: record.appliances.type,
        property_name: record.appliances.properties.name,
        vendor_name: record.vendors?.name
      }));
    },
  });

  // Fetch vendors
  const { data: vendors = [] } = useQuery({
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
      return data || [];
    },
  });

  // Upload photo to storage
  const uploadPhoto = async (file, applianceId) => {
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

  // Reschedule maintenance
  const rescheduleMutation = useMutation({
    mutationFn: async ({ applianceId, newDate }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("appliances")
        .update({ next_maintenance_date: format(newDate, "yyyy-MM-dd") })
        .eq("id", applianceId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-maintenance"] });
      toast.success("Maintenance rescheduled successfully");
      setShowDialog(false);
      setSelectedEvent(null);
      setNewDate(undefined);
    },
    onError: () => {
      toast.error("Failed to reschedule maintenance");
    },
  });

  // Complete maintenance
  const completeMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let beforePhotoUrl = null;
      let afterPhotoUrl = null;

      if (beforePhoto) {
        beforePhotoUrl = await uploadPhoto(beforePhoto, selectedEvent.id);
      }

      if (afterPhoto) {
        afterPhotoUrl = await uploadPhoto(afterPhoto, selectedEvent.id);
      }

      // Add to maintenance history
      const { error: historyError } = await supabase
        .from("maintenance_history")
        .insert({
          appliance_id: selectedEvent.id,
          user_id: user.id,
          vendor_id: vendorId || null,
          maintenance_type: maintenanceType,
          cost: cost ? parseFloat(cost) : null,
          notes,
          before_photo_url: beforePhotoUrl,
          after_photo_url: afterPhotoUrl,
          completed: true,
        });

      if (historyError) throw historyError;

      // Update next maintenance date (30 days from today)
      const today = new Date();
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + 30);

      const { error: updateError } = await supabase
        .from("appliances")
        .update({ next_maintenance_date: format(nextDate, "yyyy-MM-dd") })
        .eq("id", selectedEvent.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-history-calendar"] });
      toast.success("Maintenance completed successfully");
      
      setMaintenanceType("");
      setVendorId("");
      setCost("");
      setNotes("");
      setBeforePhoto(null);
      setAfterPhoto(null);
      setShowCompletionDialog(false);
      setSelectedEvent(null);
    },
    onError: () => {
      toast.error("Failed to complete maintenance");
    },
  });

  const handleReschedule = () => {
    if (!selectedEvent || !newDate) return;
    rescheduleMutation.mutate({ applianceId: selectedEvent.id, newDate });
  };

  const handleMarkCompleted = () => {
    if (!selectedEvent) return;
    setMaintenanceType(`Scheduled maintenance for ${selectedEvent.name}`);
    setShowDialog(false);
    setShowCompletionDialog(true);
  };

  const handleSaveCompletion = () => {
    if (!selectedEvent || !maintenanceType) return;
    completeMutation.mutate();
  };

  const getEventsForDate = (date) => {
    return events.filter(
      event => format(new Date(event.next_maintenance_date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
  };

  const getHistoryForDate = (date) => {
    return history.filter(
      record => format(new Date(record.maintenance_date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
  };

  const datesWithEvents = events.map(event => new Date(event.next_maintenance_date));
  const datesWithHistory = history.map(record => new Date(record.maintenance_date));

  // Calculate statistics
  const upcomingCount = events.filter(e => {
    const diff = new Date(e.next_maintenance_date).getTime() - new Date().getTime();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  }).length;

  const completedThisMonth = history.filter(h => {
    const date = new Date(h.maintenance_date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const totalSpentThisMonth = history.filter(h => {
    const date = new Date(h.maintenance_date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).reduce((sum, h) => sum + (h.cost || 0), 0);

  if (eventsLoading || historyLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="container px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Maintenance Calendar
                </h1>
                <p className="text-slate-600">View scheduled and completed maintenance</p>
              </div>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Download className="w-4 h-4 mr-2" />
                Export Calendar
              </Button>
            </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Maintenance Schedule</CardTitle>
              <CardDescription>
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  Scheduled
                  <span className="w-3 h-3 rounded-full bg-green-500 ml-2"></span>
                  Completed
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  scheduled: datesWithEvents,
                  completed: datesWithHistory,
                }}
                modifiersStyles={{
                  scheduled: {
                    backgroundColor: "rgb(59 130 246)",
                    color: "white",
                    fontWeight: "bold",
                  },
                  completed: {
                    backgroundColor: "rgb(34 197 94)",
                    color: "white",
                    fontWeight: "bold",
                  },
                }}
              />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>
                {selectedDate
                  ? format(selectedDate, "MMMM d, yyyy")
                  : "Upcoming Maintenance"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="scheduled" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="scheduled">
                    <Calendar className="w-4 h-4 mr-2" />
                    Scheduled
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <History className="w-4 h-4 mr-2" />
                    History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="scheduled" className="space-y-3 mt-4">
                  {selectedDate ? (
                    getEventsForDate(selectedDate).length === 0 ? (
                      <p className="text-center text-slate-500 py-8">
                        No maintenance scheduled for this date
                      </p>
                    ) : (
                      getEventsForDate(selectedDate).map((event) => (
                        <div
                          key={event.id}
                          className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer border-l-4 border-blue-500"
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowDialog(true);
                          }}
                        >
                          <p className="font-semibold text-lg">{event.name}</p>
                          <p className="text-sm text-slate-600">{event.property.name}</p>
                          <Badge variant="outline" className="mt-2">{event.type}</Badge>
                        </div>
                      ))
                    )
                  ) : (
                    events.slice(0, 10).map((event) => (
                      <div
                        key={event.id}
                        className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer border-l-4 border-blue-500"
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowDialog(true);
                        }}
                      >
                        <p className="font-semibold text-lg">{event.name}</p>
                        <p className="text-sm text-slate-600">{event.property.name}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{event.type}</Badge>
                          <span className="text-sm text-slate-500">
                            {format(new Date(event.next_maintenance_date), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="history" className="space-y-3 mt-4">
                  {selectedDate ? (
                    getHistoryForDate(selectedDate).length === 0 ? (
                      <p className="text-center text-slate-500 py-8">
                        No completed maintenance on this date
                      </p>
                    ) : (
                      getHistoryForDate(selectedDate).map((record) => (
                        <div
                          key={record.id}
                          className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-lg">{record.maintenance_type}</p>
                              <p className="text-sm text-slate-600">
                                {record.appliance_name} • {record.property_name}
                              </p>
                            </div>
                            {record.cost && (
                              <div className="font-semibold text-green-600">
                                {formatCurrency(record.cost)}
                              </div>
                            )}
                          </div>
                          {record.notes && (
                            <p className="text-sm text-slate-600 mt-2">{record.notes}</p>
                          )}
                        </div>
                      ))
                    )
                  ) : (
                    history.slice(0, 10).map((record) => (
                      <div
                        key={record.id}
                        className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-lg">{record.maintenance_type}</p>
                            <p className="text-sm text-slate-600">
                              {record.appliance_name} • {record.property_name}
                            </p>
                            <span className="text-sm text-slate-500">
                              {format(new Date(record.maintenance_date), "MMM d, yyyy")}
                            </span>
                          </div>
                          {record.cost && (
                            <div className="font-semibold text-green-600">
                              {formatCurrency(record.cost)}
                            </div>
                          )}
                        </div>
                        {record.notes && (
                          <p className="text-sm text-slate-600 mt-2">{record.notes}</p>
                        )}
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Upcoming (30 days)</p>
                  <p className="text-3xl font-bold text-blue-600">{upcomingCount}</p>
                </div>
                <Calendar className="w-10 h-10 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Completed This Month</p>
                  <p className="text-3xl font-bold text-green-600">{completedThisMonth}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Spent (Month)</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {formatCurrency(totalSpentThisMonth)}
                  </p>
                </div>
                <Download className="w-10 h-10 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.name}</DialogTitle>
            <DialogDescription>
              {selectedEvent?.property.name} • {selectedEvent?.type}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium mb-2">Current Maintenance Date</p>
              <p className="text-sm text-slate-600">
                {selectedEvent && format(new Date(selectedEvent.next_maintenance_date), "MMMM d, yyyy")}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Reschedule to</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newDate && "text-slate-500"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {newDate ? format(newDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={newDate}
                    onSelect={setNewDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleMarkCompleted}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark Completed
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!newDate || rescheduleMutation.isPending}
              className="w-full sm:w-auto"
            >
              {rescheduleMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Maintenance</DialogTitle>
            <DialogDescription>
              Document the completed maintenance for {selectedEvent?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Maintenance Type *</Label>
              <Input
                id="type"
                placeholder="e.g., Filter replacement, Annual inspection"
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
                  {vendors.map((vendor) => (
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
                rows={4}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="before-photo">Before Photo</Label>
                <Input
                  id="before-photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBeforePhoto(e.target.files?.[0])}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="after-photo">After Photo</Label>
                <Input
                  id="after-photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAfterPhoto(e.target.files?.[0])}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompletionDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveCompletion}
              disabled={!maintenanceType || completeMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {completeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save & Complete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedCalendar;