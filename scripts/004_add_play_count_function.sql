-- Function to increment play count
CREATE OR REPLACE FUNCTION increment_play_count(story_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.stories
  SET play_count = play_count + 1
  WHERE id = story_id;
END;
$$;
