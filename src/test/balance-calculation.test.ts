import { describe, it, expect } from 'vitest';
import {
  calculateEffectiveBalance,
  calculateCardUtilization,
  sumMonthlyExpenses,
} from '@/lib/balance';
import type { Account, Transaction } from '@/types/finance';

const baseAccount: Pick<Account, 'id' | 'type' | 'balance'> = {
  id: 'acc-1',
  type: 'checking',
  balance: 1000,
};

describe('calculateEffectiveBalance — contas correntes/poupança/investimento', () => {
  it('some receita e subtrai despesa', () => {
    const result = calculateEffectiveBalance(baseAccount, [
      { type: 'income', amount: 500, account_id: 'acc-1' },
      { type: 'expense', amount: 200, account_id: 'acc-1' },
    ]);
    expect(result).toBe(1300);
  });

  it('subtrai transferência de saída (xferOut) do saldo', () => {
    const result = calculateEffectiveBalance(baseAccount, [
      { type: 'transfer', amount: 300, account_id: 'acc-1', transfer_to_account_id: 'acc-2' },
    ]);
    expect(result).toBe(700);
  });

  it('registra transferência recebida (entra no saldo)', () => {
    const result = calculateEffectiveBalance(baseAccount, [
      { type: 'transfer', amount: 300, account_id: 'acc-2', transfer_to_account_id: 'acc-1' },
    ]);
    expect(result).toBe(1300);
  });

  it('registra transferência enviada (sai do saldo)', () => {
    const result = calculateEffectiveBalance(baseAccount, [
      { type: 'transfer', amount: 300, account_id: 'acc-1', transfer_to_account_id: 'acc-2' },
    ]);
    expect(result).toBe(700);
  });
});

describe('calculateEffectiveBalance — cartão de crédito', () => {
  const card: Pick<Account, 'id' | 'type' | 'balance'> = {
    id: 'card-1',
    type: 'credit',
    balance: 0,
  };

  it('soma apenas despesas (fatura)', () => {
    const result = calculateEffectiveBalance(card, [
      { type: 'expense', amount: 100, account_id: 'card-1' },
      { type: 'expense', amount: 50, account_id: 'card-1' },
    ]);
    expect(result).toBe(150);
  });

  it('ignora receitas e transferências (não fazem parte da fatura)', () => {
    const result = calculateEffectiveBalance(card, [
      { type: 'income', amount: 999, account_id: 'card-1' },
      { type: 'transfer', amount: 500, account_id: 'card-1', transfer_to_account_id: 'acc-2' },
    ]);
    expect(result).toBe(0);
  });
});

describe('calculateCardUtilization', () => {
  it('calcula utilização e limite disponível', () => {
    const result = calculateCardUtilization(2000, 500);
    expect(result.availableLimit).toBe(1500);
    expect(result.utilization).toBe(25);
  });

  it('lida com limite zero', () => {
    const result = calculateCardUtilization(0, 100);
    expect(result.utilization).toBe(0);
    expect(result.availableLimit).toBe(0);
  });

  it('não retorna limite negativo', () => {
    const result = calculateCardUtilization(100, 200);
    expect(result.availableLimit).toBe(0);
    expect(result.utilization).toBe(200);
  });
});

describe('sumMonthlyExpenses', () => {
  const transactions: Transaction[] = [
    { id: '1', user_id: 'u', account_id: 'acc-1', category_id: null, type: 'expense', amount: 100, description: 'x', notes: null, date: '2026-05-15', is_recurring: false, recurring_interval: null, tags: null, attachment_url: null, created_at: '' },
    { id: '2', user_id: 'u', account_id: 'acc-1', category_id: null, type: 'expense', amount: 50,  description: 'y', notes: null, date: '2026-06-01', is_recurring: false, recurring_interval: null, tags: null, attachment_url: null, created_at: '' },
    { id: '3', user_id: 'u', account_id: 'acc-2', category_id: null, type: 'expense', amount: 999, description: 'z', notes: null, date: '2026-06-10', is_recurring: false, recurring_interval: null, tags: null, attachment_url: null, created_at: '' },
    { id: '4', user_id: 'u', account_id: 'acc-1', category_id: null, type: 'income',  amount: 200, description: 'w', notes: null, date: '2026-06-15', is_recurring: false, recurring_interval: null, tags: null, attachment_url: null, created_at: '' },
  ];

  it('filtra por conta, tipo e mês', () => {
    const total = sumMonthlyExpenses(transactions, 'acc-1', new Date(2026, 5, 15));
    expect(total).toBe(50);
  });

  it('ignora outros tipos (income não soma)', () => {
    const total = sumMonthlyExpenses(transactions, 'acc-1', new Date(2026, 5, 15));
    // Não deve somar a receita de 200, apenas a despesa de 50
    expect(total).toBe(50);
  });

  it('retorna 0 quando não há despesas no mês', () => {
    const total = sumMonthlyExpenses(transactions, 'acc-1', new Date(2026, 7, 1));
    expect(total).toBe(0);
  });
});
