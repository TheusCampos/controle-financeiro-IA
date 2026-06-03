# Esquema do Banco de Dados - Smart Finance Assistant

O banco de dados é hospedado no **Supabase (PostgreSQL)** e utiliza Row Level Security (RLS) para garantir que cada usuário só acesse seus próprios dados.

## 📊 Tabelas

### 1. `profiles`
Contém as configurações globais e o perfil do usuário.
- `id` (uuid, PK): ID do usuário (Auth.uid())
- `full_name` (text): Nome completo do usuário
- `avatar_url` (text): Link para foto do perfil
- `currency` (text): Moeda preferencial (BRL, USD, etc)
- `locale` (text): Localização do usuário (pt-BR, en-US)
- `monthly_income` (numeric): Renda mensal estimada
- `ai_provider` (text): Provedor de IA preferencial (OpenAI, Anthropic, etc)
- `ai_model` (text): Modelo de IA preferencial (gpt-4o, claude-3-5-sonnet, etc)
- `created_at`, `updated_at` (timestamp)

### 2. `accounts`
Contas financeiras cadastradas.
- `id` (uuid, PK)
- `user_id` (uuid, FK -> profiles.id)
- `name` (text): Nome da conta (Ex: Banco do Brasil, Dinheiro, NuBank)
- `type` (text): Tipo de conta (checking, savings, credit, investment, cash)
- `balance` (numeric): Saldo atual da conta
- `currency` (text): Moeda da conta
- `bank_name` (text): Nome do banco emissor
- `card_brand` (text): Bandeira do cartão (se tipo 'credit')
- `closing_day` (int): Dia de fechamento da fatura (se tipo 'credit')
- `due_day` (int): Dia de vencimento da fatura (se tipo 'credit')
- `last_four_digits` (text): Últimos 4 dígitos do cartão
- `credit_limit` (numeric): Limite de crédito (se tipo 'credit')
- `color` (text): Cor de identificação na UI
- `is_active` (boolean): Status da conta

### 3. `categories`
Categorias para classificação de transações.
- `id` (uuid, PK)
- `user_id` (uuid, FK -> profiles.id)
- `name` (text): Nome da categoria (Ex: Alimentação, Lazer, Salário)
- `type` (text): Tipo de categoria (income, expense)
- `icon` (text): Nome do ícone (Lucide Icon name)
- `color` (text): Cor hexadecimal
- `is_default` (boolean): Se é uma categoria padrão do sistema

### 4. `transactions`
Registros individuais de receitas e despesas.
- `id` (uuid, PK)
- `user_id` (uuid, FK -> profiles.id)
- `account_id` (uuid, FK -> accounts.id)
- `category_id` (uuid, FK -> categories.id)
- `amount` (numeric): Valor da transação
- `type` (text): Tipo (income, expense, transfer)
- `date` (date): Data do lançamento
- `description` (text): Breve descrição
- `notes` (text): Observações detalhadas
- `attachment_url` (text): Link para comprovante/foto
- `is_recurring` (boolean): Se é uma conta recorrente
- `recurring_interval` (text): Intervalo de recorrência (monthly, weekly, yearly, etc)
- `tags` (text[]): Lista de tags (Array de strings)
- `created_at` (timestamp)

### 5. `budgets`
Planejamento de limites de gastos por categoria.
- `id` (uuid, PK)
- `user_id` (uuid, FK -> profiles.id)
- `category_id` (uuid, FK -> categories.id)
- `name` (text): Nome do orçamento
- `limit_amount` (numeric): Valor limite mensal
- `period` (text): Período (monthly, weekly, yearly)
- `start_date`, `end_date` (date): Validade do orçamento
- `alert_threshold` (numeric): Porcentagem de alerta (Ex: 80 para 80%)
- `is_active` (boolean)

### 6. `financial_goals`
Metas de economia a longo prazo.
- `id` (uuid, PK)
- `user_id` (uuid, FK -> profiles.id)
- `title` (text): Nome da meta (Ex: Carro Novo, Reserva de Emergência)
- `description` (text): Descrição detalhada
- `target_amount` (numeric): Valor total desejado
- `current_amount` (numeric): Valor já economizado
- `deadline` (date): Data limite para atingir a meta
- `status` (text): Status (active, completed, cancelled)
- `priority` (text): Prioridade (low, medium, high)
- `category` (text): Categoria da meta

### 7. `ai_conversations`
Histórico de interações com o assistente de IA.
- `id` (uuid, PK)
- `user_id` (uuid, FK -> profiles.id)
- `title` (text): Título da conversa
- `messages` (jsonb): Array de mensagens (role, content)
- `context_snapshot` (jsonb): Snapshot do estado financeiro no momento da conversa
- `created_at`, `updated_at` (timestamp)

---

## 🔗 Relacionamentos Principais

- **Transação -> Conta:** Uma transação pertence a uma conta específica (`account_id`).
- **Transação -> Categoria:** Uma transação é classificada em uma categoria (`category_id`).
- **Orçamento -> Categoria:** Orçamentos são vinculados a categorias para monitorar gastos por tipo.
- **Perfil -> Tudo:** Todos os registros possuem um `user_id` para filtragem via Row Level Security (RLS).
