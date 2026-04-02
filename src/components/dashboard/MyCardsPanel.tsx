import { CreditCard, Plus, Wifi, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCardLastDigits, getCardBrandLabel } from '@/lib/format';

interface DashboardCardItem {
  id: string;
  name: string;
  bankName: string | null;
  brand: string | null;
  lastDigits: string | null;
  color: string | null;
  dueDay: number | null;
  closingDay: number | null;
}

interface Props {
  cards: DashboardCardItem[];
}

export default function MyCardsPanel({ cards }: Props) {
  return (
    <section className="dashboard-panel p-6 sm:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-foreground" />
          </div>
          <h3 className="text-2xl font-semibold text-foreground tracking-tight">Meus Cartões</h3>
        </div>
        <Link
          to="/cards"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Adicionar Novo
        </Link>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-border/70 bg-background/50 px-6 py-12 text-center">
          <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-xl font-medium text-foreground">Nenhum cartão configurado</h4>
          <p className="mt-2 text-base text-muted-foreground max-w-md mx-auto">Adicione seu primeiro cartão para centralizar suas faturas e limites.</p>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbar -mx-6 px-6 sm:-mx-8 sm:px-8">
          {cards.map((card, index) => {
            const isFirst = index === 0;
            const bgClass = isFirst 
              ? 'bg-[#121212] text-white border-zinc-800' 
              : 'bg-gradient-to-br from-[#E2E2E2] to-[#B3B3B3] text-zinc-900 border-white/40 shadow-inner';
            
            return (
              <div
                key={card.id}
                className={`relative shrink-0 snap-center w-[360px] h-[220px] rounded-[32px] p-7 shadow-lg overflow-hidden flex flex-col justify-between border ${bgClass}`}
                style={card.color && !isFirst ? { background: `linear-gradient(135deg, ${card.color} 0%, rgba(20,20,20,0.85) 100%)`, color: 'white', borderColor: 'rgba(255,255,255,0.1)' } : {}}
              >
                {/* Decorative overlapping squares (Card Texture) */}
                <div className="absolute top-0 right-0 opacity-10 flex">
                  <div className={`w-20 h-20 ${isFirst ? 'bg-white' : 'bg-black'}`} />
                  <div className={`w-20 h-20 ${isFirst ? 'bg-white' : 'bg-black'} translate-y-10 -translate-x-10`} />
                </div>

                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <Wifi className="w-7 h-7 rotate-90 opacity-90" />
                    <span className="bg-white/90 text-black px-4 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-sm">
                      Ativo
                    </span>
                  </div>
                  {card.brand === 'mastercard' ? (
                    <div className="flex -space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#EB001B] mix-blend-multiply opacity-90" />
                      <div className="w-10 h-10 rounded-full bg-[#F79E1B] mix-blend-multiply opacity-90" />
                    </div>
                  ) : card.brand === 'visa' ? (
                    <span className="text-3xl font-bold italic tracking-tighter opacity-90">VISA</span>
                  ) : (
                    <span className="text-base font-bold uppercase tracking-wider opacity-90">{getCardBrandLabel(card.brand)}</span>
                  )}
                </div>

                <div className="mt-auto relative z-10">
                  {/* Card Name */}
                  <div className="mb-5 text-xl font-medium tracking-wide">
                    {card.name}
                  </div>
                  
                  <div className="grid grid-cols-[1fr_auto] gap-6 items-end">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest opacity-60 mb-1.5">Número do Cartão</p>
                      <p className="font-mono text-xl tracking-[0.15em] opacity-90">**** **** {formatCardLastDigits(card.lastDigits) || '0000'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest opacity-60 mb-1.5">EXP</p>
                      <p className="font-mono text-lg opacity-90">{String(card.dueDay || '12').padStart(2, '0')}/{String((card.closingDay || 29) % 100).padStart(2, '0')}</p>
                    </div>
                  </div>
                </div>

                {/* Right Arrow Navigation Indicator (Only visible on hover) */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
