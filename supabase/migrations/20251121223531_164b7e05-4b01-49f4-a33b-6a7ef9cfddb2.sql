-- Create storage bucket for diagnostic files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'diagnostics',
  'diagnostics',
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'audio/mpeg', 'audio/wav', 'audio/mp4']
);

-- RLS policies for diagnostics bucket
CREATE POLICY "Users can upload their own diagnostic files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'diagnostics' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own diagnostic files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'diagnostics' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own diagnostic files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'diagnostics' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add maintenance_schedule and notes columns to appliances
ALTER TABLE appliances ADD COLUMN IF NOT EXISTS maintenance_schedule jsonb DEFAULT '[]'::jsonb;
ALTER TABLE appliances ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE appliances ADD COLUMN IF NOT EXISTS last_maintenance_date date;
ALTER TABLE appliances ADD COLUMN IF NOT EXISTS next_maintenance_date date;