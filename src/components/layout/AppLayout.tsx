import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, 
  CreditCard,
  ArrowLeftRight, 
  PiggyBank, 
  Target,
  BarChart3, 
  LogOut, 
  Settings, 
  Menu, 
  X,
  Bot
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/assistant', icon: Bot, label: 'Assistente IA' },
  { to: '/cards', icon: CreditCard, label: 'Cartões' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transações' },
  { to: '/budgets', icon: PiggyBank, label: 'Orçamentos' },
  { to: '/goals', icon: Target, label: 'Metas' },
  { to: '/reports', icon: BarChart3, label: 'Relatórios' },
];

export default function AppLayout() {
  const signOut = useAuthStore((s) => s.signOut);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-center p-4">
        <img 
          src="/Logo-FinanceAI.png" 
          alt="Logotipo do FinanceAI - Assistente Financeiro com IA" 
          className="w-full h-auto max-h-16 object-contain transition-transform duration-500 group-hover:scale-105" 
          loading="eager"
        />
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={closeSidebar}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group
              ${isActive 
                ? 'bg-foreground text-background shadow-lg shadow-foreground/10 translate-x-1' 
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary hover:translate-x-1'
              }
            `}
          >
            <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 group-active:scale-95`} />
            <span className="tracking-wide">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-border/50 space-y-2">
        <NavLink 
          to="/settings" 
          onClick={closeSidebar} 
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-300 hover:translate-x-1"
        >
          <Settings className="w-5 h-5" />
          <span className="tracking-wide">Configurações</span>
        </NavLink>
        <button 
          onClick={signOut} 
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-all duration-300 w-full hover:translate-x-1"
        >
          <LogOut className="w-5 h-5" />
          <span className="tracking-wide">Sair da conta</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" 
          onClick={closeSidebar} 
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col shadow-xl 
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <button 
          onClick={closeSidebar} 
          className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground transition lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto scrollbar-thin flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-2 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-secondary transition-colors shrink-0">
            <Menu className="w-6 h-6 text-foreground" />
          </button>
          <div className="flex-1 flex justify-center px-4">
            <img 
              src="/Logo-FinanceAI.png" 
              alt="Logotipo do FinanceAI" 
              className="w-auto h-12 max-w-[180px] object-contain" 
              loading="eager"
            />
          </div>
          <div className="w-10" /> {/* Spacer to maintain logo centered */}
        </header>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
