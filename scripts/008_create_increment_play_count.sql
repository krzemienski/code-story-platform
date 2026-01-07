-- Create RPC function to increment play count atomically
-- This function is called from app/story/[id]/page.tsx

CREATE OR REPLACE FUNCTION increment_play_count(story_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE stories 
  SET play_count = COALESCE(play_count, 0) + 1
  WHERE id = story_id;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION increment_play_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_play_count(UUID) TO anon;
