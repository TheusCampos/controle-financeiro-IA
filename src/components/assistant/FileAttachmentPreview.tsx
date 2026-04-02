import { XCircle } from 'lucide-react';

interface Props {
  file: File | null;
  previewUrl: string | null;
  textPreview: string;
  onClear: () => void;
}

export function FileAttachmentPreview({ file, previewUrl, textPreview, onClear }: Props) {
  if (!file) return null;

  return (
    <div className="px-4 pt-3">
      <div className="rounded-xl border border-border p-3 bg-background/60">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)}MB · {file.type}
            </p>
          </div>
          <button type="button" onClick={onClear} className="text-muted-foreground hover:text-foreground">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {previewUrl && (
          <div className="mt-3">
            {file.type.startsWith('image/') ? (
              <img
                src={previewUrl}
                alt={file.name}
                className="max-h-44 rounded-lg border border-border object-contain"
              />
            ) : (
              <iframe
                src={previewUrl}
                title={file.name}
                className="w-full h-44 rounded-lg border border-border"
              />
            )}
          </div>
        )}

        {textPreview && (
          <pre className="mt-3 text-xs whitespace-pre-wrap text-muted-foreground max-h-36 overflow-auto">
            {textPreview}
          </pre>
        )}
      </div>
    </div>
  );
}
