# Funcionalidades Principais - Smart Finance Assistant

O **Smart Finance Assistant** oferece um conjunto robusto de ferramentas para controle e planejamento financeiro pessoal.

## 📈 1. Dashboard de Controle
O dashboard é o ponto de partida do usuário, oferecendo uma visão 360º de suas finanças.
- **KPI Cards:** Visualização rápida de Saldo Total, Receita Mensal, Despesas Mensais e Taxa de Poupança (Savings Rate).
- **Fluxo de Caixa (Gráfico):** Comparativo mensal entre entradas e saídas nos últimos 6 meses.
- **Gastos por Categoria (Gráfico):** Gráfico de rosca detalhando onde o dinheiro está sendo gasto no mês atual.
- **Transações Recentes:** Lista rápida dos últimos 5 lançamentos.
- **Status de Orçamento:** Barra de progresso mostrando quanto do orçamento mensal já foi consumido.

## 💸 2. Gestão de Transações
O sistema permite o registro completo de todas as movimentações financeiras.
- **Categorização Inteligente:** Lançamentos vinculados a categorias personalizáveis (Alimentação, Transporte, Lazer, etc).
- **Contas Múltiplas:** Suporte para diferentes fontes de recursos (Conta Corrente, Dinheiro, Investimentos).
- **Recorrência:** Configuração de transações automáticas mensais, semanais ou anuais.
- **Tags e Notas:** Possibilidade de adicionar palavras-chave e observações detalhadas para melhor busca.
- **Anexos:** Upload de comprovantes (opcional, via Supabase Storage).

## 📅 3. Planejamento de Orçamentos (Budgets)
Ferramenta para definir limites de gastos e evitar surpresas no fim do mês.
- **Limites por Categoria:** Definição de quanto pode ser gasto em cada categoria (Ex: R$ 500 em Lazer).
- **Alertas de Consumo:** Notificação visual quando o gasto atinge um limiar (Ex: 80% do limite).
- **Validade Temporal:** Orçamentos que podem ser mensais ou de períodos específicos.

## 🎯 4. Metas Financeiras (Goals)
Acompanhamento de objetivos de médio e longo prazo.
- **Acompanhamento de Progresso:** Barra de progresso baseada no valor atual vs valor alvo.
- **Priorização:** Classificação de metas por importância (Baixa, Média, Alta).
- **Prazos:** Definição de datas limite para atingir os objetivos.
- **Status:** Controle de metas ativas, concluídas ou canceladas.

## 📊 5. Relatórios e Análises
Visualizações detalhadas para auditoria das finanças.
- **Filtros Avançados:** Busca por data, categoria, conta ou tags.
- **Exportação:** Possibilidade de exportar dados para PDF/CSV (jspdf-autotable).

## ⚙️ 6. Configurações e Personalização
Um centro de controle centralizado para adaptar a experiência às necessidades do usuário.
- **Perfil do Usuário:** Gerenciamento de nome e visualização de e-mail da conta.
- **Gestão de Contas:** Adição e exclusão de múltiplas contas financeiras com saldos iniciais.
- **Categorias Customizáveis:** Criação de categorias com cores e ícones para organizar fluxos de receita e despesa.
- **Layout por Abas:** Navegação intuitiva que separa configurações gerais de gestão de dados financeiros.

## 🤖 7. Assistente de IA
O diferencial do sistema é o uso de Inteligência Artificial para atuar como seu assistente virtual pessoal, realizando consultas e análises profundas dos seus gastos.
- **Análise Contextualizada:** O assistente tem acesso a um *snapshot* (fotografia) dos seus dados financeiros atuais, garantindo que as respostas sejam altamente precisas e baseadas na sua realidade.
- **Consultas em Linguagem Natural:** O usuário pode conversar naturalmente para perguntar sobre seus gastos, identificar tendências de consumo e pedir conselhos práticos de economia.
- **Configuração Flexível de Provedores:** O sistema permite total liberdade na escolha da IA nas configurações. O usuário pode configurar sua própria chave de API (API Key) do provedor de sua preferência.
- **Personalização de Prompt:** Você decide como a IA deve se comportar. É possível configurar um prompt de sistema personalizado, definindo o tom de voz, o formato das respostas e as diretrizes que a IA deve seguir para que a interação seja exatamente do seu jeito.
