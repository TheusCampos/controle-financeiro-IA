import { AI_MODELS } from '@/config/aiModels';
import {
  consumeSseStream,
  extractOpenAiDelta,
  extractGeminiDelta,
  fileToBase64,
} from '@/lib/assistant';
import type { AIProvider } from '@/config/aiModels';
import type { Message } from '@/types/assistant';

// TODO: mover para proxy backend (Edge Function no Supabase) para não expor API keys no cliente

type StreamCallback = (delta: string) => void;

interface ProviderOptions {
  messages: Message[];
  systemContext: string;
  apiKey: string;
  onDelta: StreamCallback;
  file?: File | null;
}

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const errorData = await response.json();
    if (typeof errorData?.error?.message === 'string') return errorData.error.message;
  } catch {
    return fallback;
  }
  return fallback;
}

async function sendToOpenAI({ messages, systemContext, apiKey, onDelta }: ProviderOptions): Promise<string> {
  const apiMessages = [
    { role: 'system', content: systemContext },
    ...messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content })),
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: AI_MODELS.openai, messages: apiMessages, stream: true }),
  });

  if (!res.ok) throw new Error(await readErrorMessage(res, 'Erro na OpenAI'));

  let reply = '';
  await consumeSseStream(
    res,
    (delta) => { reply += delta; onDelta(delta); },
    extractOpenAiDelta
  );
  return reply;
}

async function sendToGemini({ messages, systemContext, apiKey, onDelta, file }: ProviderOptions): Promise<string> {
  const geminiHistory: GeminiContent[] = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  if (file) {
    const base64 = await fileToBase64(file);
    const lastItem = geminiHistory[geminiHistory.length - 1];
    const userText = (lastItem?.parts?.[0] as { text?: string })?.text ?? '';
    geminiHistory[geminiHistory.length - 1] = {
      role: 'user',
      parts: [{ text: userText }, { inlineData: { mimeType: file.type, data: base64 } }],
    };
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODELS.gemini}:streamGenerateContent?alt=sse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemContext }] },
        contents: geminiHistory,
        generationConfig: {
          temperature: 0.4,
        },
      }),
    }
  );

  if (!res.ok) throw new Error(await readErrorMessage(res, 'Erro no Gemini'));

  let reply = '';
  await consumeSseStream(
    res,
    (delta) => { reply += delta; onDelta(delta); },
    extractGeminiDelta
  );
  return reply;
}

async function sendToAnthropic({ messages, systemContext, apiKey, onDelta }: ProviderOptions): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: AI_MODELS.anthropic,
      max_tokens: 1000,
      system: systemContext,
      messages: messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) throw new Error(await readErrorMessage(res, 'Erro na Anthropic'));

  const data = await res.json();
  const reply = typeof data?.content?.[0]?.text === 'string' ? data.content[0].text : '';
  if (reply) onDelta(reply); // notifica o caller mesmo sem streaming
  return reply;
}

// Padrão Strategy: adicionar provider = 1 nova função + 1 linha no mapa
const PROVIDERS: Record<AIProvider, (opts: ProviderOptions) => Promise<string>> = {
  openai: sendToOpenAI,
  gemini: sendToGemini,
  anthropic: sendToAnthropic,
};

export async function callAIProvider(
  provider: AIProvider,
  messages: Message[],
  systemContext: string,
  apiKey: string,
  onDelta: StreamCallback,
  file?: File | null
): Promise<string> {
  const fn = PROVIDERS[provider];
  if (!fn) throw new Error('Provedor não suportado.');
  return fn({ messages, systemContext, apiKey, onDelta, file });
}
