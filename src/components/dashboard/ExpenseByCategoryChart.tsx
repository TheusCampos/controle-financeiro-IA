import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/format';

interface Props {
  data: { name: string; value: number; color: string }[];
}

export default function ExpenseByCategoryChart({ data }: Props) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="dashboard-panel p-6 sm:p-8">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-semibold text-foreground">Despesas por Categoria</h3>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Último mês</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-60 text-muted-foreground text-sm">
          Nenhuma despesa registrada este mês.
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-8 lg:gap-12 w-full overflow-hidden">
          <div className="relative h-[200px] w-[200px] shrink-0 mx-auto md:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius="70%"
                  outerRadius="100%"
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 w-full min-w-0 space-y-4">
            {data.slice(0, 6).map((item) => {
              const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
              return (
                <div key={item.name} className="flex items-center gap-3 w-full">
                  <div className="w-24 sm:w-28 truncate text-sm font-medium text-foreground shrink-0" title={item.name}>
                    {item.name}
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm font-medium text-muted-foreground shrink-0">
                    {pct}%
                  </div>
                </div>
              );
            })}
            <div className="pt-5 mt-4 border-t border-border/50 flex justify-between items-center text-sm w-full">
              <span className="font-semibold text-foreground uppercase tracking-widest text-xs">Total</span>
              <span className="font-semibold text-foreground text-base whitespace-nowrap">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
