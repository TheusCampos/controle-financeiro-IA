import CryptoJS from 'crypto-js';

function getSecretKey(): string | null {
  return import.meta.env.VITE_STORAGE_ENCRYPTION_KEY || null;
}

export const encryptData = (data: string): string => {
  const secretKey = getSecretKey();
  if (!secretKey) return data; // Fallback se não houver chave (já lidado em auditoria anterior)

  try {
    return CryptoJS.AES.encrypt(data, secretKey).toString();
  } catch (error) {
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
  } catch (error) {
    return null;
  }
};
