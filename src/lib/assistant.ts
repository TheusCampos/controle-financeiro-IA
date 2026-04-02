import { z } from 'zod';

export interface AssistantMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ParsedLaunchCommand {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  date: string;
  categoryId?: string;
  accountId?: string;
}

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_FILE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

export const AssistantMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(12000),
}) as z.ZodType<AssistantMessage>;

export const AssistantMessagesSchema = z.array(AssistantMessageSchema).min(1);

const LaunchCommandSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive(),
  description: z.string().min(2).max(180),
  date: z.string().default(() => new Date().toISOString().slice(0, 10)),
  categoryId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
});

export function createInitialAssistantMessage(): AssistantMessage {
  return {
    role: 'assistant',
    content: 'Olá! Sou seu Assistente Financeiro IA. Como posso te ajudar a analisar seus gastos e atingir suas metas hoje?',
  };
}

export function makeConversationTitle(messages: AssistantMessage[]) {
  const firstUser = messages.find((msg) => msg.role === 'user');
  if (!firstUser) {
    return 'Nova conversa';
  }
  return firstUser.content.trim().slice(0, 80) || 'Nova conversa';
}

export function validateFileForAssistant(file: File) {
  if (!ALLOWED_FILE_TYPES.has(file.type)) {
    return { valid: false, error: 'Tipo de arquivo não permitido.' };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { valid: false, error: 'Arquivo excede o limite de 10MB.' };
  }
  return { valid: true };
}

export function canUseAiAction(role: string | null | undefined, email?: string) {
  if (email === 'matheuscampos2067@gmail.com') return true;
  
  const normalized = (role || '').toLowerCase();
  return normalized === 'admin' || normalized === 'owner' || normalized === 'editor';
}

export function parseLaunchCommand(input: string): ParsedLaunchCommand | null {
  if (!input.trim().startsWith('/lancamento')) {
    return null;
  }

  const args = input.replace('/lancamento', '').trim();
  const pairs = args.match(/(\w+)=(".*?"|\S+)/g) || [];
  const data: Record<string, string> = {};

  (pairs as string[]).forEach((pair) => {
    const [rawKey, ...rawValueParts] = pair.split('=');
    if (!rawKey || rawValueParts.length === 0) {
      return;
    }
    const rawValue = rawValueParts.join('=').trim();
    data[rawKey] = rawValue.replace(/^"|"$/g, '');
  });

  const result = LaunchCommandSchema.safeParse({
    type: data.type,
    amount: data.amount ? Number(data.amount) : undefined,
    description: data.descricao || data.description,
    date: data.data || data.date,
    categoryId: data.categoryId,
    accountId: data.accountId,
  });

  if (!result.success) {
    return null;
  }

  return result.data as ParsedLaunchCommand;
}

export function parseAiAction(text: string): ParsedLaunchCommand | null {
  try {
    // Busca por um bloco JSON dentro da resposta da IA
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (!jsonMatch) return null;

    const data = JSON.parse(jsonMatch[1]);
    
    if (data.action === 'lancamento') {
      return {
        type: data.type,
        amount: Number(data.amount),
        description: data.description || 'Lançamento IA',
        date: data.date || new Date().toISOString().slice(0, 10), // data atual se não enviar
        categoryId: data.categoryId || undefined,
        accountId: data.accountId || undefined,
      };
    }
    return null;
  } catch (error) {
    console.error("Falha ao parsear ação da IA", error);
    return null;
  }
}

export async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

export async function fileToTextPreview(file: File) {
  if (file.type === 'text/plain') {
    const text = await file.text();
    return text.slice(0, 8000);
  }
  return '';
}

export function extractOpenAiDelta(payload: unknown) {
  if (!payload || typeof payload !== 'object' || !('choices' in payload) || !Array.isArray(payload.choices)) {
    return '';
  }

  const first = payload.choices[0];
  if (!first || typeof first !== 'object' || !('delta' in first)) {
    return '';
  }

  const delta = first.delta;
  if (!delta || typeof delta !== 'object' || !('content' in delta) || typeof delta.content !== 'string') {
    return '';
  }

  return delta.content;
}

export function extractGeminiDelta(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  // Gemini stream payload can be an array or a single object with candidates
  const data = Array.isArray(payload) ? payload[0] : payload;

  if (!data || typeof data !== 'object') {
    return '';
  }

  // Handle Gemini error response in the payload
  if ('error' in data && data.error && typeof data.error === 'object' && 'message' in data.error) {
    return `[Erro do Provedor: ${data.error.message}]`;
  }

  if (!('candidates' in data) || !Array.isArray(data.candidates)) {
    return '';
  }

  return data.candidates
    .map((candidate) => {
      if (!candidate || typeof candidate !== 'object' || !('content' in candidate)) {
        return '';
      }
      const content = candidate.content;
      if (!content || typeof content !== 'object' || !('parts' in content) || !Array.isArray(content.parts)) {
        return '';
      }
      return content.parts
        .map((part) => (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string' ? part.text : ''))
        .join('');
    })
    .join('');
}

export async function consumeSseStream(
  response: Response,
  onDelta: (delta: string) => void,
  extractor: (payload: unknown) => string
) {
  const reader = response.body?.getReader();
  if (!reader) {
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // Split by any newline sequence (OpenAI uses \n\n, Gemini might use \n)
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop() || '';

      for (const part of parts) {
        const lines = part.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') continue;

          try {
            const payload = JSON.parse(data);
            const delta = extractor(payload);
            if (delta) {
              onDelta(delta);
            }
          } catch (e) {
            console.warn('Falha ao processar chunk SSE:', e, data);
            continue;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
