-- Add revenue goal column to team_members table
ALTER TABLE public.team_members 
ADD COLUMN revenue_goal numeric NULL;

COMMENT ON COLUMN public.team_members.revenue_goal IS 'Monthly revenue goal for individual team member performance tracking';