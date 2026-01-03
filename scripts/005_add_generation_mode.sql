-- Add generation mode and configuration to stories table

-- Add generation mode column
ALTER TABLE stories ADD COLUMN IF NOT EXISTS generation_mode TEXT DEFAULT 'hybrid';

-- Add ElevenLabs project ID for Studio mode
ALTER TABLE stories ADD COLUMN IF NOT EXISTS elevenlabs_project_id TEXT;

-- Add detailed generation config JSONB
ALTER TABLE stories ADD COLUMN IF NOT EXISTS generation_config JSONB;

-- Add constraint for valid generation modes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_generation_mode'
  ) THEN
    ALTER TABLE stories ADD CONSTRAINT valid_generation_mode 
      CHECK (generation_mode IN ('hybrid', 'elevenlabs_studio'));
  END IF;
END $$;

-- Create index for filtering by generation mode
CREATE INDEX IF NOT EXISTS idx_stories_generation_mode ON stories(generation_mode);

-- Comment on columns
COMMENT ON COLUMN stories.generation_mode IS 'hybrid = Claude script + ElevenLabs TTS, elevenlabs_studio = Full ElevenLabs pipeline';
COMMENT ON COLUMN stories.elevenlabs_project_id IS 'ElevenLabs Studio project ID when using studio mode';
COMMENT ON COLUMN stories.generation_config IS 'Full configuration object for the generation including voice settings, mode-specific options';
