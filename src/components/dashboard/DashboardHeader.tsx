import { Moon, Sun, Settings } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface Props {
  userName: string;
}

export default function DashboardHeader({ userName }: Props) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita hydration mismatch e permite ler o tema real
  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? resolvedTheme : 'light';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center text-lg font-semibold overflow-hidden shrink-0 shadow-sm border border-border/40">
          <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${userName}&backgroundColor=transparent`} alt={userName} className="w-full h-full object-cover" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">Panorama Financeiro</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Acompanhe seus saldos e movimentações recentes, {userName.split(' ')[0]}.</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex items-center rounded-full bg-secondary/50 p-1 border border-border/50 w-[240px]">
          {/* Sliding Pill Background - Perfect sizing and smooth transition */}
          <div 
            className="absolute inset-y-1 left-1 w-[116px] rounded-full bg-background shadow-sm border border-border/20 transition-transform duration-300 ease-out"
            style={{
              transform: currentTheme === 'light' ? 'translateX(0)' : 'translateX(116px)'
            }}
          />
          
          <button
            onClick={() => setTheme('light')}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 rounded-full py-1.5 text-xs font-medium transition-colors duration-300 ${
              currentTheme === 'light' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 rounded-full py-1.5 text-xs font-medium transition-colors duration-300 ${
              currentTheme === 'dark' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
            Dark mode
          </button>
        </div>
        <Link 
          to="/settings" 
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-background hover:bg-secondary transition-colors group"
          title="Configurações"
        >
          <Settings className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors group-hover:rotate-45 duration-500" />
        </Link>
      </div>
    </div>
  );
}
