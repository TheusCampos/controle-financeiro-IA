import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Senha atualizada com sucesso!');
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-[400px] bg-card border border-border shadow-soft rounded-2xl p-8">
        <h1 className="text-3xl font-serif font-medium text-foreground mb-6 tracking-tight text-center">Redefinir senha</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Nova senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-md bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition text-sm shadow-sm"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md bg-foreground text-background font-medium hover:opacity-90 shadow-sm transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Atualizando...' : 'Atualizar senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
