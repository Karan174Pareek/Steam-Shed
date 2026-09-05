import { useRef, type ChangeEvent } from 'react';
import { UploadCloud, BookOpen, Train } from 'lucide-react';
import { SuggestedChips } from './SuggestedChips';

interface EmptyStateProps {
  onFileUpload: (file: File) => void;
  onLoadSampleManual: () => void;
  isIngesting: boolean;
  ingestStatus: string;
  suggestedQuestions?: string[];
  onSelectQuestion?: (question: string) => void;
}

export const EmptyState = ({
  onFileUpload,
  onLoadSampleManual,
  isIngesting,
  ingestStatus,
  suggestedQuestions,
  onSelectQuestion,
}: EmptyStateProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none max-w-xl mx-auto my-auto w-full">
      {/* Plate Card */}
      <div className="w-full rounded-2xl p-6 sm:p-8 neu-raised flex flex-col items-center border border-shadow-dark/40">
        <div className="w-16 h-16 rounded-full neu-inset flex items-center justify-center text-accent-iron mb-4 border border-shadow-dark/30">
          <Train className="w-8 h-8 text-accent-iron" />
        </div>

        <h2 className="font-display font-bold text-xl sm:text-2xl text-accent-iron mb-2">
          Add a maintenance PDF to get started
        </h2>

        <p className="text-sm font-sans font-medium text-accent-iron max-w-md mb-5 leading-relaxed">
          Upload DHR B-Class locomotive overhaul sheets, brake manuals, or maintenance specifications. All indexing and questions run 100% on your device.
        </p>

        {isIngesting ? (
          <div className="w-full neu-inset rounded-xl p-4 flex flex-col items-center gap-3 border border-shadow-dark/40">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-brass animate-ping" />
              <span className="text-sm font-bold text-accent-iron">{ingestStatus}</span>
            </div>
            <p className="text-xs font-medium text-accent-iron">
              Extracting technical sections &amp; computing vectors client-side...
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {/* Hidden native input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,application/pdf"
              className="hidden"
            />

            {/* Custom file button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="neu-raised-interactive w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-sm text-accent-iron flex items-center justify-center gap-2 border border-shadow-dark/40"
            >
              <UploadCloud className="w-4 h-4 text-accent-iron" />
              <span>Select PDF Manual</span>
            </button>

            {/* Load Sample DHR Manual (Demo seed) */}
            <button
              onClick={onLoadSampleManual}
              className="neu-raised-interactive w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-sm text-accent-iron flex items-center justify-center gap-2 border border-shadow-dark/40"
              title="Loads sample DHR B-Class specs (Boiler, Vacuum Brake, Valve Gear)"
            >
              <BookOpen className="w-4 h-4 text-accent-brass-dark" />
              <span>Load DHR B-Class Spec</span>
            </button>
          </div>
        )}

        {/* Tappable Suggested Questions */}
        {!isIngesting && onSelectQuestion && (
          <SuggestedChips
            questions={suggestedQuestions}
            onSelect={onSelectQuestion}
            disabled={isIngesting}
            variant="empty-state"
          />
        )}

        <div className="mt-5 pt-3.5 neu-hairline w-full text-center">
          <p className="text-xs text-accent-iron font-semibold tracking-wider uppercase">
            Zero Server Calls &bull; Offline PWA &bull; Grounded Maintenance Specs
          </p>
        </div>
      </div>
    </div>
  );
};
