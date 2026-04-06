import CryptoJS from 'crypto-js';

function getSecretKey(): string | null {
  return import.meta.env.VITE_STORAGE_ENCRYPTION_KEY || null;
}

export const encryptData = (data: string): string => {
  try {
    const secretKey = getSecretKey();
    if (!secretKey) return '';
    return CryptoJS.AES.encrypt(data, secretKey).toString();
  } catch (error) {
    console.error('Erro na criptografia de dados', error);
    return '';
  }
};

export const decryptData = (cipherText: string): string => {
  try {
    const secretKey = getSecretKey();
    if (!secretKey) return '';
    const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Erro na decriptografia de dados', error);
    return '';
  }
};
