import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { getMonthName } from '@/lib/format';
import type { Transaction, Account, Category, Budget, FinancialSummary } from '@/types/finance';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import KpiCards from '@/components/dashboard/KpiCards';
import CashFlowChart from '@/components/dashboard/CashFlowChart';
import ExpenseByCategoryChart from '@/components/dashboard/ExpenseByCategoryChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import BudgetStatusList from '@/components/dashboard/BudgetStatusList';
import MyCardsPanel from '@/components/dashboard/MyCardsPanel';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [summary, setSummary] = useState<FinancialSummary>({ totalBalance: 0, monthlyIncome: 0, monthlyExpenses: 0, savingsRate: 0 });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [monthTxns, setMonthTxns] = useState<Transaction[]>([]);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [cashFlowData, setCashFlowData] = useState<{ month: string; income: number; expenses: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user]);

  async function loadDashboard() {
    setLoading(true);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [accountsRes, txnsRes, recentRes, categoriesRes, budgetsRes] = await Promise.all([
      supabase.from('accounts').select('*').eq('is_active', true),
      supabase.from('transactions').select('*').gte('date', startOfMonth).lte('date', endOfMonth),
      supabase.from('transactions').select('*, category:categories(*)').order('date', { ascending: false }).limit(5),
      supabase.from('categories').select('*'),
      supabase.from('budgets').select('*, category:categories(*)').eq('is_active', true),
    ]);

    const accounts = (accountsRes.data || []) as Account[];
    const monthTxns = (txnsRes.data || []) as Transaction[];
    const categories = (categoriesRes.data || []) as Category[];

    setAccounts(accounts);
    setMonthTxns(monthTxns);
    const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
    const monthlyIncome = monthTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const monthlyExpenses = monthTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

    setSummary({ totalBalance, monthlyIncome, monthlyExpenses, savingsRate });
    setRecentTxns((recentRes.data || []) as Transaction[]);

    // Category breakdown
    const expensesByCategory: Record<string, number> = {};
    monthTxns.filter(t => t.type === 'expense').forEach(t => {
      const cat = categories.find(c => c.id === t.category_id);
      const name = cat?.name || 'Outros';
      expensesByCategory[name] = (expensesByCategory[name] || 0) + Number(t.amount);
    });
    setCategoryData(
      Object.entries(expensesByCategory)
        .map(([name, value]) => {
          const cat = categories.find(c => c.name === name);
          return { name, value, color: cat?.color || '#6B7280' };
        })
        .sort((a, b) => b.value - a.value)
    );

    // Cash flow last 6 months
    const months: { month: string; income: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = d.toISOString().split('T')[0];
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
      months.push({ month: getMonthName(d), income: 0, expenses: 0 });
    }
    // Fetch all 6 months at once
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0];
    const { data: allTxns } = await supabase.from('transactions').select('type, amount, date').gte('date', sixMonthsAgo);
    (allTxns || []).forEach((t: { type: string; amount: number; date: string }) => {
      const d = new Date(t.date);
      const idx = 5 - (now.getMonth() - d.getMonth() + (now.getFullYear() - d.getFullYear()) * 12);
      if (idx >= 0 && idx < 6) {
        if (t.type === 'income') months[idx].income += Number(t.amount);
        if (t.type === 'expense') months[idx].expenses += Number(t.amount);
      }
    });
    setCashFlowData(months);

    // Budget status
    const budgetList = (budgetsRes.data || []) as Budget[];
    const budgetsWithSpent = budgetList.map(b => {
      const spent = monthTxns
        .filter(t => t.type === 'expense' && (b.category_id ? t.category_id === b.category_id : true))
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return { ...b, spent };
    });
    setBudgets(budgetsWithSpent);

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="kpi-card h-28 skeleton-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card h-80 skeleton-pulse" />
          <div className="glass-card h-80 skeleton-pulse" />
        </div>
        <div className="glass-card h-[420px] skeleton-pulse" />
      </div>
    );
  }

  const cardOverview = accounts
    .filter((account) => account.type === 'credit')
    .map((account) => {
      const spentThisMonth = monthTxns
        .filter((transaction) => transaction.account_id === account.id && transaction.type === 'expense')
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
      const creditLimit = Number(account.credit_limit || 0);
      const availableLimit = Math.max(creditLimit - spentThisMonth, 0);

      return {
        id: account.id,
        name: account.name,
        bankName: account.bank_name,
        brand: account.card_brand,
        lastDigits: account.last_four_digits,
        color: account.color,
        creditLimit,
        spentThisMonth,
        availableLimit,
        utilization: creditLimit > 0 ? (spentThisMonth / creditLimit) * 100 : 0,
        dueDay: account.due_day,
        closingDay: account.closing_day,
      };
    });

  const currentMonthLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const userEmail = user?.email || 'Conta ativa';

  return (
    <div className="space-y-8 animate-fade-in pb-8 max-w-[1600px] mx-auto">
      <DashboardHeader userName={userName} />

      <KpiCards summary={summary} />

      <MyCardsPanel cards={cardOverview} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        <CashFlowChart data={cashFlowData} />
        <ExpenseByCategoryChart data={categoryData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
        <RecentTransactions transactions={recentTxns} />
        <BudgetStatusList budgets={budgets} />
      </div>
    </div>
  );
}
