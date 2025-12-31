-- Create storage bucket for story audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('story-audio', 'story-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'story-audio');

-- Allow public read access for completed stories
CREATE POLICY "Public can read audio"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'story-audio');

-- Allow users to delete their own audio
CREATE POLICY "Users can delete own audio"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'story-audio');
