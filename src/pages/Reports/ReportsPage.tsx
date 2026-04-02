import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, getMonthName } from '@/lib/format';
import type { Transaction, Category } from '@/types/finance';
import { Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
  const user = useAuthStore((s) => s.user);
  const [monthlyData, setMonthlyData] = useState<{ month: string; income: number; expenses: number; savings: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  useEffect(() => { if (user) loadReports(); }, [user]);

  async function loadReports() {
    setLoading(true);
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0];
    const [txnsRes, catsRes] = await Promise.all([
      supabase.from('transactions').select('*').gte('date', sixMonthsAgo),
      supabase.from('categories').select('*'),
    ]);
    const txns = (txnsRes.data || []) as Transaction[];
    const cats = (catsRes.data || []) as Category[];
    setAllTransactions(txns);
    setAllCategories(cats);

    const months: { month: string; income: number; expenses: number; savings: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: getMonthName(d), income: 0, expenses: 0, savings: 0 });
    }
    txns.forEach(t => {
      const d = new Date(t.date);
      const idx = 5 - (now.getMonth() - d.getMonth() + (now.getFullYear() - d.getFullYear()) * 12);
      if (idx >= 0 && idx < 6) {
        if (t.type === 'income') months[idx].income += Number(t.amount);
        if (t.type === 'expense') months[idx].expenses += Number(t.amount);
      }
    });
    months.forEach(m => m.savings = m.income - m.expenses);
    setMonthlyData(months);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthTxns = txns.filter(t => t.date >= startOfMonth);
    const inc = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const exp = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    setTotalIncome(inc);
    setTotalExpenses(exp);

    const byCat: Record<string, number> = {};
    monthTxns.filter(t => t.type === 'expense').forEach(t => {
      const cat = cats.find(c => c.id === t.category_id);
      const name = cat?.name || 'Outros';
      byCat[name] = (byCat[name] || 0) + Number(t.amount);
    });
    setCategoryData(
      Object.entries(byCat).map(([name, value]) => ({
        name, value, color: cats.find(c => c.name === name)?.color || '#6B7280',
      })).sort((a, b) => b.value - a.value)
    );
    setLoading(false);
  }

  const exportCSV = () => {
    const header = 'Data,Descrição,Tipo,Valor,Categoria\n';
    const rows = allTransactions.map(t => {
      const cat = allCategories.find(c => c.id === t.category_id)?.name || '';
      const tipo = t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : 'Transferência';
      return `${t.date},"${t.description}",${tipo},${Number(t.amount).toFixed(2)},"${cat}"`;
    }).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Relatório Financeiro', 14, 22);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

    // Summary
    doc.setFontSize(12);
    doc.text('Resumo do Mês', 14, 42);
    doc.setFontSize(10);
    doc.text(`Receitas: ${formatCurrency(totalIncome)}`, 14, 50);
    doc.text(`Despesas: ${formatCurrency(totalExpenses)}`, 14, 56);
    doc.text(`Economia: ${formatCurrency(totalIncome - totalExpenses)}`, 14, 62);

    // Transactions table
    const tableData = allTransactions.map(t => [
      t.date,
      t.description,
      t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : 'Transferência',
      `R$ ${Number(t.amount).toFixed(2)}`,
      allCategories.find(c => c.id === t.category_id)?.name || '-',
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Data', 'Descrição', 'Tipo', 'Valor', 'Categoria']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 76, 129] },
    });

    doc.save(`relatorio_financeiro_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const tooltipStyle = { backgroundColor: 'hsl(217, 33%, 17%)', border: '1px solid hsl(217, 25%, 25%)', borderRadius: '8px' };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 skeleton-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-72 skeleton-pulse rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-3xl font-serif font-medium text-foreground tracking-tight">Relatórios</h2>
          <p className="text-muted-foreground text-sm mt-1">Análise detalhada das suas finanças</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition border border-border">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Monthly summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi-card">
          <span className="text-sm text-muted-foreground">Receitas (mês)</span>
          <p className="text-xl font-bold font-mono money-positive mt-1">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="kpi-card">
          <span className="text-sm text-muted-foreground">Despesas (mês)</span>
          <p className="text-xl font-bold font-mono money-negative mt-1">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="kpi-card">
          <span className="text-sm text-muted-foreground">Economia (mês)</span>
          <p className={`text-xl font-bold font-mono mt-1 ${totalIncome - totalExpenses >= 0 ? 'money-positive' : 'money-negative'}`}>
            {formatCurrency(totalIncome - totalExpenses)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Receitas vs Despesas</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 25%, 25%)" />
              <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="income" fill="hsl(160, 100%, 33%)" radius={[4, 4, 0, 0]} name="Receitas" />
              <Bar dataKey="expenses" fill="hsl(355, 82%, 56%)" radius={[4, 4, 0, 0]} name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Evolução da Economia</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 25%, 25%)" />
              <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              <Line type="monotone" dataKey="savings" stroke="hsl(207, 78%, 40%)" strokeWidth={2} dot={{ r: 4 }} name="Economia" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Despesas por Categoria</h3>
          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-60 text-muted-foreground text-sm">Sem dados</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={260} className="sm:w-1/2">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" stroke="none">
                    {categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2 w-full">
                {categoryData.slice(0, 6).map(item => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground truncate">{item.name}</span>
                    </div>
                    <span className="font-mono text-foreground">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
