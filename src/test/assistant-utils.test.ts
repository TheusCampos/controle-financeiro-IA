import { describe, expect, it } from 'vitest';
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_BYTES,
  canUseAiAction,
  consumeSseStream,
  createInitialAssistantMessage,
  extractGeminiDelta,
  extractOpenAiDelta,
  fileToBase64,
  fileToTextPreview,
  makeConversationTitle,
  parseLaunchCommand,
  validateFileForAssistant,
} from '@/lib/assistant';

describe('assistant utils', () => {
  it('cria mensagem inicial padrão', () => {
    const message = createInitialAssistantMessage();
    expect(message.role).toBe('assistant');
    expect(message.content.length).toBeGreaterThan(10);
  });

  it('gera título da conversa com base na primeira mensagem do usuário', () => {
    const title = makeConversationTitle([
      { role: 'assistant', content: 'Oi' },
      { role: 'user', content: 'Preciso revisar meus gastos do mês com alimentação e transporte' },
    ]);
    expect(title).toContain('Preciso revisar');
  });

  it('valida arquivo permitido e rejeita acima de 10MB', () => {
    const valid = new File([new Uint8Array([1, 2, 3])], 'teste.png', { type: 'image/png' });
    const big = new File([new Uint8Array(MAX_FILE_BYTES + 1)], 'big.pdf', { type: 'application/pdf' });
    expect(validateFileForAssistant(valid).valid).toBe(true);
    expect(validateFileForAssistant(big).valid).toBe(false);
  });

  it('rejeita tipo de arquivo inválido', () => {
    const invalid = new File([new Uint8Array([1])], 'teste.exe', { type: 'application/x-msdownload' });
    expect(validateFileForAssistant(invalid)).toEqual({
      valid: false,
      error: 'Tipo de arquivo não permitido.',
    });
  });

  it('aceita e interpreta comando de lançamento válido', () => {
    const command = parseLaunchCommand('/lancamento type=expense amount=199.9 description="Mercado mensal"');
    expect(command).toEqual({
      type: 'expense',
      amount: 199.9,
      description: 'Mercado mensal',
      date: expect.any(String),
    });
  });

  it('retorna nulo para comando inválido', () => {
    const command = parseLaunchCommand('/lancamento type=expense amount=abc description="x"');
    expect(command).toBeNull();
  });

  it('aceita aliases de parâmetros em português', () => {
    const command = parseLaunchCommand('/lancamento type=income amount=200 descricao="Freela" data=2026-03-31');
    expect(command).toEqual({
      type: 'income',
      amount: 200,
      description: 'Freela',
      date: '2026-03-31',
    });
  });

  it('retorna nulo para entrada sem prefixo do comando', () => {
    expect(parseLaunchCommand('registrar despesa')).toBeNull();
  });

  it('valida permissão de execução de ação por papel', () => {
    expect(canUseAiAction('admin')).toBe(true);
    expect(canUseAiAction('editor')).toBe(true);
    expect(canUseAiAction('viewer')).toBe(false);
    expect(canUseAiAction(null)).toBe(false);
  });

  it('extrai delta de streaming OpenAI e Gemini', () => {
    const openAiDelta = extractOpenAiDelta({
      choices: [{ delta: { content: 'Olá' } }],
    });
    const geminiDelta = extractGeminiDelta({
      candidates: [{ content: { parts: [{ text: 'Mundo' }] } }],
    });

    expect(openAiDelta).toBe('Olá');
    expect(geminiDelta).toBe('Mundo');
  });

  it('retorna vazio para payload inválido nos extratores', () => {
    expect(extractOpenAiDelta({})).toBe('');
    expect(extractGeminiDelta({})).toBe('');
  });

  it('converte arquivo para base64', async () => {
    const file = new File([new TextEncoder().encode('abc')], 'a.txt', { type: 'text/plain' });
    const base64 = await fileToBase64(file);
    expect(base64).toBe('YWJj');
  });

  it('gera preview de texto somente para txt', async () => {
    const txt = new File([new TextEncoder().encode('conteudo de teste')], 'a.txt', { type: 'text/plain' });
    const pdf = new File([new Uint8Array([1, 2, 3])], 'a.pdf', { type: 'application/pdf' });
    expect(await fileToTextPreview(txt)).toContain('conteudo');
    expect(await fileToTextPreview(pdf)).toBe('');
  });

  it('consome stream SSE e agrega deltas', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Oi"}}]}\n\n'));
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"!"}}]}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    const response = new Response(stream);
    let result = '';
    await consumeSseStream(
      response,
      (delta) => {
        result += delta;
      },
      extractOpenAiDelta
    );

    expect(result).toBe('Oi!');
  });

  it('ignora linhas inválidas de SSE sem quebrar', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: invalid-json\n\n'));
        controller.enqueue(encoder.encode('data: {"candidates":[{"content":{"parts":[{"text":"ok"}]}}]}\n\n'));
        controller.close();
      },
    });

    const response = new Response(stream);
    let result = '';
    await consumeSseStream(
      response,
      (delta) => {
        result += delta;
      },
      extractGeminiDelta
    );

    expect(result).toBe('ok');
  });

  it('garante que lista de tipos permitidos inclui formatos esperados', () => {
    expect(ALLOWED_FILE_TYPES.has('image/jpeg')).toBe(true);
    expect(ALLOWED_FILE_TYPES.has('image/png')).toBe(true);
    expect(ALLOWED_FILE_TYPES.has('application/pdf')).toBe(true);
    expect(ALLOWED_FILE_TYPES.has('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
  });
});
