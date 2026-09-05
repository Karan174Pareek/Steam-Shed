import { useRef, type ChangeEvent } from 'react';
import type { DocumentRecord } from '../storage';
import { X, Trash2, Upload, HardDrive, FileText } from 'lucide-react';

interface StorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentRecord[];
  onDeleteDocument: (docId: string) => void;
  onFileUpload: (file: File) => void;
  isIngesting: boolean;
  ingestStatus: string;
  storageUsage: { usedBytes: number; quotaBytes: number };
}

export const StorageModal = ({
  isOpen,
  onClose,
  documents,
  onDeleteDocument,
  onFileUpload,
  isIngesting,
  ingestStatus,
  storageUsage,
}: StorageModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-accent-iron/70 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-base rounded-2xl p-5 sm:p-6 neu-raised flex flex-col max-h-[90vh] border border-shadow-dark/50">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 neu-hairline border-t-0 mb-4">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-accent-iron" />
            <h3 className="font-display font-bold text-lg text-accent-iron">
              Maintenance Documents ({documents.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="neu-raised-interactive p-1.5 rounded-lg text-accent-iron border border-shadow-dark/30"
            aria-label="Close document manager"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Storage Bar */}
        <div className="neu-inset rounded-xl p-3.5 mb-4 border border-shadow-dark/30">
          <div className="flex justify-between text-xs text-accent-iron font-bold mb-1.5">
            <span>On-Device Storage</span>
            <span className="font-mono">
              {formatBytes(storageUsage.usedBytes)}{' '}
              {storageUsage.quotaBytes > 0 ? `/ ${formatBytes(storageUsage.quotaBytes)}` : ''}
            </span>
          </div>
          <div className="w-full bg-base h-2.5 rounded-full overflow-hidden border border-shadow-dark/40">
            <div
              className="bg-accent-brass h-full transition-all duration-300"
              style={{
                width:
                  storageUsage.quotaBytes > 0
                    ? `${Math.min(100, Math.max(2, (storageUsage.usedBytes / storageUsage.quotaBytes) * 100))}%`
                    : '4%',
              }}
            />
          </div>
        </div>

        {/* Ingestion in progress notice */}
        {isIngesting && (
          <div className="mb-4 neu-inset rounded-xl p-3 text-xs text-accent-iron font-semibold flex items-center gap-2 border border-shadow-dark/40">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-brass animate-ping flex-shrink-0" />
            <span>{ingestStatus}</span>
          </div>
        )}

        {/* Document List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-4">
          {documents.length === 0 ? (
            <div className="text-center py-8 text-sm text-accent-iron font-semibold neu-inset rounded-xl p-4 border border-shadow-dark/30">
              No maintenance documents loaded yet.
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="neu-raised rounded-xl p-3.5 flex items-center justify-between gap-3 border border-shadow-dark/30"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-lg neu-inset flex items-center justify-center flex-shrink-0 border border-shadow-dark/30">
                    <FileText className="w-4 h-4 text-accent-iron" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-sm text-accent-iron truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-accent-iron font-medium">
                      {doc.pageCount ? `${doc.pageCount} page${doc.pageCount === 1 ? '' : 's'}` : 'PDF'} &bull;{' '}
                      {doc.chunkCount ? `${doc.chunkCount} sections indexed` : 'Indexed'} &bull;{' '}
                      {new Date(doc.ingestedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteDocument(doc.id)}
                  className="neu-raised-interactive p-2 rounded-lg text-accent-iron hover:text-red-700 transition-colors flex-shrink-0 border border-shadow-dark/30"
                  aria-label={`Delete ${doc.name}`}
                  title="Remove from on-device store"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 neu-hairline flex items-center justify-between gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isIngesting}
            className="neu-raised-interactive px-4 py-2.5 rounded-xl text-xs font-bold text-accent-iron flex items-center gap-2 border border-shadow-dark/30"
          >
            <Upload className="w-4 h-4 text-accent-iron" />
            <span>Add Another PDF</span>
          </button>

          <button
            onClick={onClose}
            className="neu-raised-interactive px-5 py-2.5 rounded-xl text-xs font-bold text-accent-iron border border-shadow-dark/30"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
