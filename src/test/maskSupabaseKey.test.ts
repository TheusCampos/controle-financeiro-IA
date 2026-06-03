import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { execSync } from 'node:child_process';

/**
 * Testes do plugin `maskSupabaseKey`:
 *  - round-trip build-time (Node) === runtime (browser-style)
 *  - chave original NÃO aparece como string literal no bundle de produção
 *  - cada build gera um salt novo (não-determinismo)
 *  - casos de borda: string vazia, caracteres Unicode, chave muito longa
 */

const PROJECT = process.cwd();
const SRC = join(PROJECT, 'src');
const BUILD_TOOLS = join(PROJECT, 'build-tools');

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwfQ.test-signature';

const FIXTURE_KEYS = new Set([
  'sk-test',
  'sk-proj-test',
  'sk-openai-test-key',
  'sk-proj-super-secret-api-key',
  'sk-proj-another-secret-123',
  'sk-openai-test-key-0001',
  'test-secret-key-123',
]);

function walk(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

describe('maskSupabaseKey — ofuscação da publishable key', () => {
  describe('Build-time (Node)', () => {
    it('round-trip: obfuscate + deobfuscate === original', async () => {
      const { obfuscateSupabaseKey, deobfuscateSupabaseKey } = await import(
        join(BUILD_TOOLS, 'obfuscateSupabaseKey')
      );
      const payload = obfuscateSupabaseKey(SUPABASE_KEY);
      expect(deobfuscateSupabaseKey(payload)).toBe(SUPABASE_KEY);
    });

    it('cada chamada gera um salt diferente (não-determinismo)', async () => {
      const { obfuscateSupabaseKey } = await import(join(BUILD_TOOLS, 'obfuscateSupabaseKey'));
      const a = obfuscateSupabaseKey(SUPABASE_KEY);
      const b = obfuscateSupabaseKey(SUPABASE_KEY);
      expect(a.salt).not.toBe(b.salt);
      expect(a.pieces.join('|')).not.toBe(b.pieces.join('|'));
    });

    it('a chave original NÃO aparece em nenhum dos pedaços ofuscados', async () => {
      const { obfuscateSupabaseKey } = await import(join(BUILD_TOOLS, 'obfuscateSupabaseKey'));
      const payload = obfuscateSupabaseKey(SUPABASE_KEY);
      for (const piece of payload.pieces) {
        expect(piece).not.toContain(SUPABASE_KEY);
        expect(piece).not.toContain(SUPABASE_KEY.slice(0, 30));
      }
    });

    it('lida com caracteres Unicode (emoji, acentos)', async () => {
      const { obfuscateSupabaseKey, deobfuscateSupabaseKey } = await import(
        join(BUILD_TOOLS, 'obfuscateSupabaseKey')
      );
      const weird = 'chave-com-emoji-🚀-acentos-áéíóú';
      const payload = obfuscateSupabaseKey(weird);
      expect(deobfuscateSupabaseKey(payload)).toBe(weird);
    });

    it('lida com chave muito longa (>= 4096 chars)', async () => {
      const { obfuscateSupabaseKey, deobfuscateSupabaseKey } = await import(
        join(BUILD_TOOLS, 'obfuscateSupabaseKey')
      );
      const long = 'A'.repeat(4096);
      const payload = obfuscateSupabaseKey(long);
      expect(deobfuscateSupabaseKey(payload)).toBe(long);
    });

    it('rejeita entrada vazia', async () => {
      const { obfuscateSupabaseKey } = await import(join(BUILD_TOOLS, 'obfuscateSupabaseKey'));
      expect(() => obfuscateSupabaseKey('')).toThrow();
    });
  });

  describe('Runtime (browser-style, polyfill mínimo)', () => {
    let originalAtob: typeof atob | undefined;
    let originalTextDecoder: typeof TextDecoder | undefined;
    let originalTextEncoder: typeof TextEncoder | undefined;

    beforeAll(() => {
      originalAtob = (globalThis as { atob?: typeof atob }).atob;
      originalTextDecoder = (globalThis as { TextDecoder?: typeof TextDecoder }).TextDecoder;
      originalTextEncoder = (globalThis as { TextEncoder?: typeof TextEncoder }).TextEncoder;
      (globalThis as { atob?: typeof atob }).atob = (s: string) => Buffer.from(s, 'base64').toString('binary');
      (globalThis as { TextDecoder?: typeof TextDecoder }).TextDecoder = class {
        decode(buf: Uint8Array) { return Buffer.from(buf).toString('utf-8'); }
      } as unknown as typeof TextDecoder;
      (globalThis as { TextEncoder?: typeof TextEncoder }).TextEncoder = class {
        encode(s: string) { return new Uint8Array(Buffer.from(s, 'utf-8')); }
      } as unknown as typeof TextEncoder;
    });

    afterAll(() => {
      (globalThis as { atob?: typeof atob }).atob = originalAtob;
      (globalThis as { TextDecoder?: typeof TextDecoder }).TextDecoder = originalTextDecoder;
      (globalThis as { TextEncoder?: typeof TextEncoder }).TextEncoder = originalTextEncoder;
    });

    it('deobfuscateSupabaseKeyRuntime faz round-trip a partir do payload build-time', async () => {
      const { obfuscateSupabaseKey } = await import(join(BUILD_TOOLS, 'obfuscateSupabaseKey'));
      const { deobfuscateSupabaseKeyRuntime } = await import('@/lib/maskedSupabaseKey');
      const payload = obfuscateSupabaseKey(SUPABASE_KEY);
      expect(deobfuscateSupabaseKeyRuntime(payload)).toBe(SUPABASE_KEY);
    });

    it('getSupabasePublishableKey() lê do payload mascarado (virtual module)', async () => {
      const masked = await import('@/lib/maskedSupabaseKey');
      const key = masked.getSupabasePublishableKey();
      expect(key).toBeTypeOf('string');
      expect(key.length).toBeGreaterThan(0);
    });

    it('getSupabasePublishableKey() faz cache da chave decodificada', async () => {
      const masked = await import('@/lib/maskedSupabaseKey');
      const a = masked.getSupabasePublishableKey();
      const b = masked.getSupabasePublishableKey();
      expect(a).toBe(b);
    });
  });

  describe('Bundle de produção (dist/)', () => {
    const distExists = existsSync(join(PROJECT, 'dist'));
    const itIfBuilt = distExists ? it : it.skip;

    itIfBuilt('a publishable key ORIGINAL não aparece como string literal em nenhum .js do bundle', () => {
      const files = walk(join(PROJECT, 'dist')).filter((f) => extname(f) === '.js');
      expect(files.length).toBeGreaterThan(0);

      const violations: string[] = [];
      for (const file of files) {
        const content = readFileSync(file, 'utf8');
        if (content.includes(SUPABASE_KEY)) {
          violations.push(file);
        }
      }
      expect(violations, `Chave original encontrada literal no bundle: ${violations.join(', ')}`).toEqual([]);
    });

    itIfBuilt('não há nenhum trecho "VITE_SUPABASE_PUBLISHABLE_KEY" no bundle (a chave vem via constante mascarada)', () => {
      const files = walk(join(PROJECT, 'dist')).filter((f) => extname(f) === '.js');
      const violations: string[] = [];
      for (const file of files) {
        const content = readFileSync(file, 'utf8');
        if (content.includes('VITE_SUPABASE_PUBLISHABLE_KEY')) {
          violations.push(file);
        }
      }
      expect(violations, violations.join(', ')).toEqual([]);
    });
  });

  describe('Regressão contra o resto do projeto', () => {
    it('continua válido: nenhuma chave OpenAI/Anthropic/Gemini hardcoded em src/', () => {
      const files = walk(SRC).filter((f) => ['.ts', '.tsx'].includes(extname(f)));
      const secretPatterns = [/sk-[A-Za-z0-9_-]{20,}/g, /AIza[0-9A-Za-z_-]{20,}/g];
      for (const file of files) {
        if (file.includes('test')) continue;
        const content = readFileSync(file, 'utf8');
        for (const p of secretPatterns) {
          p.lastIndex = 0;
          const m = content.match(p);
          if (!m) continue;
          for (const match of m) {
            if (FIXTURE_KEYS.has(match)) continue;
            throw new Error(`Chave suspeita em ${file}: ${match.slice(0, 12)}...`);
          }
        }
      }
    });
  });
});
