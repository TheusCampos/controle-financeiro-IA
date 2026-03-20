import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/format';

interface Props {
  data: { month: string; income: number; expenses: number }[];
}

export default function CashFlowChart({ data }: Props) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Fluxo de Caixa — 6 Meses</h3>
      {data.length === 0 || data.every(d => d.income === 0 && d.expenses === 0) ? (
        <div className="flex items-center justify-center h-60 text-muted-foreground text-sm">
          Sem dados de transações ainda. Adicione suas primeiras transações.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
              itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Area type="monotone" dataKey="income" stroke="hsl(var(--success))" strokeWidth={2} fillOpacity={1} fill="url(#incomeGrad)" name="Receitas" />
            <Area type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" name="Despesas" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
