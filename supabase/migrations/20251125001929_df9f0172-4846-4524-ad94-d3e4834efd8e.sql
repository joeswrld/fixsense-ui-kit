-- Create vendor_bookings table for scheduling services
CREATE TABLE public.vendor_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  appliance_id uuid REFERENCES public.appliances(id) ON DELETE SET NULL,
  service_type text NOT NULL,
  scheduled_date date NOT NULL,
  scheduled_time text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'))
);

-- Enable RLS on vendor_bookings
ALTER TABLE public.vendor_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for vendor_bookings
CREATE POLICY "Users can view their own bookings"
ON public.vendor_bookings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
ON public.vendor_bookings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
ON public.vendor_bookings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookings"
ON public.vendor_bookings
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_vendor_bookings_user_id ON public.vendor_bookings(user_id);
CREATE INDEX idx_vendor_bookings_vendor_id ON public.vendor_bookings(vendor_id);
CREATE INDEX idx_vendor_bookings_scheduled_date ON public.vendor_bookings(scheduled_date);

-- Update trigger for vendor_bookings
CREATE TRIGGER update_vendor_bookings_updated_at
BEFORE UPDATE ON public.vendor_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update notification_preferences default to include warranty_expiration
ALTER TABLE public.profiles 
ALTER COLUMN notification_preferences 
SET DEFAULT '{"weekly_summary": false, "critical_diagnostics": true, "maintenance_reminders": true, "warranty_expiration": true}'::jsonb;