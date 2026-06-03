/// <reference types="vite/client" />

interface MaskedSupabaseKeyPayload {
  pieces: string[];
  salt: string;
}

declare module 'virtual:masked-supabase-key' {
  export const MASKED_SUPABASE_KEY_PAYLOAD: MaskedSupabaseKeyPayload | null;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_STORAGE_ENCRYPTION_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
