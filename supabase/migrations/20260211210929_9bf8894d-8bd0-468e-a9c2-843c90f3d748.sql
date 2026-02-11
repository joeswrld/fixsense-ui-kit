
-- Create feature_flags table for persisting admin feature controls
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  description text,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Require auth
CREATE POLICY "Require authentication for feature_flags"
  ON public.feature_flags FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can read feature flags
CREATE POLICY "Authenticated users can read feature flags"
  ON public.feature_flags FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can insert/update/delete feature flags
CREATE POLICY "Admins can insert feature flags"
  ON public.feature_flags FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update feature flags"
  ON public.feature_flags FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete feature flags"
  ON public.feature_flags FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default feature flags
INSERT INTO public.feature_flags (flag_key, enabled, description) VALUES
  ('video_diagnostics', true, 'Allow users to upload video for diagnostics'),
  ('audio_diagnostics', true, 'Allow users to upload audio for diagnostics'),
  ('predictive_maintenance', true, 'Enable AI-powered failure predictions'),
  ('diagnostics_globally_enabled', true, 'Global kill switch for all diagnostics');

-- Add trigger for updated_at
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign keys to admin_logs for proper joins (if not exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_logs_admin_id_fkey') THEN
    ALTER TABLE public.admin_logs ADD CONSTRAINT admin_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_logs_target_user_id_fkey') THEN
    ALTER TABLE public.admin_logs ADD CONSTRAINT admin_logs_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.profiles(id);
  END IF;
END $$;
