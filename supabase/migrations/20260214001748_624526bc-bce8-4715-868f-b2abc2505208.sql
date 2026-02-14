
-- Create the service_vendors table for admin-managed public vendor directory
CREATE TABLE public.service_vendors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_name text NOT NULL,
  description text,
  category text NOT NULL,
  location text,
  contact_phone text,
  contact_email text,
  whatsapp_link text,
  logo_url text,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_vendors ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read vendors
CREATE POLICY "Authenticated users can view service vendors"
ON public.service_vendors
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can insert
CREATE POLICY "Admins can insert service vendors"
ON public.service_vendors
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update
CREATE POLICY "Admins can update service vendors"
ON public.service_vendors
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Admins can delete service vendors"
ON public.service_vendors
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Require authentication base policy
CREATE POLICY "Require authentication for service_vendors"
ON public.service_vendors
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Auto-update timestamp trigger
CREATE TRIGGER update_service_vendors_updated_at
BEFORE UPDATE ON public.service_vendors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for vendor logos
INSERT INTO storage.buckets (id, name, public) VALUES ('vendor-logos', 'vendor-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for vendor logos
CREATE POLICY "Anyone can view vendor logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'vendor-logos');

CREATE POLICY "Admins can upload vendor logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vendor-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update vendor logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'vendor-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete vendor logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'vendor-logos' AND auth.uid() IS NOT NULL);

-- Enable realtime for service_vendors
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_vendors;
