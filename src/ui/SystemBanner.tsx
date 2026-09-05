import { AlertTriangle, Info, X } from 'lucide-react';

interface SystemBannerProps {
  isInMemory: boolean;
  versionMismatch: boolean;
  errorMessage: string | null;
  onDismissError: () => void;
  onReindexRequired?: () => void;
}

export const SystemBanner = ({
  isInMemory,
  versionMismatch,
  errorMessage,
  onDismissError,
  onReindexRequired,
}: SystemBannerProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 pt-2 space-y-2">
      {/* In-Memory Warning */}
      {isInMemory && (
        <div className="neu-inset rounded-xl p-3 flex items-start gap-2.5 text-xs text-accent-iron border border-amber-800/50 bg-amber-900/5">
          <AlertTriangle className="w-4 h-4 text-amber-800 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">In-Memory Session Mode: </span>
            IndexedDB is unavailable in this environment. Your documents and queries are kept in memory for this session only and will not persist after reload.
          </div>
        </div>
      )}

      {/* Embedding Model Version Mismatch */}
      {versionMismatch && (
        <div className="neu-inset rounded-xl p-3 flex items-start justify-between gap-2.5 text-xs text-accent-iron border border-amber-800/50 bg-amber-900/5">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-accent-brass flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Embedding Version Update: </span>
              The local embedding engine was updated. Please re-index your documents to maintain similarity accuracy.
            </div>
          </div>
          {onReindexRequired && (
            <button
              onClick={onReindexRequired}
              className="neu-raised-interactive px-2.5 py-1 rounded-lg font-bold text-[11px] text-accent-iron flex-shrink-0 border border-shadow-dark/40"
            >
              Re-index Now
            </button>
          )}
        </div>
      )}

      {/* Error Notice */}
      {errorMessage && (
        <div className="neu-inset rounded-xl p-3 flex items-start justify-between gap-2.5 text-xs text-red-950 border border-red-700/50 bg-red-900/10">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-800 flex-shrink-0 mt-0.5" />
            <span className="font-bold">{errorMessage}</span>
          </div>
          <button
            onClick={onDismissError}
            className="neu-raised-interactive p-1 rounded-md text-accent-iron flex-shrink-0 border border-shadow-dark/30"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
