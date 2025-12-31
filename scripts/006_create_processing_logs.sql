-- Processing logs table for detailed story generation tracking
CREATE TABLE IF NOT EXISTS processing_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  timestamp timestamptz DEFAULT now() NOT NULL,
  agent_name text NOT NULL, -- 'Analyzer', 'Architect', 'Narrator', 'Synthesizer'
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  level text DEFAULT 'info' -- 'info', 'success', 'warning', 'error'
);

-- Index for fast lookups by story
CREATE INDEX IF NOT EXISTS idx_processing_logs_story_id ON processing_logs(story_id);
CREATE INDEX IF NOT EXISTS idx_processing_logs_timestamp ON processing_logs(story_id, timestamp DESC);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE processing_logs;

-- RLS policies
ALTER TABLE processing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs for their stories" ON processing_logs
  FOR SELECT USING (
    story_id IN (SELECT id FROM stories WHERE user_id = auth.uid())
  );
