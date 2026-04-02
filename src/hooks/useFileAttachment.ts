import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { validateFileForAssistant, fileToTextPreview } from '@/lib/assistant';

export function useFileAttachment() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textPreview, setTextPreview] = useState('');

  // Revoga a URL de objeto ao trocar arquivo para evitar memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSelectFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFileForAssistant(file);
    if (!validation.valid) {
      toast.error(validation.error);
      event.target.value = '';
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setSelectedFile(file);
    setTextPreview(await fileToTextPreview(file));
    setPreviewUrl(
      file.type.startsWith('image/') || file.type === 'application/pdf'
        ? URL.createObjectURL(file)
        : null
    );
    event.target.value = '';
    toast.success('Arquivo anexado para análise.');
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setTextPreview('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return { selectedFile, previewUrl, textPreview, handleSelectFile, clearSelectedFile };
}
