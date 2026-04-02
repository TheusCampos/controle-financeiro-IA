import type { Json } from '@/integrations/supabase/types';
import type { AssistantMessage, ParsedLaunchCommand } from '@/lib/assistant';

export type Message = AssistantMessage;

export interface ConversationRow {
  id: string;
  title: string;
  updatedAt: string;
}

export interface LocalConversation {
  id: string;
  title: string;
  updated_at: string;
  messages: Message[];
  context_snapshot: Json | null;
}

export interface PendingAction {
  id: string;
  command: ParsedLaunchCommand;
  expiresAt: number;
}
