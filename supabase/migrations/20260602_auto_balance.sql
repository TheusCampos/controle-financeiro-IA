-- =============================================================================
-- Migration: 20260602_auto_balance.sql
-- Descrição: Implementa cálculo automático de saldo em contas e faturas de
--            cartão de crédito. Garante que a coluna `accounts.balance` e a
--            nova coluna `accounts.current_invoice` permaneçam sempre
--            sincronizadas com `transactions`.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Coluna `current_invoice` em contas de crédito
-- -----------------------------------------------------------------------------
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS current_invoice numeric DEFAULT 0;

COMMENT ON COLUMN public.accounts.current_invoice IS
  'Soma de despesas (type=expense) vinculadas à fatura corrente do cartão. Usado em substituição a `balance` para type=credit.';

-- -----------------------------------------------------------------------------
-- 2) Coluna `transfer_to_account_id` em transações (Phase 4)
-- -----------------------------------------------------------------------------
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS transfer_to_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.transactions.transfer_to_account_id IS
  'Para type=transfer, conta destino. Permite que o trigger recalcule saldo em ambos os lados.';

CREATE INDEX IF NOT EXISTS idx_transactions_transfer_to_account_id
  ON public.transactions(transfer_to_account_id);

-- -----------------------------------------------------------------------------
-- 3) Função: recalcula saldo e fatura corrente de uma conta
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalc_account_balance(p_account_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type           text;
  v_balance_base   numeric;     -- saldo base (initial) — vem de uma tabela de ledger ou do próprio `balance` quando "saldo manual"
  v_sum_income     numeric;
  v_sum_expense    numeric;
  v_sum_xfer_in    numeric;
  v_sum_xfer_out   numeric;
  v_current_inv    numeric;
  v_new_balance    numeric;
BEGIN
  SELECT type, COALESCE(balance, 0)
    INTO v_type, v_balance_base
    FROM public.accounts
   WHERE id = p_account_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Transferências (entram/saem do saldo, mas não da fatura)
  SELECT
      COALESCE(SUM(CASE WHEN t.transfer_to_account_id = p_account_id THEN t.amount ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN t.account_id = p_account_id AND t.transfer_to_account_id IS NOT NULL THEN t.amount ELSE 0 END), 0)
    INTO v_sum_xfer_in, v_sum_xfer_out
    FROM public.transactions t
   WHERE (t.account_id = p_account_id OR t.transfer_to_account_id = p_account_id)
     AND t.type = 'transfer';

  SELECT
      COALESCE(SUM(CASE WHEN t.type = 'income'  THEN t.amount ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)
    INTO v_sum_income, v_sum_expense
    FROM public.transactions t
   WHERE t.account_id = p_account_id
     AND t.type IN ('income', 'expense');

  -- Cartão de crédito: `balance` representa a fatura corrente (despesas do ciclo).
  -- Mantemos `balance = current_invoice` (não impacta saldo consolidado).
  IF v_type = 'credit' THEN
    v_current_inv := v_sum_expense;
    UPDATE public.accounts
       SET current_invoice = v_current_inv,
           balance         = v_current_inv   -- espelha para compatibilidade legada
     WHERE id = p_account_id;
    RETURN;
  END IF;

  -- Demais tipos: balance = base + receitas - despesas + transf_in - transf_out
  v_new_balance := v_balance_base + v_sum_income - v_sum_expense + v_sum_xfer_in - v_sum_xfer_out;

  UPDATE public.accounts
     SET balance         = v_new_balance,
         current_invoice = 0
   WHERE id = p_account_id;
END;
$$;

COMMENT ON FUNCTION public.recalc_account_balance(uuid) IS
  'Recalcula `balance` e `current_invoice` de uma conta a partir das transações vinculadas. Idempotente e SECURITY DEFINER para bypass de RLS durante o recálculo.';

-- -----------------------------------------------------------------------------
-- 4) Trigger em transactions
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.txn_balance_aiud()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.recalc_account_balance(NEW.account_id);
    IF NEW.transfer_to_account_id IS NOT NULL
       AND NEW.transfer_to_account_id <> NEW.account_id THEN
      PERFORM public.recalc_account_balance(NEW.transfer_to_account_id);
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.recalc_account_balance(NEW.account_id);
    IF NEW.transfer_to_account_id IS NOT NULL
       AND NEW.transfer_to_account_id <> NEW.account_id THEN
      PERFORM public.recalc_account_balance(NEW.transfer_to_account_id);
    END IF;
    IF OLD.account_id IS DISTINCT FROM NEW.account_id THEN
      PERFORM public.recalc_account_balance(OLD.account_id);
    END IF;
    IF OLD.transfer_to_account_id IS DISTINCT FROM NEW.transfer_to_account_id
       AND OLD.transfer_to_account_id IS NOT NULL THEN
      PERFORM public.recalc_account_balance(OLD.transfer_to_account_id);
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_account_balance(OLD.account_id);
    IF OLD.transfer_to_account_id IS NOT NULL THEN
      PERFORM public.recalc_account_balance(OLD.transfer_to_account_id);
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_txn_balance ON public.transactions;
CREATE TRIGGER trg_txn_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.txn_balance_aiud();

-- -----------------------------------------------------------------------------
-- 5) View de leitura (expõe saldo efetivo e limite disponível)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.accounts_view AS
SELECT
    a.id,
    a.user_id,
    a.name,
    a.type,
    a.bank_name,
    a.color,
    a.card_brand,
    a.credit_limit,
    a.closing_day,
    a.due_day,
    a.last_four_digits,
    a.is_active,
    a.created_at,
    a.currency,
    a.current_invoice,
    CASE
      WHEN a.type = 'credit' THEN a.current_invoice
      ELSE a.balance
    END AS effective_balance,
    CASE
      WHEN a.type = 'credit' THEN GREATEST(COALESCE(a.credit_limit, 0) - a.current_invoice, 0)
      ELSE NULL
    END AS available_limit,
    CASE
      WHEN a.type = 'credit' AND COALESCE(a.credit_limit, 0) > 0
        THEN (a.current_invoice / a.credit_limit) * 100
      ELSE NULL
    END AS utilization_pct
  FROM public.accounts a;

COMMENT ON VIEW public.accounts_view IS
  'View de leitura com colunas derivadas (effective_balance, available_limit, utilization_pct) para uso no front-end.';

-- -----------------------------------------------------------------------------
-- 6) Backfill: recalcular tudo na publicação
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.accounts LOOP
    PERFORM public.recalc_account_balance(r.id);
  END LOOP;
END $$;
