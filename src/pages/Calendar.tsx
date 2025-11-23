import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Loader2, CheckCircle2, Download, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { downloadICalFile, generateGoogleCalendarUrl, CalendarEvent } from "@/lib/calendarExport";
import { AppHeader } from "@/components/AppHeader";

interface MaintenanceEvent {
  id: string;
  name: string;
  type: string;
  next_maintenance_date: string;
  property: { name: string; id: string };
}

const Calendar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<MaintenanceEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<MaintenanceEvent | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [newDate, setNewDate] = useState<Date | undefined>();

  useEffect(() => {
    fetchMaintenanceEvents();
  }, []);

  const fetchMaintenanceEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

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

      setEvents(data?.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        next_maintenance_date: a.next_maintenance_date,
        property: a.properties as any,
      })) || []);
    } catch (error) {
      console.error("Error fetching maintenance events:", error);
      toast({
        title: "Error",
        description: "Failed to load maintenance schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedEvent || !newDate) return;

    try {
      const { error } = await supabase
        .from("appliances")
        .update({ next_maintenance_date: format(newDate, "yyyy-MM-dd") })
        .eq("id", selectedEvent.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Maintenance date has been rescheduled",
      });

      setShowDialog(false);
      setSelectedEvent(null);
      setNewDate(undefined);
      fetchMaintenanceEvents();
    } catch (error) {
      console.error("Error rescheduling maintenance:", error);
      toast({
        title: "Error",
        description: "Failed to reschedule maintenance",
        variant: "destructive",
      });
    }
  };

  const handleMarkCompleted = async () => {
    if (!selectedEvent) return;

    try {
      const today = new Date();
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + 30);

      const { error } = await supabase
        .from("appliances")
        .update({
          last_maintenance_date: format(today, "yyyy-MM-dd"),
          next_maintenance_date: format(nextDate, "yyyy-MM-dd"),
        })
        .eq("id", selectedEvent.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Maintenance marked as completed",
      });

      setShowDialog(false);
      setSelectedEvent(null);
      fetchMaintenanceEvents();
    } catch (error) {
      console.error("Error marking maintenance as completed:", error);
      toast({
        title: "Error",
        description: "Failed to update maintenance status",
        variant: "destructive",
      });
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(
      event => format(new Date(event.next_maintenance_date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
  };

  const datesWithEvents = events.map(event => new Date(event.next_maintenance_date));

  const handleExportAll = () => {
    const calendarEvents: CalendarEvent[] = events.map(event => {
      const startDate = new Date(event.next_maintenance_date);
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 2);

      return {
        id: event.id,
        title: `Maintenance: ${event.name}`,
        description: `Scheduled maintenance for ${event.type} at ${event.property.name}`,
        location: event.property.name,
        startDate,
        endDate,
      };
    });

    downloadICalFile(calendarEvents);
    toast({
      title: "Calendar Exported",
      description: "Your maintenance schedule has been exported. Import it into any calendar app.",
    });
  };

  const handleExportSingle = (event: MaintenanceEvent) => {
    const startDate = new Date(event.next_maintenance_date);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 2);

    const calendarEvent: CalendarEvent = {
      id: event.id,
      title: `Maintenance: ${event.name}`,
      description: `Scheduled maintenance for ${event.type} at ${event.property.name}`,
      location: event.property.name,
      startDate,
      endDate,
    };

    window.open(generateGoogleCalendarUrl(calendarEvent), "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-accent/10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent/10">
      <AppHeader />

      <main className="container px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Maintenance Calendar</h1>
              <p className="text-muted-foreground">View and manage scheduled maintenance across all properties</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  Export Calendar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportAll}>
                  Download iCal File
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Schedule</CardTitle>
                <CardDescription>Click on a date to view scheduled maintenance</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border pointer-events-auto"
                  modifiers={{
                    hasEvent: datesWithEvents,
                  }}
                  modifiersStyles={{
                    hasEvent: {
                      backgroundColor: "hsl(var(--primary))",
                      color: "white",
                      fontWeight: "bold",
                    },
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedDate
                    ? `Maintenance on ${format(selectedDate, "MMMM d, yyyy")}`
                    : "Upcoming Maintenance"}
                </CardTitle>
                <CardDescription>
                  {selectedDate
                    ? "Scheduled for this date"
                    : "Next 30 days"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDate ? (
                  <div className="space-y-3">
                    {getEventsForDate(selectedDate).length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No maintenance scheduled for this date
                      </p>
                    ) : (
                      getEventsForDate(selectedDate).map((event) => (
                        <div
                          key={event.id}
                          className="p-4 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => {
                                setSelectedEvent(event);
                                setShowDialog(true);
                              }}
                            >
                              <p className="font-medium">{event.name}</p>
                              <p className="text-sm text-muted-foreground">{event.property.name}</p>
                              <Badge variant="outline" className="mt-2">{event.type}</Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportSingle(event);
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.slice(0, 10).map((event) => (
                      <div
                        key={event.id}
                        className="p-4 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowDialog(true);
                            }}
                          >
                            <p className="font-medium">{event.name}</p>
                            <p className="text-sm text-muted-foreground">{event.property.name}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{event.type}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(event.next_maintenance_date), "MMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportSingle(event);
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

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
              <p className="text-sm text-muted-foreground">
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
                      !newDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newDate ? format(newDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={newDate}
                    onSelect={setNewDate}
                    initialFocus
                    className="pointer-events-auto"
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
              className="w-full sm:w-auto"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark Completed
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!newDate}
              className="w-full sm:w-auto"
            >
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;