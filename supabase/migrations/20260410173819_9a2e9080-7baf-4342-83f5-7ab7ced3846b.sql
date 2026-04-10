
CREATE OR REPLACE FUNCTION public.get_ad_stats()
RETURNS TABLE(ad_id uuid, views bigint, clicks bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    ae.ad_id,
    COUNT(*) FILTER (WHERE ae.event_type = 'view') AS views,
    COUNT(*) FILTER (WHERE ae.event_type = 'click') AS clicks
  FROM public.ad_events ae
  GROUP BY ae.ad_id;
$$;
