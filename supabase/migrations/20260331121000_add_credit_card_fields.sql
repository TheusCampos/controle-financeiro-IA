ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS card_brand TEXT,
ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS closing_day INTEGER,
ADD COLUMN IF NOT EXISTS due_day INTEGER,
ADD COLUMN IF NOT EXISTS last_four_digits TEXT;

ALTER TABLE public.accounts
ADD CONSTRAINT accounts_credit_limit_check CHECK (credit_limit IS NULL OR credit_limit >= 0);

ALTER TABLE public.accounts
ADD CONSTRAINT accounts_closing_day_check CHECK (closing_day IS NULL OR closing_day BETWEEN 1 AND 31);

ALTER TABLE public.accounts
ADD CONSTRAINT accounts_due_day_check CHECK (due_day IS NULL OR due_day BETWEEN 1 AND 31);

ALTER TABLE public.accounts
ADD CONSTRAINT accounts_last_four_digits_check CHECK (
  last_four_digits IS NULL
  OR last_four_digits ~ '^[0-9]{4}$'
);
