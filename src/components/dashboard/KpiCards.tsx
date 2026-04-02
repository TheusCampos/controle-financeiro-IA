import { TrendingUp, TrendingDown, Wallet, PiggyBank, FileText, ArrowRightLeft, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import type { FinancialSummary } from '@/types/finance';

interface Props {
  summary: FinancialSummary;
}

export default function KpiCards({ summary }: Props) {
  const isPositiveSavings = summary.savingsRate >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Saldo Total */}
      <div className="rounded-[24px] border border-border/50 bg-card p-6 shadow-sm relative overflow-hidden group">
        <div className="flex items-start justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Saldo total</p>
          <FileText className="h-4 w-4 text-muted-foreground/60" />
        </div>
        <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          {formatCurrency(summary.totalBalance)}
        </p>
        <div className="mt-6 h-10 w-full opacity-60">
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full stroke-primary fill-none">
            <path d="M0,25 C10,25 15,10 25,15 C35,20 40,5 50,10 C60,15 65,25 75,20 C85,15 90,5 100,5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Receitas */}
      <div className="rounded-[24px] border border-border/50 bg-card p-6 shadow-sm relative overflow-hidden group">
        <div className="flex items-start justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Receitas do mês</p>
          <ArrowRightLeft className="h-4 w-4 text-muted-foreground/60" />
        </div>
        <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          {formatCurrency(summary.monthlyIncome)}
        </p>
        <div className="mt-6 h-10 w-full opacity-60">
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full stroke-success fill-none">
            <path d="M0,15 C15,25 25,5 40,15 C55,25 65,5 80,15 C90,20 95,10 100,10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Despesas */}
      <div className="rounded-[24px] border border-border/50 bg-card p-6 shadow-sm relative overflow-hidden group">
        <div className="flex items-start justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Despesas do mês</p>
          <TrendingDown className="h-4 w-4 text-muted-foreground/60" />
        </div>
        <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          {formatCurrency(summary.monthlyExpenses)}
        </p>
        <div className="mt-6 flex h-10 items-end gap-1.5 opacity-80">
          {[40, 70, 45, 90, 60, 30, 80, 50].map((h, i) => (
            <div key={i} className="w-full bg-primary/20 rounded-t-sm" style={{ height: `${h}%` }}>
              <div className="w-full bg-primary rounded-t-sm" style={{ height: `${h * 0.7}%` }} />
            </div>
          ))}
        </div>
      </div>

      {/* Taxa de economia */}
      <div className="rounded-[24px] border border-border/50 bg-card p-6 shadow-sm relative overflow-hidden group">
        <div className="flex items-start justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Taxa de economia</p>
          <PiggyBank className="h-4 w-4 text-muted-foreground/60" />
        </div>
        <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          {summary.savingsRate.toFixed(1)}%
        </p>
        <div className="absolute -bottom-2 -right-2 h-24 w-24 opacity-80 transition-transform group-hover:scale-110">
          <div className="w-full h-full flex items-center justify-center text-5xl">
            🐷
          </div>
        </div>
      </div>
    </div>
  );
}
