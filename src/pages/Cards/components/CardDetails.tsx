import { Trash2 } from 'lucide-react';
import { formatCardLastDigits, formatCurrency, formatDate, getCardBrandLabel } from '@/lib/format';
import type { CardSummary } from '@/hooks/useCardsData';
import type { Transaction } from '@/types/finance';

interface CardDetailsProps {
  selectedCard: CardSummary | undefined;
  selectedTransactions: Transaction[];
  onDelete: (id: string) => void;
  onNewTransaction: () => void;
}

export default function CardDetails({ selectedCard, selectedTransactions, onDelete, onNewTransaction }: CardDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Cartão selecionado</p>
            <h3 className="mt-2 text-2xl font-serif text-foreground">{selectedCard?.name || 'Nenhum cartão selecionado'}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedCard ? `${getCardBrandLabel(selectedCard.card_brand)} · ${formatCardLastDigits(selectedCard.last_four_digits)}` : 'Cadastre um cartão para começar'}
            </p>
          </div>
          {selectedCard && (
            <button
              onClick={() => onDelete(selectedCard.id)}
              className="rounded-xl border border-destructive/30 bg-destructive/10 p-2 text-destructive transition hover:bg-destructive/15"
              title="Excluir cartão"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Disponível</p>
            <p className="mt-2 text-2xl font-serif text-foreground">
              {selectedCard ? formatCurrency(selectedCard.availableLimit) : formatCurrency(0)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Limite usado</p>
            <p className="mt-2 text-2xl font-serif text-foreground">
              {selectedCard ? `${selectedCard.utilization.toFixed(0)}%` : '0%'}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Lançamentos recentes</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedCard ? 'Despesas vinculadas ao cartão selecionado.' : 'Selecione um cartão para filtrar.'}
            </p>
          </div>
          <button
            onClick={onNewTransaction}
            disabled={!selectedCard}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            Novo gasto
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {selectedTransactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
              Nenhum lançamento encontrado para este cartão.
            </div>
          ) : (
            selectedTransactions.slice(0, 6).map((transaction) => (
              <div key={transaction.id} className="rounded-2xl border border-border/50 bg-secondary/15 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{transaction.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {transaction.category?.name || 'Sem categoria'} · {formatDate(transaction.date)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(Number(transaction.amount))}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
