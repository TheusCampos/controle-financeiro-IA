# 🚀 FinanceAI - Assistente Financeiro Inteligente

> Um ecossistema completo de gestão financeira com integração de Inteligência Artificial generativa (OpenAI, Anthropic, Gemini), desenhado com foco em segurança (Criptografia AES-256, RLS) e alta performance.

---

## ✨ Principais Funcionalidades

- **📊 Dashboard Interativo:** Visão global com gráficos dinâmicos de fluxo de caixa, despesas por categoria e limite de cartões de crédito.
- **🤖 Assistente IA Generativo:** Chatbot financeiro integrado capaz de ler recibos, categorizar despesas, gerar insights de economia e inserir lançamentos via comandos de linguagem natural.
- **� Gestão de Contas e Cartões:** Controle múltiplo de contas bancárias e cartões de crédito com cálculo automático de limite disponível e faturas.
- **🎯 Metas e Orçamentos:** Acompanhamento de progresso de metas financeiras e alertas de estouro de orçamento por categoria.
- **🛡️ Segurança Enterprise:** Arquitetura "Zero Trust" no frontend. Chaves de API encriptadas com AES-256 no client-side, Row Level Security (RLS) no Supabase e validação forte contra XSS e SQL Injection.

---

## 💰 Cálculo Automático de Saldo (Trigger `trg_txn_balance`)

Desde a migration `supabase/migrations/20260602_auto_balance.sql`, **toda transação** inserida, editada ou excluída recalcula automaticamente o saldo da conta via trigger PL/pgSQL — sem lógica adicional no front.

### Como funciona

- `accounts.balance` armazena o **saldo base** (ponto de partida antes das transações).
- `accounts.current_invoice` (novo) armazena a **fatura corrente** para `type='credit'`.
- A função `recalc_account_balance(uuid)` recomputa ambos a partir de `transactions`.
- O trigger `trg_txn_balance` dispara em `INSERT/UPDATE/DELETE` e recalcula a(s) conta(s) afetada(s).

### Regras

| Tipo de conta | `balance` representa | `current_invoice` |
|---|---|---|
| `checking` / `savings` / `investment` / `cash` | `base + Σ(income) - Σ(expense) + transf_in - transf_out` | `0` |
| `credit` | Σ despesas (espelha fatura) | Σ despesas do mês |

### View `accounts_view`

```sql
SELECT * FROM accounts_view;
-- effective_balance, available_limit, utilization_pct calculados automaticamente
```

### Aplicar a migration

```bash
# Supabase CLI
supabase db push
# ou via SQL Editor do Dashboard, executando o arquivo .sql manualmente
```

### Editar saldo base

Use **Configurações → Contas Financeiras → ícone de lápis** na conta desejada. O trigger recalcula o saldo efetivo imediatamente.

### Preview no modal de transação

Ao criar/editar uma transação, o [`TransactionModal`](file:///m:/DEV/DESENVOLVIMENTO/controle-financeiro/src/components/transactions/TransactionModal.tsx#L114-L137) mostra o **saldo projetado** antes de salvar (espelha a lógica do trigger no client via `lib/balance.ts`).

---

## �️ Stack Tecnológica

### Frontend
- **Framework:** React 18 + Vite (SWC/TypeScript)
- **Estilização:** Tailwind CSS + shadcn/ui + Radix UI (Acessibilidade)
- **State Management:** Zustand (com persistência segura local) + Context API
- **Validação de Dados:** Zod + DOMPurify (Sanitização XSS)
- **Charts:** Recharts

### Backend / Database
- **BaaS:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Auth (JWT, E-mail/Senha com Rate Limiting)
- **Segurança de Dados:** Row Level Security (RLS) nativa e Triggers de Integridade em PL/pgSQL

---

## 🚀 Como Iniciar (Quick Start)

### 1. Requisitos
- Node.js 18+
- Projeto no [Supabase](https://supabase.com) (Database + Auth ativados)

### 2. Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/controle-financeiro.git
cd controle-financeiro

# Instale as dependências
npm install
```

### 3. Configuração de Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (use o `.env.example` como base):

```env
# URL e Chave Pública do seu projeto Supabase (Frontend)
VITE_SUPABASE_URL="sua-url-aqui"
VITE_SUPABASE_PUBLISHABLE_KEY="sua-chave-anon-aqui"

# Chave secreta usada para criptografar as chaves de API da IA (AES-256) antes de irem pro Banco.
# ATENÇÃO: Se perder essa chave, as APIs salvas pelos usuários não poderão ser descriptografadas.
VITE_STORAGE_ENCRYPTION_KEY="uma-string-aleatoria-muito-forte-aqui"
```

### 4. Configuração do Banco de Dados (Supabase)
Execute todas as migrations que estão na pasta `/supabase/migrations/` diretamente no **SQL Editor** do seu painel do Supabase para criar as tabelas, triggers de segurança (RLS) e regras de negócio.

### 5. Executando Localmente

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:8080`.

---

## 🔐 Arquitetura de Segurança (Hardening)

- **Criptografia em Repouso:** Dados sensíveis (como chaves de IA) são encriptados usando `CryptoJS (AES-256)` no frontend antes do envio à API.
- **Proteção contra IDOR:** As tabelas (`transactions`, `accounts`, `profiles`, etc.) possuem **Row Level Security (RLS)**. É impossível um usuário acessar ou alterar dados de outro, mesmo manipulando requisições REST.
- **Prevenção de Mass Assignment:** Triggers PL/pgSQL bloqueiam tentativas de relacionar transações a categorias ou contas de terceiros (`check_transaction_ownership`).
- **Compliance com PCI-DSS:** O sistema não armazena PAN (Primary Account Number) nem CVV de cartões. Apenas os 4 últimos dígitos (`last_four_digits`).
- **Deploy Seguro:** Arquivos `vercel.json` e `netlify.toml` configurados com headers rigorosos: `Content-Security-Policy` (CSP), `Strict-Transport-Security` (HSTS) e `X-Frame-Options`.

### 🛡️ Modelo de Chaves & RLS — Por que a "anon key" aparece na aba Network

É comum, ao abrir o DevTools → Network na página `/auth`, ver a *publishable key* do Supabase (`apikey` / `Authorization: Bearer`) sendo enviada ao endpoint `POST /auth/v1/token`. **Isso é por design**, e o framework de segurança é o seguinte:

| Chave | Onde fica | Pode vazar? | Como é protegida |
|---|---|---|---|
| `VITE_SUPABASE_PUBLISHABLE_KEY` (anon) | **Obfuscada** no bundle (não literal) | Escondida de busca casual | RLS no banco + JWT de usuário |
| `VITE_STORAGE_ENCRYPTION_KEY` | Frontend + bundle JS | **Sim** | Ofuscação (defesa em profundidade). A proteção real é **RLS** |
| `service_role` key | **NUNCA** no frontend | Deve permanecer secreta | Não deve aparecer em código, bundle ou logs |
| Chave de IA (OpenAI / Anthropic / Gemini) | Hoje: navegador (TODO) | **Sim** | Deveria migrar para Edge Function |
| JWT de acesso do usuário | `localStorage` (Supabase) | Após login | RLS limita o que esse token pode ler/escrever |

> **Regra de ouro:** qualquer string com prefixo `VITE_` é compilada dentro do bundle JS e entregue ao navegador. Trate-as como **públicas**. Segredos reais vivem apenas em variáveis de servidor (Edge Functions, Supabase Vault) ou no banco, protegidos por RLS.

### 🎭 Ofuscação da publishable key (build-time)

A `VITE_SUPABASE_PUBLISHABLE_KEY` passa por um pipeline de ofuscação em **tempo de build**:

```
.env (VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...)
        │
        ▼  build-time (Vite plugin maskSupabaseKey)
  XOR + base64 + reverse + split  (com salt aleatório)
        │
        ▼
  bundle: { pieces: ["␟ABC", "␟DEF", "GHI"], salt: "9d69..." }
        │
        ▼  runtime (src/lib/maskedSupabaseKey.ts)
  decoder reconstrói a chave na memória
        │
        ▼
  supabase.auth.signInWithPassword(...)
```

**O que Ganha:**
- A string `eyJhbGciOi...` **não aparece** no bundle de produção (verificado por teste automatizado).
- A string `VITE_SUPABASE_PUBLISHABLE_KEY` **não aparece** em lugar nenhum do bundle.
- Busca casual no DevTools → Sources não revela a chave.
- Cada build gera um salt novo → payloads diferentes para a mesma chave.

**O que NÃO Ganha (seja honesto):**
- ⛔ **Não é segurança real.** A lógica de decode está no próprio bundle. Quem reverter o fluxo (não é trivial, mas é factível) recupera a chave.
- ⛔ Não substitui RLS no Supabase.
- ⛔ Não substitui proxy reverso / Edge Function para chaves de IA.
- ⛔ Não protege a chave durante a transmissão (ela é usada em runtime, ainda aparece em headers de request no DevTools → Network — porque essa é a única forma do cliente se autenticar com o Supabase).

**Quando migrar para proxy reverso:** se o seu modelo de ameaça incluir "atacante dedicado com tempo e conhecimento para reverter o bundle", troque esta solução por uma Edge Function (Supabase) ou Serverless Function (Vercel/Netlify) que adicione a chave no servidor. O esqueleto já está documentado em `src/services/aiProviders.ts`.

### 🔒 Headers de segurança aplicados (Vercel + Netlify)

- `Content-Security-Policy` com `connect-src` restrito às origens realmente usadas (`*.supabase.co`, `api.openai.com`, `api.anthropic.com`, `generativelanguage.googleapis.com`).
- `frame-ancestors 'none'`, `object-src 'none'`, `form-action 'self'`, `base-uri 'self'`.
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` negando `camera`, `microphone`, `geolocation`, `payment`, `usb`.
- `Cross-Origin-Opener-Policy` e `Cross-Origin-Resource-Policy` em `same-origin`.

### 🧪 Testes de regressão de segredo

Em `src/test/security-api-key-leak.test.ts` rodam verificações automatizadas que **quebram o build** se alguém, no futuro:

1. Hardcodar uma chave de produção (`sk-...`, `AIza...`, `ghp_...`, JWT real) em `src/`.
2. Referenciar `service_role` / `SUPABASE_SERVICE_ROLE` no cliente.
3. Afrouxar a CSP para `connect-src https:` (wildcard).
4. Esquecer de incluir `frame-ancestors 'none'` ou `object-src 'none'`.
5. Reduzir a chave de cifragem local para menos de 16 caracteres (ela vira no-op).

Rode localmente:

```bash
npm run test -- src/test/security-api-key-leak.test.ts
```

### 📜 Reportando vulnerabilidades

Achou um problema de segurança? **Não abra issue pública.** Envie um e-mail para `security@empresa.com` (ou canal interno equivalente) com:

- Descrição técnica + passos de reprodução.
- Impacto (Tier 1/2/3 do framework interno).
- Sugestão de mitigação, se houver.

Veja `src/test/security-api-key-leak.test.ts` para o conjunto atual de invariantes de segurança.

---

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento.
- `npm run build` - Gera o build otimizado para produção.
- `npm run lint` - Verifica o código com ESLint.
- `npm run test` - Executa a suíte de testes unitários (Vitest).
- `npm run verify` - Executa Lint, Typecheck, Testes e Build em sequência (Gatilho de CI).

---

## 📄 Licença

Este projeto está sob a licença MIT. Feito para ajudar a ter uma vida financeira mais inteligente e tranquila.
