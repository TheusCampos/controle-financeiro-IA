import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptData, decryptData } from '../lib/encryption';
import { useAISettingsStore } from '../store/aiSettingsStore';

describe('AES-256 Encryption Utility & Storage', () => {
  const secretKey = 'test-secret-key-123';
  const originalEnv = import.meta.env.VITE_STORAGE_ENCRYPTION_KEY;

  beforeEach(() => {
    // Inject mock environment key for tests
    import.meta.env.VITE_STORAGE_ENCRYPTION_KEY = secretKey;
    localStorage.clear();
  });

  afterEach(() => {
    import.meta.env.VITE_STORAGE_ENCRYPTION_KEY = originalEnv;
  });

  it('deve criptografar corretamente os dados sensíveis (AES-256)', () => {
    const sensitiveData = 'sk-proj-super-secret-api-key';
    const encrypted = encryptData(sensitiveData);

    // O dado encriptado não deve conter a string original em lugar nenhum
    expect(encrypted).not.toContain(sensitiveData);
    expect(encrypted.length).toBeGreaterThan(sensitiveData.length);
  });

  it('deve descriptografar corretamente dados válidos gerados pelo AES', () => {
    const sensitiveData = 'sk-proj-another-secret-123';
    const encrypted = encryptData(sensitiveData);
    const decrypted = decryptData(encrypted);

    expect(decrypted).toBe(sensitiveData);
  });

  it('deve lidar de forma segura com strings adulteradas ou corrompidas sem quebrar o app', () => {
    const fakeCipher = 'U2FsdGVkX19malc2+MaliciousPayloadNotAES==';
    const decrypted = decryptData(fakeCipher);
    
    // Fallback pra string vazia (seguro para o Zustand parsear)
    expect(decrypted).toBe('');
  });

  it('deve garantir que o Zustand armazena o state global no localStorage DE FORMA CRIPTOGRAFADA', () => {
    const store = useAISettingsStore.getState();
    const testApiKey = 'sk-openai-test-key-0001';
    
    // Atualizamos a chave de API na store (dispara o persist)
    store.setApiKey(testApiKey);

    // Lemos o localStorage de forma "crua" (simulando um invasor/XSS acessando localStorage)
    const rawLocalStorageValue = localStorage.getItem('ai-settings-storage');

    expect(rawLocalStorageValue).toBeDefined();
    // O valor cru NUNCA deve conter a chave de API em plain text
    expect(rawLocalStorageValue).not.toContain(testApiKey);

    // Devemos conseguir reverter a criptografia para obter o state JSON íntegro
    const decryptedJsonString = decryptData(rawLocalStorageValue as string);
    const parsedState = JSON.parse(decryptedJsonString);
    
    expect(parsedState.state.apiKey).toBe(testApiKey);
  });
});
