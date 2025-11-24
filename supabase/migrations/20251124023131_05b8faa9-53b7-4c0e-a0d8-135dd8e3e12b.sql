-- Create warranties table
CREATE TABLE public.warranties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appliance_id UUID NOT NULL REFERENCES public.appliances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  purchase_date DATE,
  expiration_date DATE,
  warranty_type TEXT NOT NULL,
  provider TEXT,
  coverage_details TEXT,
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;

-- Create policies for warranties
CREATE POLICY "Users can view warranties for their appliances"
ON public.warranties
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM appliances a
    JOIN properties p ON p.id = a.property_id
    WHERE a.id = warranties.appliance_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create warranties for their appliances"
ON public.warranties
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM appliances a
    JOIN properties p ON p.id = a.property_id
    WHERE a.id = warranties.appliance_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update warranties for their appliances"
ON public.warranties
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM appliances a
    JOIN properties p ON p.id = a.property_id
    WHERE a.id = warranties.appliance_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete warranties for their appliances"
ON public.warranties
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM appliances a
    JOIN properties p ON p.id = a.property_id
    WHERE a.id = warranties.appliance_id AND p.user_id = auth.uid()
  )
);

-- Create vendors table
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  website TEXT,
  specialties TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Create policies for vendors
CREATE POLICY "Users can view their own vendors"
ON public.vendors
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vendors"
ON public.vendors
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vendors"
ON public.vendors
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vendors"
ON public.vendors
FOR DELETE
USING (auth.uid() = user_id);

-- Create vendor_ratings table
CREATE TABLE public.vendor_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  appliance_id UUID REFERENCES public.appliances(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  service_date DATE,
  cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor_ratings
CREATE POLICY "Users can view ratings for their vendors"
ON public.vendor_ratings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = vendor_ratings.vendor_id AND v.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create ratings for their vendors"
ON public.vendor_ratings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = vendor_ratings.vendor_id AND v.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own ratings"
ON public.vendor_ratings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
ON public.vendor_ratings
FOR DELETE
USING (auth.uid() = user_id);

-- Create predictive_alerts table
CREATE TABLE public.predictive_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appliance_id UUID NOT NULL REFERENCES public.appliances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  prediction_type TEXT NOT NULL,
  confidence_score NUMERIC NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  predicted_failure_date DATE,
  recommendation TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.predictive_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for predictive_alerts
CREATE POLICY "Users can view alerts for their appliances"
ON public.predictive_alerts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM appliances a
    JOIN properties p ON p.id = a.property_id
    WHERE a.id = predictive_alerts.appliance_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Service role can insert alerts"
ON public.predictive_alerts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own alerts"
ON public.predictive_alerts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM appliances a
    JOIN properties p ON p.id = a.property_id
    WHERE a.id = predictive_alerts.appliance_id AND p.user_id = auth.uid()
  )
);

-- Create storage bucket for warranty documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('warranty-documents', 'warranty-documents', false);

-- Create storage policies for warranty documents
CREATE POLICY "Users can view their own warranty documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'warranty-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own warranty documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'warranty-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own warranty documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'warranty-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own warranty documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'warranty-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create trigger for updated_at
CREATE TRIGGER update_warranties_updated_at
BEFORE UPDATE ON public.warranties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
BEFORE UPDATE ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_ratings_updated_at
BEFORE UPDATE ON public.vendor_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_predictive_alerts_updated_at
BEFORE UPDATE ON public.predictive_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();