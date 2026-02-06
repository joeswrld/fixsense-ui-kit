
-- Add RESTRICTIVE policies to all tables to block anonymous/unauthenticated access
-- Service role bypasses RLS entirely, so these won't affect backend operations

-- 1. profiles
CREATE POLICY "Require authentication for profiles"
  ON public.profiles
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. transactions
CREATE POLICY "Require authentication for transactions"
  ON public.transactions
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. diagnostics
CREATE POLICY "Require authentication for diagnostics"
  ON public.diagnostics
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. properties
CREATE POLICY "Require authentication for properties"
  ON public.properties
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 5. appliances
CREATE POLICY "Require authentication for appliances"
  ON public.appliances
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 6. maintenance_history
CREATE POLICY "Require authentication for maintenance_history"
  ON public.maintenance_history
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 7. vendors
CREATE POLICY "Require authentication for vendors"
  ON public.vendors
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 8. warranties
CREATE POLICY "Require authentication for warranties"
  ON public.warranties
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 9. vendor_ratings
CREATE POLICY "Require authentication for vendor_ratings"
  ON public.vendor_ratings
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 10. vendor_bookings
CREATE POLICY "Require authentication for vendor_bookings"
  ON public.vendor_bookings
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 11. predictive_alerts
CREATE POLICY "Require authentication for predictive_alerts"
  ON public.predictive_alerts
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 12. usage_tracking
CREATE POLICY "Require authentication for usage_tracking"
  ON public.usage_tracking
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 13. notification_logs
CREATE POLICY "Require authentication for notification_logs"
  ON public.notification_logs
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 14. subscription_events
CREATE POLICY "Require authentication for subscription_events"
  ON public.subscription_events
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 15. admin_logs
CREATE POLICY "Require authentication for admin_logs"
  ON public.admin_logs
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 16. user_roles
CREATE POLICY "Require authentication for user_roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 17. rate_limiting
CREATE POLICY "Require authentication for rate_limiting"
  ON public.rate_limiting
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 18. usage_reset_log
CREATE POLICY "Require authentication for usage_reset_log"
  ON public.usage_reset_log
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
