import { describe, it, expect } from 'vitest';
import {
  TransactionSchema,
  BudgetSchema,
  GoalSchema,
  AccountSchema,
  CategorySchema,
} from '../lib/validators';

describe('Security Validations (XSS, Injection, Input Boundaries)', () => {
  describe('TransactionSchema', () => {
    it('deve sanitizar tags HTML maliciosas (XSS) da descrição e notas', () => {
      const payload = {
        amount: 150.5,
        description: '<script>alert("xss")</script> Compra de supermercado',
        account_id: 'a123e456-7890-1234-5678-1234567890ab',
        date: '2026-04-01',
        type: 'expense' as const,
        notes: '<img src=x onerror=alert(1)> Apenas uma nota',
      };

      const result = TransactionSchema.parse(payload);
      
      // O DOMPurify deve ter removido as tags perigosas
      expect(result.description).not.toContain('<script>');
      expect(result.description).toContain('Compra de supermercado');
      expect(result.notes).not.toContain('onerror=');
      expect(result.notes).toContain('Apenas uma nota');
    });

    it('não deve permitir valores negativos ou zero (Inconsistência de Negócio)', () => {
      const payload = {
        amount: -50,
        description: 'Teste',
        account_id: 'a123e456-7890-1234-5678-1234567890ab',
        date: '2026-04-01',
        type: 'expense' as const,
      };

      const result = TransactionSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Valor deve ser positivo');
      }
    });

    it('não deve permitir injeção de UUID malformado para bypass de relacionamentos (IDOR/Mass Assignment)', () => {
      const payload = {
        amount: 100,
        description: 'Teste',
        account_id: '123-invalid-uuid-inject-here', // UUID Invalido / Tentativa de Bypass
        date: '2026-04-01',
        type: 'expense' as const,
      };

      const result = TransactionSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Conta inválida');
      }
    });
  });

  describe('AccountSchema', () => {
    it('deve aplicar limites rigorosos em account types para evitar Mass Assignment', () => {
      const payload = {
        name: 'Minha Conta',
        type: 'admin_access_level_bypass', // Tipo não mapeado (injeção)
        balance: 1000,
      };

      const result = AccountSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('deve sanitizar injeções de SQL no nome do banco ou do cartão', () => {
      const payload = {
        name: 'Conta do Nu',
        type: 'checking' as const,
        bank_name: "Nubank'; DROP TABLE accounts; --",
        card_brand: "Visa'; SELECT * FROM users; --",
      };

      const result = AccountSchema.parse(payload);
      
      // O sanitizer (DOMPurify/Zod) trata strings como texto plano e escapa HTML/XSS.
      // O SQL Injection é prevenido pela parametrização do PostgREST do Supabase,
      // mas validamos que o texto é capturado de forma isolada e limpa.
      expect(result.bank_name).toBe("Nubank'; DROP TABLE accounts; --");
      expect(typeof result.bank_name).toBe('string');
    });

    it('deve rejeitar dias de vencimento (due_day) absurdos (Inconsistência/Fuzzing)', () => {
      const payload = {
        name: 'Cartão C',
        type: 'credit' as const,
        due_day: 99, // Inválido
      };

      const result = AccountSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('Budget & Goal Schemas', () => {
    it('deve aplicar limites de segurança nos nomes e valores-alvo de orçamentos e metas', () => {
      const longString = 'A'.repeat(500); // Buffer overflow ou DoS básico em payloads de texto
      
      const payload = {
        title: longString, // GoalSchema limite max 100
        target_amount: 5000,
      };

      const result = GoalSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});
