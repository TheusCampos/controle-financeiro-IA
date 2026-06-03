-- 1. TRIGGER PARA ATUALIZAR SALDO DA CONTA AUTOMATICAMENTE
-- NUNCA CONFIAR NO FRONTEND PARA CÁLCULOS CRÍTICOS DE NEGÓCIO
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Caso de INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'income' THEN
      UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'transfer' THEN
      -- Se for transferência, a lógica dependeria de ter account_id_destination, mas como não temos,
      -- assumimos que 'transfer' de saída debita a conta atual.
      UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Caso de DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.type = 'income' THEN
      UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'expense' THEN
      UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'transfer' THEN
      UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    END IF;
    RETURN OLD;
  END IF;

  -- Caso de UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Primeiro, revertemos o efeito da transação antiga
    IF OLD.type = 'income' THEN
      UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'expense' THEN
      UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'transfer' THEN
      UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    END IF;

    -- Em seguida, aplicamos o efeito da nova transação
    IF NEW.type = 'income' THEN
      UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'transfer' THEN
      UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    END IF;
    
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_account_balance ON public.transactions;
CREATE TRIGGER trigger_update_account_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();

-- 2. IMPEDIR MASS ASSIGNMENT E GARANTIR INTEGRIDADE DE PROPRIEDADE
-- Validação rígida: o user_id da transação DEVE ser o mesmo da conta
CREATE OR REPLACE FUNCTION public.check_transaction_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.accounts 
    WHERE id = NEW.account_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Mass Assignment / IDOR detectado: Tentativa de vincular transação a uma conta que não pertence ao usuário.';
  END IF;

  IF NEW.category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categories 
    WHERE id = NEW.category_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Mass Assignment / IDOR detectado: Tentativa de vincular transação a uma categoria que não pertence ao usuário.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_transaction_ownership ON public.transactions;
CREATE TRIGGER trigger_check_transaction_ownership
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.check_transaction_ownership();

-- 3. REVOGAÇÃO DE JWT / SESSÃO (Mecanismo de Segurança)
-- Para implementar revogação de JWT explícita (Blacklist) no Supabase sem depender do timeout padrão.
CREATE TABLE IF NOT EXISTS public.revoked_tokens (
  token_id UUID PRIMARY KEY,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.revoked_tokens ENABLE ROW LEVEL SECURITY;

-- 4. REGRAS RLS EXPLÍCITAS (Reforço)
-- Garantindo que apenas o próprio usuário possa interagir com suas linhas (IDOR Protection)
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

-- Exemplo explícito para transactions garantindo RLS em todas as operações
DROP POLICY IF EXISTS "owner_all_transactions" ON public.transactions;
CREATE POLICY "owner_all_transactions_select" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_all_transactions_insert" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_all_transactions_update" ON public.transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_all_transactions_delete" ON public.transactions FOR DELETE USING (auth.uid() = user_id);
