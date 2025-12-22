-- Create team_members table for barbers that don't need accounts
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  commission_percentage NUMERIC DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  specialties TEXT[],
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view team members in their barbershop"
ON public.team_members FOR SELECT
USING (barbershop_id = get_user_barbershop_id(auth.uid()));

CREATE POLICY "Owners can manage team members"
ON public.team_members FOR ALL
USING (EXISTS (
  SELECT 1 FROM barbershops
  WHERE barbershops.id = team_members.barbershop_id
  AND barbershops.owner_id = auth.uid()
));

-- Public can view active team members (for booking page)
CREATE POLICY "Public can view active team members"
ON public.team_members FOR SELECT
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update appointments to reference team_members instead of profiles
-- First, make barber_id nullable temporarily
ALTER TABLE public.appointments ALTER COLUMN barber_id DROP NOT NULL;

-- Add team_member_id column
ALTER TABLE public.appointments ADD COLUMN team_member_id UUID REFERENCES public.team_members(id);

-- Update gallery_images to also reference team_members
ALTER TABLE public.gallery_images ADD COLUMN team_member_id UUID REFERENCES public.team_members(id);

-- Update working_hours to also reference team_members
ALTER TABLE public.working_hours ADD COLUMN team_member_id UUID REFERENCES public.team_members(id);