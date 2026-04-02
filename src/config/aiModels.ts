export const AI_MODELS = {
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.5-flash-lite',
  anthropic: 'claude-3-haiku-20240307',
} as const;

export type AIProvider = keyof typeof AI_MODELS;
