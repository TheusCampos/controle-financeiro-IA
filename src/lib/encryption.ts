import CryptoJS from 'crypto-js';

// Chave baseada em variáveis de ambiente, com fallback seguro apenas para build (em produção a env é injetada)
const SECRET_KEY = import.meta.env.VITE_STORAGE_ENCRYPTION_KEY || 'default-fallback-secure-key-2026-cf-app';

export const encryptData = (data: string): string => {
  try {
    return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
  } catch (error) {
    console.error('Erro na criptografia de dados', error);
    return '';
  }
};

export const decryptData = (cipherText: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Erro na decriptografia de dados', error);
    return '';
  }
};
