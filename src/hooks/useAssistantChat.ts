import { useState, useRef, type Dispatch, type SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { parseLaunchCommand, parseAiAction } from '@/lib/assistant';
import { fetchFinancialSnapshot } from '@/lib/assistantDb';
import { callAIProvider } from '@/services/aiProviders';
import type { AIProvider } from '@/config/aiModels';
import type { Json } from '@/integrations/supabase/types';
import type { Message, PendingAction } from '@/types/assistant';

interface UseAssistantChatParams {
  user: User | null;
  provider: AIProvider;
  apiKey: string;
  systemPrompt: string;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  save: (msgs: Message[], snapshot: Json | null) => Promise<void>;
  selectedFile: File | null;
  textPreview: string;
  clearSelectedFile: () => void;
  setPendingAction: (action: PendingAction | null) => void;
}

const ERROR_REPLY =
  'Desculpe, ocorreu um erro ao processar sua mensagem. Verifique sua configuração e tente novamente.';

export function useAssistantChat({
  user,
  provider,
  apiKey,
  systemPrompt,
  messages,
  setMessages,
  save,
  selectedFile,
  textPreview,
  clearSelectedFile,
  setPendingAction,
}: UseAssistantChatParams) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // Bug fix: useRef evita índice stale do assistente em streams longos
  const assistantIndexRef = useRef<number>(-1);

  const handleSend = async () => {
    // Bug fix: guard de loading previne reenvio duplo
    if (!input.trim() || loading) return;
    if (!apiKey) {
      toast.error('Por favor, configure sua Chave de API nas Configurações primeiro.');
      return;
    }

    const trimmedInput = input.trim();

    // Fluxo de lançamento (/lancamento ...)
    const launchCommand = parseLaunchCommand(trimmedInput);
    if (launchCommand) {
      const userMessage: Message = { role: 'user', content: trimmedInput };
      const nextMessages = [...messages, userMessage];
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: `Confirma lançamento ${launchCommand.type} no valor de R$ ${launchCommand.amount.toFixed(2)} com descrição "${launchCommand.description}"?`,
        },
      ]);
      setInput('');
      setPendingAction({ id: crypto.randomUUID(), command: launchCommand, expiresAt: Date.now() + 15000 });
      await save(nextMessages, null);
      return;
    }

    // Fluxo de chat normal
    const userMessage: Message = { role: 'user', content: trimmedInput };
    const chatHistory = [...messages, userMessage];
    assistantIndexRef.current = chatHistory.length;
    setMessages([...chatHistory, { role: 'assistant', content: '' }]);
    setInput('');
    setLoading(true);

    try {
      if (!user) throw new Error('Usuário não autenticado.');

      const isOcrTarget = Boolean(
        selectedFile && (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf')
      );
      if (isOcrTarget && provider !== 'gemini') {
        throw new Error('Para OCR de imagem/PDF, selecione o provedor Gemini.');
      }

      const snapshot = await fetchFinancialSnapshot(user.id);

      const systemContext = `${systemPrompt}

Contexto financeiro real do usuário logado:
Usuário: ${user.user_metadata?.full_name || user.email}
Contas: ${JSON.stringify(snapshot.accounts)}
Categorias: ${JSON.stringify(snapshot.categories)}
Orçamentos: ${JSON.stringify(snapshot.budgets)}
Metas: ${JSON.stringify(snapshot.goals)}
Últimas 30 Transações: ${JSON.stringify(snapshot.recent_transactions)}
Arquivo anexado: ${selectedFile ? `${selectedFile.name} (${selectedFile.type})` : 'nenhum'}
Trecho de texto do anexo: ${textPreview || 'n/a'}

REGRAS DE AUTONOMIA E LANÇAMENTOS (AGENTIC AI):
Você tem permissão para preparar lançamentos financeiros.

Se o usuário pedir para registrar um ganho, despesa ou transferência, SIGA ESTES PASSOS:

PASSO 1: Verifique se o usuário informou a Conta, a Categoria e uma Descrição clara.
PASSO 2: Se FALTAR alguma dessas 3 informações (Conta, Categoria ou Descrição), pergunte ao usuário quais são. (ex: "Qual conta e categoria devo usar para esse lançamento de R$ 50?"). Não gere o JSON ainda.
PASSO 3: Se o usuário já tiver informado ou se ele disser que "pode lançar sem", "não precisa", "pode ser na principal", etc, ENTÃO você DEVE gerar APENAS o bloco JSON abaixo.

Formato do JSON de ação:
\`\`\`json
{
  "action": "lancamento",
  "type": "income", // ou "expense" ou "transfer"
  "amount": 2000.00,
  "description": "Salário",
  "categoryId": "uuid-da-categoria", // opcional, tente inferir pelo nome
  "accountId": "uuid-da-conta", // opcional, tente inferir pelo nome
  "date": "2026-04-01" // use o formato YYYY-MM-DD
}
\`\`\`

Lembre-se: Use os UUIDs reais de 'Contas' e 'Categorias' presentes no contexto financeiro acima.
NÃO escreva mais nenhum texto além do bloco JSON se estiver executando a ação (PASSO 3). Se não for a execução final (ex: perguntando os dados que faltam), responda normalmente em português.

Regras adicionais de comunicação (Foco em clareza, humanização e economia de tokens):
1) Seja EXTREMAMENTE conciso e vá direto ao ponto. Elimine introduções longas, saudações repetitivas ou conclusões genéricas (ex: "espero ter ajudado").
2) Responda em português do Brasil com um tom natural e humanizado, mas sem "enrolação".
3) Para fazer perguntas, faça uma única pergunta clara e objetiva.
4) Se o usuário perguntar algo direto, responda com o dado exato em poucas palavras. Não repita a pergunta na resposta.
5) Use bullet points curtos se precisar listar algo.
6) Se houver anexo de imagem ou PDF, faça OCR e use o texto extraído apenas para a análise (não reescreva o que extraiu).
7) Minimize a geração de tokens ao máximo mantendo apenas a informação essencial e útil.`;

      const updateAssistant = (content: string) => {
        setMessages((prev) =>
          prev.map((msg, idx) =>
            idx === assistantIndexRef.current ? { role: 'assistant', content } : msg
          )
        );
      };

      let accumulated = '';
      const onDelta = (delta: string) => {
        accumulated += delta;
        updateAssistant(accumulated);
      };

      const finalReply = await callAIProvider(provider, chatHistory, systemContext, apiKey, onDelta, selectedFile);

      const aiAction = parseAiAction(finalReply);

      if (aiAction) {
        setPendingAction({ id: crypto.randomUUID(), command: aiAction, expiresAt: Date.now() + 15000 });
        
        const actionTypeMap: Record<string, string> = { income: 'ganho', expense: 'despesa', transfer: 'transferência' };
        const actionTypePt = actionTypeMap[aiAction.type] || aiAction.type;
        
        const actionMsg = `Entendi! Confirma o lançamento de ${actionTypePt} no valor de R$ ${aiAction.amount.toFixed(2)} referente a "${aiAction.description}"?`;
        
        updateAssistant(actionMsg);
        await save([...chatHistory, { role: 'assistant', content: actionMsg }], snapshot as unknown as Json);
        clearSelectedFile();
        return;
      }

      if (!finalReply.trim()) {
        const msg = 'A IA não conseguiu gerar uma resposta. Tente reformular sua pergunta ou verifique as configurações do modelo/API.';
        updateAssistant(msg);
        await save([...chatHistory, { role: 'assistant', content: msg }], snapshot as unknown as Json);
        clearSelectedFile();
        throw new Error(msg);
      }

      // Garante que o estado final está sincronizado (importante para Anthropic sem streaming)
      updateAssistant(finalReply);
      await save([...chatHistory, { role: 'assistant', content: finalReply }], snapshot as unknown as Json);
      clearSelectedFile();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Falha ao se comunicar com a IA';
      
      let userFriendlyMessage = ERROR_REPLY;
      const lowerCaseMessage = message.toLowerCase();

      if (lowerCaseMessage.includes('quota') || message.includes('429')) {
        userFriendlyMessage = 'A cota gratuita da API foi excedida. Por favor, aguarde um momento ou verifique o faturamento do seu provedor de IA.';
      } else if (lowerCaseMessage.includes('high demand') || message.includes('503')) {
        userFriendlyMessage = 'O modelo de IA está sobrecarregado no momento. Por favor, tente novamente em alguns instantes.';
      } else if (message) {
        userFriendlyMessage = `Erro: ${message}`;
      }

      toast.error(userFriendlyMessage);
      setMessages((prev) => {
        const idx = assistantIndexRef.current;
        if (prev.length > idx && prev[idx]?.role === 'assistant' && prev[idx]?.content === '') {
          return prev.map((msg, i) => (i === idx ? { role: 'assistant', content: userFriendlyMessage } : msg));
        }
        return [...prev, { role: 'assistant', content: userFriendlyMessage }];
      });
    } finally {
      setLoading(false);
    }
  };

  return { input, setInput, loading, handleSend };
}
