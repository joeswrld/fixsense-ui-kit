-- Add vendor_id to maintenance_history table for tracking which vendor performed the service
ALTER TABLE public.maintenance_history 
ADD COLUMN vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL;

-- Create index for faster vendor service history queries
CREATE INDEX idx_maintenance_history_vendor_id ON public.maintenance_history(vendor_id);

-- Add function to get vendor service statistics
CREATE OR REPLACE FUNCTION public.get_vendor_stats(p_vendor_id uuid)
RETURNS TABLE(
  total_services bigint,
  total_cost numeric,
  avg_rating numeric,
  rating_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT mh.id) as total_services,
    COALESCE(SUM(mh.cost), 0) as total_cost,
    COALESCE(AVG(vr.rating), 0) as avg_rating,
    COUNT(DISTINCT vr.id) as rating_count
  FROM public.vendors v
  LEFT JOIN public.maintenance_history mh ON mh.vendor_id = v.id
  LEFT JOIN public.vendor_ratings vr ON vr.vendor_id = v.id
  WHERE v.id = p_vendor_id
  GROUP BY v.id;
END;
$$;