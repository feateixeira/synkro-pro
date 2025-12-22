-- Create storage bucket for team member avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-avatars', 'team-avatars', true);

-- Allow public to view team avatars
CREATE POLICY "Public can view team avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-avatars');

-- Allow authenticated users to upload team avatars for their barbershop
CREATE POLICY "Owners can upload team avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'team-avatars' 
  AND auth.uid() IS NOT NULL
);

-- Allow owners to update team avatars
CREATE POLICY "Owners can update team avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'team-avatars' 
  AND auth.uid() IS NOT NULL
);

-- Allow owners to delete team avatars
CREATE POLICY "Owners can delete team avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'team-avatars' 
  AND auth.uid() IS NOT NULL
);