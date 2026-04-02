import { useRef, useEffect } from 'react';
import { Bot, PlusCircle, Save, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAISettingsStore } from '@/store/aiSettingsStore';
import { useConversation } from '@/hooks/useConversation';
import { usePendingAction } from '@/hooks/usePendingAction';
import { useFileAttachment } from '@/hooks/useFileAttachment';
import { useAssistantChat } from '@/hooks/useAssistantChat';
import { ApiKeyWarning } from '@/components/assistant/ApiKeyWarning';
import { PendingActionBanner } from '@/components/assistant/PendingActionBanner';
import { MessageList } from '@/components/assistant/MessageList';
import { FileAttachmentPreview } from '@/components/assistant/FileAttachmentPreview';
import { ChatInput } from '@/components/assistant/ChatInput';
import { SavedConversations } from '@/components/assistant/SavedConversations';

export default function AssistantPage() {
  const user = useAuthStore((s) => s.user);
  const { provider, apiKey, systemPrompt } = useAISettingsStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation(user);
  const fileAttachment = useFileAttachment();
  const pendingActionHook = usePendingAction({ user, setMessages: conversation.setMessages });
  const { input, setInput, loading, handleSend } = useAssistantChat({
    user,
    provider,
    apiKey,
    systemPrompt,
    messages: conversation.messages,
    setMessages: conversation.setMessages,
    save: conversation.save,
    selectedFile: fileAttachment.selectedFile,
    textPreview: fileAttachment.textPreview,
    clearSelectedFile: fileAttachment.clearSelectedFile,
    setPendingAction: pendingActionHook.setPendingAction,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages]);

  const handleStartNew = () => {
    conversation.startNew();
    setInput('');
    pendingActionHook.setPendingAction(null);
    fileAttachment.clearSelectedFile();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen max-w-5xl mx-auto p-4 md:p-8 animate-fade-in">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-serif font-medium text-foreground tracking-tight flex items-center gap-3">
            <Bot className="w-8 h-8 text-primary" />
            Assistente IA
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Converse, anexe arquivos e execute ações autorizadas.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleStartNew}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-secondary"
          >
            <PlusCircle className="w-4 h-4" />
            Nova conversa
          </button>
          <button
            type="button"
            onClick={() => conversation.save(conversation.messages, null)}
            disabled={conversation.saving || loading || !user}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm disabled:opacity-50"
          >
            {conversation.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
        </div>
      </div>

      <SavedConversations
        conversations={conversation.conversationRows}
        currentId={conversation.conversationId}
        onLoad={conversation.loadById}
        onDelete={conversation.removeConversation}
      />

      <ApiKeyWarning />

      <PendingActionBanner
        action={pendingActionHook.pendingAction}
        countdown={pendingActionHook.actionCountdown}
        executing={pendingActionHook.executingAction}
        onExecute={pendingActionHook.executePendingAction}
        onCancel={pendingActionHook.cancelPendingAction}
      />

      <div className="flex-1 glass-card flex flex-col overflow-hidden rounded-2xl border border-border/50">
        <MessageList
          messages={conversation.messages}
          loading={loading}
          endRef={messagesEndRef}
        />
        <FileAttachmentPreview
          file={fileAttachment.selectedFile}
          previewUrl={fileAttachment.previewUrl}
          textPreview={fileAttachment.textPreview}
          onClear={fileAttachment.clearSelectedFile}
        />
        <ChatInput
          input={input}
          loading={loading}
          hasApiKey={!!apiKey}
          onChange={setInput}
          onSubmit={handleSend}
          onFileChange={fileAttachment.handleSelectFile}
        />
      </div>
    </div>
  );
}
