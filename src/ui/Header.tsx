import { Database, Wrench } from 'lucide-react';

interface HeaderProps {
  isLlmReady: boolean;
  modeLabel: string;
  documentCount: number;
  onOpenStorage: () => void;
}

export const Header = ({
  isLlmReady,
  modeLabel,
  documentCount,
  onOpenStorage,
}: HeaderProps) => {
  return (
    <header className="w-full bg-base border-b border-shadow-dark/40 px-4 py-3 sm:px-6 select-none sticky top-0 z-20 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Stamped Plate Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md neu-raised flex items-center justify-center text-accent-iron flex-shrink-0 border border-shadow-dark/30">
            <Wrench className="w-5 h-5 text-accent-iron" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-lg sm:text-xl tracking-wide text-accent-iron leading-tight">
                Steam-Shed Assistant
              </h1>
            </div>
            <p className="text-xs text-accent-iron font-semibold tracking-tight">
              Ask about torque, intervals, and procedures &bull; works fully offline
            </p>
          </div>
        </div>

        {/* Right status area */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Status Pill */}
          <div
            className="neu-inset-shallow px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold tracking-tight text-accent-iron border border-shadow-dark/40"
            title={
              isLlmReady
                ? 'On-device neural model active for answer synthesis'
                : 'Direct verified excerpt extraction mode active'
            }
          >
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                isLlmReady ? 'bg-accent-brass ring-1 ring-accent-brass-dark' : 'bg-accent-iron'
              }`}
            />
            <span className="hidden sm:inline text-accent-iron">{isLlmReady ? '● ready' : modeLabel}</span>
            <span className="sm:hidden text-accent-iron">{isLlmReady ? '● ready' : 'excerpts'}</span>
          </div>

          {/* Document Manager Button */}
          <button
            onClick={onOpenStorage}
            className="neu-raised-interactive px-3 py-1.5 rounded-lg text-xs font-bold text-accent-iron flex items-center gap-1.5 border border-shadow-dark/30"
            aria-label="Manage maintenance documents and storage"
            title="Manage maintenance documents"
          >
            <Database className="w-3.5 h-3.5 text-accent-iron" />
            <span className="hidden md:inline">Docs ({documentCount})</span>
            <span className="md:hidden">({documentCount})</span>
          </button>
        </div>
      </div>
    </header>
  );
};
