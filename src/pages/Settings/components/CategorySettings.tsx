import { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CategorySchema } from '@/lib/validators';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/finance';
import { toast } from 'sonner';

interface CategorySettingsProps {
  userId: string;
  categories: Category[];
  onDataChanged: () => void;
  inputClass: string;
}

export default function CategorySettings({ userId, categories, onDataChanged, inputClass }: CategorySettingsProps) {
  const [showForm, setShowForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<Category['type']>('expense');
  const [catColor, setCatColor] = useState('#6B7280');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = CategorySchema.safeParse({
      name: catName,
      type: catType,
      color: catColor,
    });

    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || 'Dados inválidos');
      return;
    }

    const payload = {
      user_id: userId,
      ...parsed.data,
      type: parsed.data.type,
      name: parsed.data.name,
    };

    const { error } = await supabase.from('categories').insert(payload);
    if (error) { toast.error('Erro ao criar categoria'); return; }
    toast.success('Categoria criada!');
    setShowForm(false); setCatName(''); setCatColor('#6B7280');
    onDataChanged();
  };

  const updateCategory = async (id: string) => {
    const parsed = CategorySchema.safeParse({
      name: editCatName,
      type: 'expense', // Just to pass validation, we only update name
    });

    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || 'Nome inválido');
      return;
    }

    const { error } = await supabase.from('categories').update({ name: parsed.data.name }).eq('id', id).eq('user_id', userId);
    if (error) toast.error('Erro ao atualizar');
    else { toast.success('Categoria atualizada'); setEditingCatId(null); onDataChanged(); }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', userId);
    if (error) toast.error('Erro ao excluir categoria');
    else { toast.success('Categoria excluída'); onDataChanged(); }
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Tag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground leading-tight">Categorias</h3>
            <p className="text-xs text-muted-foreground">Organize suas receitas e despesas</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={cn(
            "flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm",
            showForm
              ? "bg-muted text-foreground hover:bg-muted/80"
              : "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          {showForm ? <X className="w-5 h-5 sm:w-3.5 sm:h-3.5" /> : <Plus className="w-5 h-5 sm:w-3.5 sm:h-3.5" />}
          <span className="hidden sm:inline">{showForm ? 'Cancelar' : 'Adicionar'}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={createCategory} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-secondary/30 rounded-2xl border border-border/50 animate-in zoom-in-95 duration-200">
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Nome da Categoria</label>
            <input type="text" placeholder="Ex: Alimentação, Salário..." value={catName} onChange={e => setCatName(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Tipo de Fluxo</label>
            <select value={catType} onChange={e => setCatType(e.target.value as Category['type'])} className={inputClass}>
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
              <option value="both">Ambos</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Cor</label>
            <div className="flex gap-2">
              <input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} className="h-10 w-16 rounded-lg border border-border cursor-pointer bg-secondary p-1" />
              <div className="flex-1 flex items-center px-3 rounded-lg bg-secondary/50 text-[10px] font-mono text-muted-foreground uppercase">
                {catColor}
              </div>
            </div>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md shadow-primary/10 transition-all active:scale-[0.98]">
              Criar Categoria
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.length === 0 ? (
          <div className="sm:col-span-2 text-center py-10 px-4 rounded-2xl border border-dashed border-border/50">
            <Tag className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p>
          </div>
        ) : (
          categories.map(cat => (
            <div key={cat.id} className="group flex items-center justify-between p-3 rounded-xl border border-border/30 hover:border-primary/20 hover:bg-secondary/30 transition-all duration-200">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: cat.color || '#6B7280' }} />
                <div className="flex flex-col min-w-0">
                  {editingCatId === cat.id ? (
                    <input
                      type="text"
                      value={editCatName}
                      onChange={e => setEditCatName(e.target.value)}
                      className="px-2 py-0.5 rounded bg-background border border-primary/50 text-foreground text-xs w-full focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && updateCategory(cat.id)}
                    />
                  ) : (
                    <span className="text-sm font-semibold text-foreground truncate">{cat.name}</span>
                  )}
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-tighter",
                    cat.type === 'income' ? 'text-success' : cat.type === 'expense' ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {cat.type === 'income' ? 'Receita' : cat.type === 'expense' ? 'Despesa' : 'Híbrida'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-0.5 ml-2">
                {editingCatId === cat.id ? (
                  <>
                    <button onClick={() => updateCategory(cat.id)} className="p-1.5 text-success hover:bg-success/10 rounded-lg transition">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingCatId(null)} className="p-1.5 text-muted-foreground hover:bg-secondary rounded-lg transition">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); }}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {!cat.is_default && (
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
