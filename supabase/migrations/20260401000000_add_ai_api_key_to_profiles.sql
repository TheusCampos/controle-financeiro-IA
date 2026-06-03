-- Migration para adicionar a chave de API da IA à tabela profiles
-- Essa chave será armazenada no banco já criptografada (AES-256) pelo cliente usando a VITE_STORAGE_ENCRYPTION_KEY

ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "ai_api_key" text,
ADD COLUMN IF NOT EXISTS "ai_system_prompt" text;

-- Como é um campo sensível, vamos garantir que o RLS já o protege
-- (presumindo que profiles já possui RLS onde auth.uid() = id)

COMMENT ON COLUMN "public"."profiles"."ai_api_key" IS 'Chave de API do provedor de IA, armazenada com criptografia AES-256 (cliente)';
COMMENT ON COLUMN "public"."profiles"."ai_system_prompt" IS 'Prompt de sistema customizado pelo usuário';
