-- Add INSERT policy for processing_logs
-- The server needs to be able to write logs for any story during generation
-- We use service role for server-side operations, but also allow authenticated users
-- to insert logs for their own stories

-- Policy for server-side inserts (service role bypasses RLS, but this helps with regular auth)
CREATE POLICY "Users can insert logs for their stories" ON processing_logs
  FOR INSERT WITH CHECK (
    story_id IN (SELECT id FROM stories WHERE user_id = auth.uid())
  );

-- Also add UPDATE and DELETE policies for completeness
CREATE POLICY "Users can update logs for their stories" ON processing_logs
  FOR UPDATE USING (
    story_id IN (SELECT id FROM stories WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete logs for their stories" ON processing_logs
  FOR DELETE USING (
    story_id IN (SELECT id FROM stories WHERE user_id = auth.uid())
  );
