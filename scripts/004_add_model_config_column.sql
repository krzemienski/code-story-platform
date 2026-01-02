-- Add model_config column to stories table for storing AI model preferences
-- Run this migration to enable multi-model support

ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS model_config JSONB DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN stories.model_config IS 'Stores AI model configuration including modelId, temperature, and priority preference';

-- Create index for querying by model
CREATE INDEX IF NOT EXISTS idx_stories_model_config_model_id 
ON stories ((model_config->>'modelId'));
