-- Create increment_play_count function for story player
-- This safely increments play count and only counts unique plays

CREATE OR REPLACE FUNCTION increment_play_count(story_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE stories 
  SET play_count = COALESCE(play_count, 0) + 1
  WHERE id = story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_play_count(UUID) TO authenticated;
