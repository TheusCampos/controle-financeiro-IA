import { useState } from 'react';
import { CreditCard, Landmark, Plus, ReceiptText, Wallet2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useCardsData } from '@/hooks/useCardsData';
import TransactionModal from '@/components/transactions/TransactionModal';
import CardForm from './components/CardForm';
import CardItem from './components/CardItem';
import CardDetails from './components/CardDetails';

export default function CardsPage() {
  const {
    loading,
    cards,
    categories,
    cardSummaries,
    selectedCard,
    selectedCardId,
    setSelectedCardId,
    selectedTransactions,
    totalLimit,
    totalUsed,
    totalAvailable,
    createCard,
    deleteCard,
    loadData,
  } = useCardsData();

  const [showForm, setShowForm] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="kpi-card h-28 skeleton-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
          <div className="glass-card h-[420px] skeleton-pulse" />
          <div className="glass-card h-[420px] skeleton-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-warning">
            <CreditCard className="w-3.5 h-3.5" />
            Carteira de cartões
          </div>
          <h2 className="mt-4 text-3xl font-serif font-medium tracking-tight text-foreground">Meus Cartões</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure cartões, acompanhe limite disponível e faça lançamentos ligados à fatura.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowTransactionModal(true)}
            disabled={!cards.length}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary/70 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ReceiptText className="w-4 h-4" />
            Lançar gasto
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3 sm:px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{showForm ? 'Fechar cadastro' : 'Cadastrar cartão'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="kpi-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Limite total</span>
            <Wallet2 className="w-5 h-5 text-primary" />
          </div>
          <p className="mt-4 text-3xl font-serif text-foreground">{formatCurrency(totalLimit)}</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Usado no mês</span>
            <ReceiptText className="w-5 h-5 text-warning" />
          </div>
          <p className="mt-4 text-3xl font-serif text-foreground">{formatCurrency(totalUsed)}</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Disponível</span>
            <Landmark className="w-5 h-5 text-success" />
          </div>
          <p className="mt-4 text-3xl font-serif text-foreground">{formatCurrency(totalAvailable)}</p>
        </div>
      </div>

      {/* Card Form */}
      {showForm && (
        <CardForm
          onSubmit={createCard}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Card List + Details */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="space-y-4">
          {cardSummaries.length === 0 ? (
            <div className="glass-card px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-warning/10 text-warning">
                <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">Sem cartões cadastrados</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                Cadastre um cartão para visualizar limite, controlar fatura e registrar seus gastos em um só lugar.
              </p>
            </div>
          ) : (
            cardSummaries.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                isSelected={selectedCard?.id === card.id}
                onSelect={setSelectedCardId}
              />
            ))
          )}
        </div>

        <CardDetails
          selectedCard={selectedCard}
          selectedTransactions={selectedTransactions}
          onDelete={deleteCard}
          onNewTransaction={() => setShowTransactionModal(true)}
        />
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <TransactionModal
          categories={categories}
          accounts={cards}
          transaction={null}
          onClose={() => setShowTransactionModal(false)}
          onSaved={() => {
            setShowTransactionModal(false);
            loadData();
          }}
          accountTypeFilter="credit"
          initialAccountId={selectedCard?.id}
          defaultType="expense"
          title="Adicionar gasto no cartão"
        />
      )}
    </div>
  );
}
