import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { loadConversationById, deleteConversation, localConversationKey } from '@/lib/assistantDb';

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: { messages: [{ role: 'user', content: 'test' }] }, error: null })
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      }))
    }))
  }
}));

describe('DeleteConfirmationModal Component', () => {
  it('deve renderizar título e descrição', () => {
    render(
      <DeleteConfirmationModal
        title="Excluir Item"
        description="Tem certeza que deseja excluir?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    
    expect(screen.getByText('Excluir Item')).toBeInTheDocument();
    expect(screen.getByText('Tem certeza que deseja excluir?')).toBeInTheDocument();
  });

  it('deve chamar onConfirm quando clicar no botão de excluir', () => {
    const onConfirmMock = vi.fn();
    render(
      <DeleteConfirmationModal
        title="Excluir"
        description="Desc"
        onConfirm={onConfirmMock}
        onCancel={vi.fn()}
      />
    );
    
    fireEvent.click(screen.getByText('Sim, Excluir'));
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
  });

  it('deve chamar onCancel quando clicar em cancelar', () => {
    const onCancelMock = vi.fn();
    render(
      <DeleteConfirmationModal
        title="Excluir"
        description="Desc"
        onConfirm={vi.fn()}
        onCancel={onCancelMock}
      />
    );
    
    fireEvent.click(screen.getByText('Cancelar'));
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it('deve desabilitar botões enquanto isLoading for true', () => {
    render(
      <DeleteConfirmationModal
        title="Excluir"
        description="Desc"
        isLoading={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    
    expect(screen.getByText('Sim, Excluir')).toBeDisabled();
    expect(screen.getByText('Cancelar')).toBeDisabled();
  });
});

describe('assistantDb functions', () => {
  it('deve carregar conversa por ID', async () => {
    const msgs = await loadConversationById('user-1', 'conv-1');
    expect(msgs).toBeDefined();
    expect(msgs?.[0].content).toBe('test');
  });

  it('deve excluir conversa por ID', async () => {
    const success = await deleteConversation('user-1', 'conv-1');
    expect(success).toBe(true);
  });
});
