-- Add cover_image_url column to barbershops table
ALTER TABLE public.barbershops 
ADD COLUMN IF NOT EXISTS cover_image_url text;

-- Add description column to barbershops table
ALTER TABLE public.barbershops 
ADD COLUMN IF NOT EXISTS description text;

-- Add social media columns
ALTER TABLE public.barbershops 
ADD COLUMN IF NOT EXISTS instagram text;

ALTER TABLE public.barbershops 
ADD COLUMN IF NOT EXISTS whatsapp text;