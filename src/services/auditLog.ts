import type { Json } from '@/integrations/supabase/types';

function localAuditKey(userId: string) {
  return `ai_audit_logs_${userId}`;
}

export function appendAuditLog(
  userId: string,
  type: string,
  status: 'approved' | 'denied' | 'expired' | 'failed',
  payload: Json
): void {
  const key = localAuditKey(userId);
  const raw = localStorage.getItem(key);
  const logs = raw ? (JSON.parse(raw) as Json[]) : [];
  const entry: Json = {
    id: crypto.randomUUID(),
    type,
    status,
    payload,
    created_at: new Date().toISOString(),
    user_id: userId,
  };
  localStorage.setItem(key, JSON.stringify([entry, ...logs].slice(0, 300)));
}
