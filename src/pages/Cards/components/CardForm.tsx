import { useState } from 'react';
import { cardBrands, cardColors } from '@/hooks/useCardsData';

interface CardFormProps {
  onSubmit: (formData: {
    cardName: string;
    bankName: string;
    cardBrand: string;
    cardLimit: string;
    closingDay: string;
    dueDay: string;
    lastDigits: string;
    initialBalance: string;
    cardColor: string;
  }) => Promise<boolean>;
  onCancel: () => void;
}

const inputClass =
  'w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground transition placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40';

export default function CardForm({ onSubmit, onCancel }: CardFormProps) {
  const [cardName, setCardName] = useState('');
  const [bankName, setBankName] = useState('');
  const [cardBrand, setCardBrand] = useState('visa');
  const [cardLimit, setCardLimit] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [lastDigits, setLastDigits] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [cardColor, setCardColor] = useState(cardColors[0]);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setCardName('');
    setBankName('');
    setCardBrand('visa');
    setCardLimit('');
    setClosingDay('');
    setDueDay('');
    setLastDigits('');
    setInitialBalance('');
    setCardColor(cardColors[0]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    const success = await onSubmit({
      cardName,
      bankName,
      cardBrand,
      cardLimit,
      closingDay,
      dueDay,
      lastDigits,
      initialBalance,
      cardColor,
    });

    if (success) {
      resetForm();
      onCancel();
    }

    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6">
      <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Cadastrar novo cartão</h3>
          <p className="mt-1 text-sm text-muted-foreground">Preencha os dados que serão usados no dashboard e nos lançamentos.</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <label className="mb-1.5 ml-1 block text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Nome do cartão</label>
          <input
            type="text"
            value={cardName}
            onChange={(event) => setCardName(event.target.value)}
            className={inputClass}
            placeholder="Ex: Nubank Ultravioleta"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 ml-1 block text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Banco</label>
          <input
            type="text"
            value={bankName}
            onChange={(event) => setBankName(event.target.value)}
            className={inputClass}
            placeholder="Ex: Nubank"
          />
        </div>
        <div>
          <label className="mb-1.5 ml-1 block text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Bandeira</label>
          <select value={cardBrand} onChange={(event) => setCardBrand(event.target.value)} className={inputClass}>
            {cardBrands.map((brand) => (
              <option key={brand.value} value={brand.value}>
                {brand.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 ml-1 block text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Limite</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={cardLimit}
            onChange={(event) => setCardLimit(event.target.value)}
            className={inputClass}
            placeholder="0,00"
          />
        </div>
        <div>
          <label className="mb-1.5 ml-1 block text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Saldo inicial</label>
          <input
            type="number"
            step="0.01"
            value={initialBalance}
            onChange={(event) => setInitialBalance(event.target.value)}
            className={inputClass}
            placeholder="0,00"
          />
        </div>
        <div>
          <label className="mb-1.5 ml-1 block text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Final</label>
          <input
            type="text"
            value={lastDigits}
            onChange={(event) => setLastDigits(event.target.value.replace(/\D/g, '').slice(0, 4))}
            className={inputClass}
            placeholder="1234"
            maxLength={4}
          />
        </div>
        <div>
          <label className="mb-1.5 ml-1 block text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Fechamento</label>
          <input
            type="number"
            min="1"
            max="31"
            value={closingDay}
            onChange={(event) => setClosingDay(event.target.value)}
            className={inputClass}
            placeholder="Dia"
          />
        </div>
        <div>
          <label className="mb-1.5 ml-1 block text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Vencimento</label>
          <input
            type="number"
            min="1"
            max="31"
            value={dueDay}
            onChange={(event) => setDueDay(event.target.value)}
            className={inputClass}
            placeholder="Dia"
          />
        </div>
        <div>
          <label className="mb-1.5 ml-1 block text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Cor do cartão</label>
          <div className="flex gap-2">
            {cardColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setCardColor(color)}
                className={`h-11 flex-1 rounded-xl border transition ${cardColor === color ? 'border-white/80 scale-[1.02]' : 'border-border/60'}`}
                style={{ backgroundColor: color }}
                aria-label={`Selecionar cor ${color}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary/70"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar cartão'}
        </button>
      </div>
    </form>
  );
}
