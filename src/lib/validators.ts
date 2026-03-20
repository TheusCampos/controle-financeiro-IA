import { z } from 'zod';
import DOMPurify from 'dompurify';

const sanitize = (val: string) => DOMPurify.sanitize(val, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

export const TransactionSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo').max(999_999_999, 'Valor muito alto'),
  description: z.string().min(1, 'Descrição obrigatória').max(255, 'Descrição muito longa').trim()
    .transform(sanitize),
  category_id: z.string().uuid('Categoria inválida').optional().nullable(),
  account_id: z.string().uuid('Conta inválida'),
  date: z.string().min(1, 'Data obrigatória'),
  type: z.enum(['income', 'expense', 'transfer'], { required_error: 'Tipo obrigatório' }),
  notes: z.string().max(1000).optional().nullable().transform(val => val ? sanitize(val) : val),
  is_recurring: z.boolean().optional(),
  recurring_interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
});

export type TransactionInput = z.infer<typeof TransactionSchema>;

export const BudgetSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(100).trim().transform(sanitize),
  category_id: z.string().uuid().optional().nullable(),
  limit_amount: z.number().positive('Limite deve ser positivo'),
  period: z.enum(['weekly', 'monthly', 'yearly']),
  start_date: z.string().min(1),
  end_date: z.string().optional().nullable(),
  alert_threshold: z.number().min(1).max(100).default(80),
});

export const GoalSchema = z.object({
  title: z.string().min(1, 'Título obrigatório').max(100).trim().transform(sanitize),
  description: z.string().max(500).optional().nullable().transform(val => val ? sanitize(val) : val),
  target_amount: z.number().positive('Valor-alvo deve ser positivo'),
  current_amount: z.number().min(0).default(0),
  deadline: z.string().optional().nullable(),
  category: z.string().max(50).optional().nullable().transform(val => val ? sanitize(val) : val),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

export const AccountSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(100).trim().transform(sanitize),
  type: z.enum(['checking', 'savings', 'credit', 'investment', 'cash']),
  balance: z.number().default(0),
  currency: z.string().default('BRL').transform(sanitize),
  bank_name: z.string().max(100).optional().nullable().transform(val => val ? sanitize(val) : val),
  color: z.string().optional().nullable().transform(val => val ? sanitize(val) : val),
});
