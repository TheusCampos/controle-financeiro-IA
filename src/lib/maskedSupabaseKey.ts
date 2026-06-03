/**
 * Decoder runtime da SUPABASE_PUBLISHABLE_KEY ofuscada em build-time.
 *
 * O Vite plugin `maskSupabaseKey` resolve `virtual:masked-supabase-key` para
 * um módulo que exporta `MASKED_SUPABASE_KEY_PAYLOAD` (com { pieces, salt }).
 * Este módulo aplica o caminho inverso (XOR + base64 + reverse + split) e
 * devolve a chave original. A chave NUNCA aparece como string literal no
 * bundle — ela está embaralhada em pedaços + sal de build.
 *
 * AVISO: isto é OFUSCAÇÃO, não segurança. A lógica de decode está visível
 * no bundle para quem quiser reverter. O objetivo aqui é apenas evitar
 * que a chave apareça em buscas de string e na aba Network do navegador.
 * Para proteção real, use um proxy reverso (Edge Function / Serverless
 * Function).
 */

import { MASKED_SUPABASE_KEY_PAYLOAD } from 'virtual:masked-supabase-key';

interface ObfuscatedKeyPayload {
  pieces: string[];
  salt: string;
}

const SEP = '\u241F';

function decodeBase64ToBuffer(b64: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(b64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

function bytesToString(buf: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8').decode(buf);
  }
  return Buffer.from(buf).toString('utf8');
}

export function deobfuscateSupabaseKeyRuntime(payload: ObfuscatedKeyPayload): string {
  if (!payload || !Array.isArray(payload.pieces) || payload.pieces.length !== 3) {
    throw new Error('deobfuscateSupabaseKeyRuntime: payload inválido');
  }
  const { pieces, salt } = payload;
  const c1 = pieces[0].startsWith(SEP) ? pieces[0].slice(SEP.length) : pieces[0];
  const c2 = pieces[1].startsWith(SEP) ? pieces[1].slice(SEP.length) : pieces[1];
  const c3 = pieces[2];
  const reversed = c1 + c2 + c3;
  const b64 = reversed.split('').reverse().join('');
  const xored = decodeBase64ToBuffer(b64);
  const saltBytes = new TextEncoder().encode(salt);
  const plain = new Uint8Array(xored.length);
  for (let i = 0; i < xored.length; i += 1) {
    plain[i] = xored[i] ^ saltBytes[i % saltBytes.length];
  }
  return bytesToString(plain);
}

let cached: string | null = null;

export function getSupabasePublishableKey(): string {
  if (cached) return cached;
  const payload = MASKED_SUPABASE_KEY_PAYLOAD as ObfuscatedKeyPayload | null;
  if (!payload) {
    throw new Error(
      'SUPABASE publishable key ausente do bundle. Configure a variável de ambiente do Supabase no provedor de build (Vercel/Netlify) ou no .env local.',
    );
  }
  cached = deobfuscateSupabaseKeyRuntime(payload);
  return cached;
}

