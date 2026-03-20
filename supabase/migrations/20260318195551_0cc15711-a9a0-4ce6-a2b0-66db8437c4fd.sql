ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_provider text NOT NULL DEFAULT 'anthropic',
ADD COLUMN IF NOT EXISTS ai_model text NOT NULL DEFAULT 'claude-sonnet-4-20250514';