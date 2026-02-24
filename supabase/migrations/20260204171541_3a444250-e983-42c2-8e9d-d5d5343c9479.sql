-- Add CHECK constraints for input validation on portfolio_assets
ALTER TABLE public.portfolio_assets
  ADD CONSTRAINT valid_lat CHECK (lat >= -90 AND lat <= 90),
  ADD CONSTRAINT valid_lon CHECK (lon >= -180 AND lon <= 180),
  ADD CONSTRAINT valid_value CHECK (value >= 0 AND value <= 999999999999),
  ADD CONSTRAINT valid_name_length CHECK (char_length(name) <= 200);

-- Fix the function search path issue on the existing function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;