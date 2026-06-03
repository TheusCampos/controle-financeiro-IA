# Arquitetura do Sistema - Smart Finance Assistant

O **Smart Finance Assistant** é uma aplicação web moderna de página única (SPA) baseada em React e Vite, utilizando uma arquitetura de Backend-as-a-Service (BaaS) via Supabase.

## 🚀 Tecnologias Core

### Frontend
- **Framework:** React 18+ com TypeScript
- **Bundler:** Vite
- **Estilização:** Tailwind CSS + Shadcn UI (Componentes Radix UI)
- **Design System:** Baseado em **Glassmorphism** e **Bento Grid** para uma interface moderna e limpa.
- **Gerenciamento de Estado:** Zustand (para autenticação e estados globais)
- **Roteamento:** React Router DOM v6
- **Validação de Formulários:** React Hook Form + Zod
- **Gráficos:** Recharts
- **Iconografia:** Lucide Icons
- **Animações:** Framer Motion (para transições suaves e estados de entrada)

### Backend & Banco de Dados
- **Plataforma:** Supabase
- **Banco de Dados:** PostgreSQL (com suporte a RLS - Row Level Security)
- **Autenticação:** Supabase Auth (JWT, OAuth, Email/Senha)
- **Storage:** Supabase Storage para anexos de transações (opcional)

---

## 📂 Estrutura de Pastas

```text
/src
  /components
    /auth         -> Componentes de proteção de rotas e autenticação
    /dashboard    -> KPIs, Gráficos e listas do dashboard
    /layout       -> AppLayout e navegação lateral
    /transactions -> Modais e formulários de transação
    /ui           -> Componentes base do Shadcn UI (buttons, inputs, etc)
  /hooks          -> Hooks customizados (useAuth, useMobile, useToast)
  /integrations   -> Cliente e tipos gerados do Supabase
  /lib            -> Utilitários de formatação, validação e funções comuns
  /pages          -> Páginas principais (Dashboard, Transações, Metas, etc)
  /store          -> Estados globais via Zustand (authStore)
  /types          -> Definições de tipos TypeScript (finance.ts)
/supabase
  /migrations     -> Scripts SQL de evolução do banco de dados
```

---

## 🔄 Fluxo de Dados

1. **Autenticação:** O usuário se autentica via Supabase Auth, e o estado é persistido no `authStore`.
2. **Data Fetching:** Os componentes utilizam o cliente Supabase para buscar dados diretamente do PostgreSQL, respeitando as políticas de RLS.
3. **Estado Local:** Mudanças na interface (filtros, modais abertos) são gerenciadas localmente no React, enquanto dados persistentes são atualizados via `supabase.from().update()`.

---

## 🏗️ Fluxo Funcional do Sistema

O sistema opera seguindo um fluxo lógico de gestão financeira:

### 1. Onboarding e Configuração
- Ao criar uma conta, um **Perfil (`profile`)** é gerado automaticamente.
- O usuário deve cadastrar suas **Contas (`accounts`)** (ex: Banco, Dinheiro, Cartão) e **Categorias (`categories`)** (ex: Alimentação, Lazer).

### 2. Ciclo de Transações
- Cada **Transação (`transaction`)** deve estar vinculada a uma Conta e uma Categoria.
- **Impacto no Saldo:** Atualmente, o saldo da conta (`account.balance`) é um campo persistido que deve ser atualizado quando uma transação é criada, editada ou excluída.
- **Tipos de Transação:**
    - `income`: Aumenta o saldo da conta.
    - `expense`: Diminui o saldo da conta.
    - `transfer`: (Futuro) Movimenta saldo entre duas contas.

### 3. Planejamento e Monitoramento
- **Orçamentos (`budgets`):** O sistema compara a soma das despesas de uma categoria no período atual com o limite definido no orçamento.
- **Metas (`financial_goals`):** O usuário registra o progresso manualmente ou o sistema calcula com base em transações marcadas como "poupança" (dependendo da implementação).

### 4. Inteligência Artificial
- O sistema captura snapshots dos dados financeiros (`context_snapshot`) e os envia para o assistente de IA, permitindo análises contextuais e recomendações personalizadas baseadas no histórico real do usuário.
