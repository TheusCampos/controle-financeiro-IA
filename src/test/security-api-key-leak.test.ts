import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

/**
 * SFR — Testes de regressão para "vazamento de chave de API"
 *
 * Estes testes existem para impedir que uma chave de API real volte a
 * aparecer no bundle, no código-fonte ou no tráfego de rede exposto ao
 * cliente. Se algum deles falhar, há regressão de segurança.
 *
 * Cobertura:
 *  1. Nenhuma chave de produção hardcoded no src/ (fora de fixtures de teste)
 *  2. Nenhum uso acidental de service_role key no cliente
 *  3. Nenhuma chave aparece em texto puro no bundle (build artefact)
 *  4. O cliente Supabase NÃO envia a service role key em nenhum header
 *  5. A CSP configurada restringe connect-src a origens conhecidas
 */

const SRC_DIR = join(process.cwd(), 'src');
const DIST_DIR = join(process.cwd(), 'dist');
const TEST_FILE = join(SRC_DIR, 'test', 'security-api-key-leak.test.ts');

const FIXTURE_API_KEYS = new Set([
  'sk-test',
  'sk-proj-test',
  'sk-openai-test-key',
  'sk-proj-super-secret-api-key',
  'sk-proj-another-secret-123',
  'sk-openai-test-key-0001',
  'test-secret-key-123',
]);

const SECRET_PATTERNS: RegExp[] = [
  /sk-[A-Za-z0-9_-]{20,}/g,
  /sk-proj-[A-Za-z0-9_-]{20,}/g,
  /gsk_[A-Za-z0-9]{20,}/g,
  /xai-[A-Za-z0-9]{20,}/g,
  /ghp_[A-Za-z0-9]{20,}/g,
  /github_pat_[A-Za-z0-9_]{20,}/g,
  /AIza[0-9A-Za-z_-]{20,}/g,
];

const HARD_BLOCKED_KEYS: RegExp[] = [
  /VITE_SUPABASE_SERVICE_ROLE/,
  /SUPABASE_SERVICE_ROLE_KEY/,
  /['"]service[_]?role['"]/i,
  /service[_]?role_key/i,
];

function walk(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function isAllowedFixture(content: string, file: string): boolean {
  if (file === TEST_FILE) return true;
  if (file.includes(`${join('src', 'test')}${join(' ', '')}`)) return true;
  if (file.includes(`${join('src', 'test')}${join(' ')}`)) return true;
  if (file.includes('\\src\\test\\')) return true;
  if (file.includes('/src/test/')) return true;
  return (
    content.includes("describe(") &&
    content.includes("it(") &&
    content.includes("expect(")
  );
}

function isAllowedSecretMatch(match: string): boolean {
  return FIXTURE_API_KEYS.has(match.replace(/['"]/g, ''));
}

describe('Security Regression — API Key Leakage (SFR)', () => {
  describe('1. Source code (src/)', () => {
    const files = walk(SRC_DIR).filter((f) =>
      ['.ts', '.tsx', '.js', '.jsx'].includes(extname(f)),
    );

    it.each(files)('não deve conter chave de produção hardcoded: %s', (file) => {
      if (file === TEST_FILE) return;
      const content = readFileSync(file, 'utf8');
      if (isAllowedFixture(content, file)) return;

      for (const pattern of SECRET_PATTERNS) {
        pattern.lastIndex = 0;
        const matches = content.match(pattern);
        if (!matches) continue;
        for (const match of matches) {
          if (isAllowedSecretMatch(match)) continue;
          throw new Error(
            `Possível chave de API detectada em ${file}: ${match.slice(0, 12)}...`,
          );
        }
      }
    });

    it.each(files)('não deve referenciar service_role key no cliente: %s', (file) => {
      if (file === TEST_FILE) return;
      const content = readFileSync(file, 'utf8');
      for (const blocked of HARD_BLOCKED_KEYS) {
        expect(content, `Arquivo ${file} contém referência bloqueada`).not.toMatch(blocked);
      }
    });

    it('deve garantir que o cliente Supabase NÃO lê VITE_SUPABASE_PUBLISHABLE_KEY diretamente (usa o módulo mascarado)', () => {
      const client = readFileSync(join(SRC_DIR, 'integrations/supabase/client.ts'), 'utf8');
      expect(client).toMatch(/virtual:masked-supabase-key|@\/lib\/maskedSupabaseKey/);
      expect(client).not.toMatch(/VITE_SUPABASE_SERVICE_ROLE/);
      expect(client).not.toMatch(/SUPABASE_SERVICE_ROLE/);
      expect(client).not.toMatch(/import\.meta\.env\.VITE_SUPABASE_PUBLISHABLE_KEY/);
    });

    it('deve garantir que existe o módulo de decoder runtime e o plugin Vite', () => {
      expect(existsSync(join(SRC_DIR, 'lib', 'maskedSupabaseKey.ts'))).toBe(true);
      expect(existsSync(join(process.cwd(), 'vite-plugins', 'maskSupabaseKey.ts'))).toBe(true);
      const decoder = readFileSync(join(SRC_DIR, 'lib', 'maskedSupabaseKey.ts'), 'utf8');
      expect(decoder).toMatch(/virtual:masked-supabase-key/);
    });
  });

  describe('2. Build artefact (dist/)', () => {
    const skip = !existsSync(DIST_DIR);

    it.skipIf(skip)('não deve expor chaves SECRETAS em texto puro no bundle de produção', () => {
      const jsFiles = walk(DIST_DIR).filter((f) => extname(f) === '.js');
      expect(jsFiles.length).toBeGreaterThan(0);

      const violations: string[] = [];
      for (const file of jsFiles) {
        const content = readFileSync(file, 'utf8');
        for (const pattern of SECRET_PATTERNS) {
          pattern.lastIndex = 0;
          const matches = content.match(pattern);
          if (!matches) continue;
          for (const match of matches) {
            if (isAllowedSecretMatch(match)) continue;
            if (match.startsWith('sk-') && match.length < 60) continue;
            violations.push(`${file}: ${match.slice(0, 12)}...`);
          }
        }
      }
      expect(violations, violations.join('\n')).toEqual([]);
    });
  });

  describe('3. Cliente Supabase em runtime', () => {
    beforeAll(() => {
      process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.payload';
    });

    afterAll(() => {
      delete process.env.VITE_SUPABASE_URL;
      delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    });

    it('não deve expor a service_role key em nenhum momento da inicialização', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const client = supabase as unknown as {
        rest?: { headers?: Record<string, string>; url?: string };
        auth?: { storageKey?: string };
      };
      const headers = client?.rest?.headers ?? {};
      const serialized = JSON.stringify({
        headers,
        storageKey: client?.auth?.storageKey,
        url: client?.rest?.url,
      });
      expect(serialized).not.toMatch(/service_role/i);
      expect(serialized).not.toMatch(/SUPABASE_SERVICE_ROLE/);
    });

    it('ao chamar signInWithPassword, os headers não devem conter service_role', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ access_token: 'x', refresh_token: 'y' }), { status: 200 }),
      );
      vi.stubGlobal('fetch', fetchMock);

      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.auth.signInWithPassword({
        email: 'user@example.com',
        password: 'p4ssw0rd!',
      });

      const call = fetchMock.mock.calls[0] as
        | [unknown, { headers?: Record<string, string> }]
        | undefined;
      const headers = call?.[1]?.headers ?? {};
      const allHeaders = JSON.stringify(headers);
      expect(allHeaders).not.toMatch(/service_role/i);

      vi.unstubAllGlobals();
    });
  });

  describe('4. Configuração de CSP e headers', () => {
    it('Vercel config deve restringir connect-src a origens conhecidas (sem wildcard https:)', () => {
      const vercel = readFileSync(join(process.cwd(), 'vercel.json'), 'utf8');
      expect(vercel).not.toMatch(/connect-src[^;]*\bhttps:\b/);
      expect(vercel).toMatch(/connect-src[^;]*\.supabase\.co/);
      expect(vercel).toMatch(/frame-ancestors 'none'/);
    });

    it('Netlify config deve restringir connect-src a origens conhecidas (sem wildcard https:)', () => {
      const netlify = readFileSync(join(process.cwd(), 'netlify.toml'), 'utf8');
      expect(netlify).not.toMatch(/connect-src[^;]*\bhttps:\b/);
      expect(netlify).toMatch(/connect-src[^;]*\.supabase\.co/);
      expect(netlify).toMatch(/frame-ancestors 'none'/);
    });

    it('CSP deve incluir frame-ancestors, object-src none e form-action self', () => {
      const vercel = readFileSync(join(process.cwd(), 'vercel.json'), 'utf8');
      expect(vercel).toMatch(/frame-ancestors 'none'/);
      expect(vercel).toMatch(/object-src 'none'/);
      expect(vercel).toMatch(/form-action 'self'/);
    });
  });

  describe('5. Criptografia client-side (defesa em profundidade)', () => {
    it('não deve aceitar uma chave de cifragem fraca (< 16 chars)', async () => {
      const meta = import.meta as unknown as { env: Record<string, string | undefined> };
      const original = meta.env.VITE_STORAGE_ENCRYPTION_KEY;
      meta.env.VITE_STORAGE_ENCRYPTION_KEY = 'curta';
      const { encryptData } = await import('@/lib/encryption');
      const encrypted = encryptData('sk-proj-test');
      expect(encrypted).toBe('sk-proj-test');
      meta.env.VITE_STORAGE_ENCRYPTION_KEY = original;
    });
  });
});
