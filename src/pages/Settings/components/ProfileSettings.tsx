import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileSettingsProps {
  fullName: string;
  email: string;
  onNameChange: (name: string) => void;
  inputClass: string;
}

export default function ProfileSettings({ fullName, email, onNameChange, inputClass }: ProfileSettingsProps) {
  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center gap-3 border-b border-border/50 pb-4 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground leading-tight">Perfil</h3>
          <p className="text-xs text-muted-foreground">Informações básicas da sua conta</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">Nome Completo</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => onNameChange(e.target.value)}
            className={inputClass}
            placeholder="Seu nome"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">E-mail</label>
          <input
            type="email"
            value={email}
            className={cn(inputClass, "bg-secondary/50 opacity-80")}
            disabled
          />
          <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">O e-mail não pode ser alterado diretamente.</p>
        </div>
      </div>
    </div>
  );
}
