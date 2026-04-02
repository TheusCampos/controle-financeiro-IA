import { formatCardLastDigits, formatCurrency, getCardBrandLabel } from '@/lib/format';
import type { CardSummary } from '@/hooks/useCardsData';

interface CardItemProps {
  card: CardSummary;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export default function CardItem({ card, isSelected, onSelect }: CardItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(card.id)}
      className={`w-full overflow-hidden rounded-3xl border text-left transition ${
        isSelected ? 'border-warning/50 shadow-xl shadow-warning/10' : 'border-border/60 hover:border-primary/30'
      }`}
    >
      <div
        className="relative px-6 py-6"
        style={{
          background: `linear-gradient(135deg, ${card.color || '#111827'} 0%, rgba(17,24,39,0.95) 58%, rgba(3,7,18,1) 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_32%)]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.26em] text-white/60">{getCardBrandLabel(card.card_brand)}</p>
              <h3 className="mt-2 text-2xl font-serif text-white">{card.name}</h3>
              <p className="mt-1 text-xs text-white/60">{card.bank_name || 'Banco não informado'}</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
              {formatCardLastDigits(card.last_four_digits)}
            </span>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">Limite</p>
              <p className="mt-2 text-base font-semibold text-white">{formatCurrency(card.creditLimit)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">Usado</p>
              <p className="mt-2 text-base font-semibold text-white">{formatCurrency(card.spentThisMonth)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">Fecha</p>
              <p className="mt-2 text-base font-semibold text-white">Dia {card.closing_day || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">Vence</p>
              <p className="mt-2 text-base font-semibold text-white">Dia {card.due_day || '—'}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs text-white/60">
              <span>Uso do limite</span>
              <span>{card.utilization.toFixed(0)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-warning via-orange-400 to-rose-400 transition-all"
                style={{ width: `${Math.min(card.utilization, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
