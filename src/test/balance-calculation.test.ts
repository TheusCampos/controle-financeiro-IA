import { describe, it, expect } from 'vitest';

// Mock da estrutura de dados
interface Transaction {
  type: 'income' | 'expense';
  amount: number;
}

// Mock da função de cálculo que simula o que o trigger do DB faz
function calculateBalance(initialBalance: number, transactions: Transaction[]): number {
  return transactions.reduce((balance, txn) => {
    if (txn.type === 'income') {
      return balance + txn.amount;
    }
    if (txn.type === 'expense') {
      return balance - txn.amount;
    }
    return balance;
  }, initialBalance);
}

describe('Lógica de Cálculo de Saldo da Conta', () => {
  it('deve somar corretamente uma transação de receita (income)', () => {
    const initialBalance = 1000;
    const transactions: Transaction[] = [{ type: 'income', amount: 500 }];
    const finalBalance = calculateBalance(initialBalance, transactions);
    expect(finalBalance).toBe(1500);
  });

  it('deve subtrair corretamente uma transação de despesa (expense)', () => {
    const initialBalance = 1000;
    const transactions: Transaction[] = [{ type: 'expense', amount: 200 }];
    const finalBalance = calculateBalance(initialBalance, transactions);
    expect(finalBalance).toBe(800);
  });

  it('deve calcular corretamente o saldo após múltiplas transações', () => {
    const initialBalance = 2000;
    const transactions: Transaction[] = [
      { type: 'income', amount: 1000 },  // Saldo: 3000
      { type: 'expense', amount: 500 },   // Saldo: 2500
      { type: 'expense', amount: 300 },   // Saldo: 2200
      { type: 'income', amount: 150 },    // Saldo: 2350
    ];
    const finalBalance = calculateBalance(initialBalance, transactions);
    expect(finalBalance).toBe(2350);
  });

  it('não deve alterar o saldo se não houver transações', () => {
    const initialBalance = 1500;
    const transactions: Transaction[] = [];
    const finalBalance = calculateBalance(initialBalance, transactions);
    expect(finalBalance).toBe(1500);
  });

  it('deve lidar com valores de transação iguais a zero', () => {
    const initialBalance = 500;
    const transactions: Transaction[] = [{ type: 'income', amount: 0 }];
    const finalBalance = calculateBalance(initialBalance, transactions);
    expect(finalBalance).toBe(500);
  });
});
