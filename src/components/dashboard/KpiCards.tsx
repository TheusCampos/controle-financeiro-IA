import { TrendingUp, TrendingDown, Wallet, PiggyBank, FileText, ArrowRightLeft, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import type { FinancialSummary } from '@/types/finance';

interface Props {
  summary: FinancialSummary;
  cashFlowData?: { month: string; income: number; expenses: number }[];
}

function generateSmoothPath(data: number[]): string {
  if (!data || data.length < 2) return 'M0,25 L100,25';
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 25 - ((val - min) / range) * 20; // Mapeia entre 5 e 25 para caber no SVG
    return { x, y };
  });

  return points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point.x},${point.y}`;
    const prev = a[i - 1];
    const cp1x = prev.x + (point.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (point.x - prev.x) / 2;
    const cp2y = point.y;
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${point.x},${point.y}`;
  }, '');
}

export default function KpiCards({ summary, cashFlowData = [] }: Props) {
  const isPositiveSavings = summary.savingsRate >= 0;

  // Extrair arrays para os gráficos
  const incomes = cashFlowData.map(d => d.income);
  const expenses = cashFlowData.map(d => d.expenses);
  
  // Calcular o histórico de saldo aproximado (de trás para frente)
  const balances = new Array(cashFlowData.length).fill(0);
  let currentBalance = summary.totalBalance;
  for (let i = cashFlowData.length - 1; i >= 0; i--) {
    balances[i] = currentBalance;
    currentBalance = currentBalance - (cashFlowData[i]?.income || 0) + (cashFlowData[i]?.expenses || 0);
  }

  const balancePath = generateSmoothPath(balances.length > 0 ? balances : [0, 10, 20]);
  const incomePath = generateSmoothPath(incomes.length > 0 ? incomes : [0, 10, 20]);

  const maxExpense = Math.max(...expenses, 1);
  const expenseHeights = expenses.length > 0 ? expenses.map(val => (val / maxExpense) * 100) : [40, 70, 45, 90, 60, 30];

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
            <path d={balancePath} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
            <path d={incomePath} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
          {expenseHeights.map((h, i) => (
            <div key={i} className="w-full bg-primary/20 rounded-t-sm" style={{ height: `${Math.max(h, 10)}%` }}>
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
          <div className="w-full h-full flex items-center justify-center">
            <img 
              src="/porco-dinheiro.png" 
              alt="Porquinho de Dinheiro" 
              className="w-16 h-16 object-contain drop-shadow-sm"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
