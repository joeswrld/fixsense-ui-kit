-- Create maintenance history table
CREATE TABLE public.maintenance_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appliance_id UUID NOT NULL REFERENCES public.appliances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  maintenance_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  maintenance_type TEXT NOT NULL,
  cost NUMERIC(10, 2),
  notes TEXT,
  before_photo_url TEXT,
  after_photo_url TEXT,
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maintenance_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for maintenance_history
CREATE POLICY "Users can view maintenance history for their appliances"
  ON public.maintenance_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appliances a
      JOIN public.properties p ON p.id = a.property_id
      WHERE a.id = maintenance_history.appliance_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create maintenance history for their appliances"
  ON public.maintenance_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.appliances a
      JOIN public.properties p ON p.id = a.property_id
      WHERE a.id = maintenance_history.appliance_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update maintenance history for their appliances"
  ON public.maintenance_history FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.appliances a
      JOIN public.properties p ON p.id = a.property_id
      WHERE a.id = maintenance_history.appliance_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete maintenance history for their appliances"
  ON public.maintenance_history FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.appliances a
      JOIN public.properties p ON p.id = a.property_id
      WHERE a.id = maintenance_history.appliance_id
      AND p.user_id = auth.uid()
    )
  );

-- Create index for performance
CREATE INDEX idx_maintenance_history_appliance_id ON public.maintenance_history(appliance_id);
CREATE INDEX idx_maintenance_history_user_id ON public.maintenance_history(user_id);
CREATE INDEX idx_maintenance_history_date ON public.maintenance_history(maintenance_date DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_maintenance_history_updated_at
  BEFORE UPDATE ON public.maintenance_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add subscription fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT,
  ADD COLUMN IF NOT EXISTS paystack_subscription_code TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;

-- Create storage bucket for maintenance photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('maintenance-photos', 'maintenance-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for maintenance photos
CREATE POLICY "Users can upload maintenance photos for their appliances"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'maintenance-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their maintenance photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'maintenance-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their maintenance photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'maintenance-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their maintenance photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'maintenance-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );