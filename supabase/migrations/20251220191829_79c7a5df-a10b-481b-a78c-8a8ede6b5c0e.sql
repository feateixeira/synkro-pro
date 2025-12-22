-- Add revenue goal column to barbershops table
ALTER TABLE public.barbershops 
ADD COLUMN revenue_goal numeric DEFAULT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN public.barbershops.revenue_goal IS 'Monthly revenue goal for alerts';