import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/format';

interface Props {
  data: { month: string; income: number; expenses: number }[];
}

export default function CashFlowChart({ data }: Props) {
  return (
    <div className="dashboard-panel p-6 sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-8">
        <h3 className="text-xl font-semibold text-foreground">Fluxo de Caixa — 6 Meses</h3>
      </div>

      {data.length === 0 || data.every(d => d.income === 0 && d.expenses === 0) ? (
        <div className="flex items-center justify-center h-60 text-muted-foreground text-sm">
          Sem dados de transações ainda.
        </div>
      ) : (
        <div className="h-[280px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} 
                dx={-10}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Area 
                type="monotone" 
                dataKey="income" 
                stroke="#8b5cf6" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorIncome)" 
                name="Receitas" 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#8b5cf6' }}
              />
              <Area 
                type="monotone" 
                dataKey="expenses" 
                stroke="#0ea5e9" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorExpense)" 
                name="Despesas" 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#0ea5e9' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
