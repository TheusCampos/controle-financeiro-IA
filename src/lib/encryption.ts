import CryptoJS from 'crypto-js';

/**
 * Recupera a chave de cifragem local.
 *
 * IMPORTANTE (segurança):
 * - Variáveis `VITE_*` são embutidas no bundle JS no momento do build e,
 *   portanto, NÃO são segredo. Esta chave oferece apenas obfuscation
 *   (defesa em profundidade) e NÃO deve ser tratada como chave criptográfica
 *   forte. Ela existe para impedir leitura casual via `localStorage` em
 *   compartilhamento de tela, devtools básicas, etc.
 * - Para proteção real de segredos persistidos do usuário (chaves de IA),
 *   o caminho correto é uma Edge Function / proxy backend que armazene
 *   o segredo no servidor (ou no Supabase Vault) e devolva respostas já
 *   processadas ao cliente. Veja `services/aiProviders.ts` (TODO).
 * - Mantemos o fallback explícito (`return data`) para evitar perda
 *   silenciosa de dados quando a chave não está configurada em dev.
 */
function getSecretKey(): string | null {
  const key = import.meta.env.VITE_STORAGE_ENCRYPTION_KEY;
  if (!key || key.length < 16) return null;
  return key;
}

export const encryptData = (data: string): string => {
  const secretKey = getSecretKey();
  if (!secretKey) return data;

  try {
    return CryptoJS.AES.encrypt(data, secretKey).toString();
  } catch {
    return '';
  }
};

export const decryptData = (encryptedData: string): string | null => {
  const secretKey = getSecretKey();
  if (!secretKey) return encryptedData;

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || null;
  } catch {
    return null;
  }
};
