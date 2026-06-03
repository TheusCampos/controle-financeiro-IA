import type { Plugin, ResolvedConfig } from 'vite';
import { obfuscateSupabaseKey } from '../build-tools/obfuscateSupabaseKey';

interface MaskEnvPluginOptions {
  envVar: string;
  virtualId?: string;
}

const DEFAULT_VIRTUAL_ID = 'virtual:masked-supabase-key';
const RESOLVED_PREFIX = '\0masked-supabase-key:';

export function maskSupabaseKey(options: MaskEnvPluginOptions): Plugin {
  const { envVar, virtualId = DEFAULT_VIRTUAL_ID } = options;

  let payloadJson: string | null = null;

  function readEnv(config: ResolvedConfig): string | undefined {
    return (config.env?.[envVar] ?? process.env[envVar]) as string | undefined;
  }

  return {
    name: 'mask-supabase-key',
    enforce: 'pre',

    configResolved(config) {
      const value = readEnv(config);
      if (!value) {
        if (config.command === 'build') {
          throw new Error(
            `[mask-supabase-key] ${envVar} não definida no ambiente de build. Configure no provedor (Vercel/Netlify).`,
          );
        }
        return;
      }
      payloadJson = JSON.stringify(obfuscateSupabaseKey(value));
    },

    resolveId(id: string) {
      if (id === virtualId) return RESOLVED_PREFIX + 'payload';
      return null;
    },

    load(id: string) {
      if (id !== RESOLVED_PREFIX + 'payload') return null;
      if (payloadJson === null) {
        return 'export const MASKED_SUPABASE_KEY_PAYLOAD = null;';
      }
      return `export const MASKED_SUPABASE_KEY_PAYLOAD = ${payloadJson};`;
    },
  };
}
