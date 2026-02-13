
-- Add photo_url column to appliances table
ALTER TABLE public.appliances ADD COLUMN IF NOT EXISTS photo_url text;

-- Create storage bucket for appliance photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('appliance-photos', 'appliance-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for appliance photos
CREATE POLICY "Users can upload appliance photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'appliance-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view appliance photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'appliance-photos');

CREATE POLICY "Users can update their appliance photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'appliance-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their appliance photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'appliance-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
