import { randomBytes } from 'node:crypto';

/**
 * Utilitário de ofuscação da `VITE_SUPABASE_PUBLISHABLE_KEY`.
 *
 * AVISO: isto é OFUSCAÇÃO, não criptografia. A chave continua embutida no
 * bundle — apenas em pedaços embaralhados, de modo que:
 *   - Não aparece em buscas de string no bundle (DevTools → Sources/Search).
 *   - Não aparece literal na aba Network (o valor é decodificado em runtime).
 *
 * Qualquer pessoa com tempo e paciência consegue reverter o processo (a
 * lógica de decode está, por necessidade, no próprio bundle). Para proteção
 * REAL contra exposição no front, use um proxy reverso (Edge Function /
 * Serverless Function). Veja `docs/SECURITY.md`.
 */

const SEP = '\u241F';

export interface ObfuscatedKey {
  pieces: string[];
  salt: string;
}

export function obfuscateSupabaseKey(plain: string): ObfuscatedKey {
  if (typeof plain !== 'string' || plain.length === 0) {
    throw new Error('obfuscateSupabaseKey: chave vazia ou inválida');
  }

  const salt = randomBytes(12).toString('hex');
  const saltBuf = Buffer.from(salt, 'utf8');
  const plainBuf = Buffer.from(plain, 'utf8');

  const xored = Buffer.alloc(plainBuf.length);
  for (let i = 0; i < plainBuf.length; i += 1) {
    xored[i] = plainBuf[i] ^ saltBuf[i % saltBuf.length];
  }

  const b64 = xored.toString('base64');
  const reversed = b64.split('').reverse().join('');

  const third = Math.ceil(reversed.length / 3);
  const c1 = reversed.slice(0, third);
  const c2 = reversed.slice(third, third * 2);
  const c3 = reversed.slice(third * 2);

  return {
    pieces: [`${SEP}${c1}`, `${SEP}${c2}`, c3],
    salt,
  };
}

export function deobfuscateSupabaseKey(payload: ObfuscatedKey): string {
  if (!payload || !Array.isArray(payload.pieces) || payload.pieces.length !== 3) {
    throw new Error('deobfuscateSupabaseKey: payload inválido');
  }
  const { pieces, salt } = payload;
  const c1 = pieces[0].startsWith(SEP) ? pieces[0].slice(SEP.length) : pieces[0];
  const c2 = pieces[1].startsWith(SEP) ? pieces[1].slice(SEP.length) : pieces[1];
  const c3 = pieces[2];
  const reversed = c1 + c2 + c3;
  const b64 = reversed.split('').reverse().join('');
  const xored = Buffer.from(b64, 'base64');
  const saltBuf = Buffer.from(salt, 'utf8');
  const plain = Buffer.alloc(xored.length);
  for (let i = 0; i < xored.length; i += 1) {
    plain[i] = xored[i] ^ saltBuf[i % saltBuf.length];
  }
  return plain.toString('utf8');
}
