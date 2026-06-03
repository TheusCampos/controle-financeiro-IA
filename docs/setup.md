# Configuração e Instalação - Smart Finance Assistant

Este guia detalha como configurar e rodar o projeto **Smart Finance Assistant** localmente.

## 📋 Requisitos

- **Node.js:** Versão 18.0 ou superior (ou **Bun** 1.0+)
- **NPM/Yarn/PNPM/Bun:** Gerenciador de pacotes
- **Supabase Account:** Conta gratuita no Supabase (para o banco de dados e autenticação)

---

## 🚀 Passo a Passo

### 1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/smart-finance-assistant.git
cd smart-finance-assistant
```

### 2. Instalar Dependências
```bash
npm install
# ou se usar Bun:
bun install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-supabase
```

### 4. Configurar o Supabase
1. Crie um novo projeto no [Supabase Dashboard](https://database.new).
2. Execute os scripts de migração localizados em `supabase/migrations/*.sql` no **SQL Editor** do Supabase para criar as tabelas e políticas de segurança.
3. Habilite a autenticação por **Email/Senha** nas configurações de Auth.

### 5. Rodar o Projeto (Desenvolvimento)
```bash
npm run dev
```
O projeto estará disponível em `http://localhost:5173`.

---

## 🛠️ Comandos Úteis

- `npm run build`: Gera o build de produção na pasta `dist`.
- `npm run lint`: Executa o ESLint para verificar erros de código.
- `npm run test`: Executa os testes unitários via Vitest.
- `npm run preview`: Roda o servidor localmente com o build de produção.

---

## 🛡️ Segurança (RLS)

Este projeto utiliza **Row Level Security** em todas as tabelas. Isso significa que as queries no frontend (`supabase.from('transactions').select('*')`) retornarão automaticamente apenas os dados pertencentes ao usuário autenticado. Certifique-se de não desabilitar o RLS em produção.
