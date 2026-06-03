import type { Account, Transaction } from '@/types/finance';

export type TxnType = 'income' | 'expense' | 'transfer';

interface TxnLike {
  type: TxnType | string;
  amount: number;
  account_id: string;
  transfer_to_account_id?: string | null;
}

/**
 * Calcula o saldo efetivo de uma conta com base no saldo base e nas transações.
 * Espelha a lógica do trigger `recalc_account_balance` no Postgres para que o
 * front-end possa fazer preview/pre-flight sem round-trip.
 *
 * Regras:
 *  - Cartão (type=credit): saldo = Σ despesas (representa fatura do ciclo).
 *  - Demais tipos: saldo = base + receitas - despesas + transf_in - transf_out.
 *  - `transfers` não somam em fatura de cartão.
 */
export function calculateEffectiveBalance(
  account: Pick<Account, 'id' | 'type' | 'balance'>,
  transactions: TxnLike[],
): number {
  const base = Number(account.balance || 0);

  if (account.type === 'credit') {
    return transactions
      .filter((t) => t.account_id === account.id && t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }

  let income = 0;
  let expense = 0;
  let xferIn = 0;
  let xferOut = 0;

  for (const t of transactions) {
    const amount = Number(t.amount);
    if (t.account_id === account.id) {
      if (t.type === 'income') income += amount;
      else if (t.type === 'expense') expense += amount;
      else if (t.type === 'transfer' && t.transfer_to_account_id) xferOut += amount;
    }
    if (t.type === 'transfer' && t.transfer_to_account_id === account.id) {
      xferIn += amount;
    }
  }

  return base + income - expense + xferIn - xferOut;
}

/**
 * Calcula o limite disponível e percentual de uso de um cartão.
 */
export function calculateCardUtilization(
  creditLimit: number | null,
  currentInvoice: number,
): { availableLimit: number; utilization: number } {
  const limit = Number(creditLimit || 0);
  const used = Math.max(Number(currentInvoice || 0), 0);
  return {
    availableLimit: Math.max(limit - used, 0),
    utilization: limit > 0 ? (used / limit) * 100 : 0,
  };
}

/** Soma despesas do mês corrente para uma conta (helper de UI). */
export function sumMonthlyExpenses(
  transactions: Transaction[],
  accountId: string,
  reference: Date = new Date(),
): number {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];

  return transactions
    .filter(
      (t) =>
        t.account_id === accountId &&
        t.type === 'expense' &&
        t.date >= start &&
        t.date <= end,
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);
}
