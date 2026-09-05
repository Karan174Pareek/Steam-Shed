import { Sparkles } from 'lucide-react';
import { STATIC_SUGGESTED_QUESTIONS } from './constants';

interface SuggestedChipsProps {
  questions?: string[];
  onSelect: (question: string) => void;
  disabled?: boolean;
  variant?: 'empty-state' | 'compact-bar';
}

export const SuggestedChips = ({
  questions = STATIC_SUGGESTED_QUESTIONS,
  onSelect,
  disabled = false,
  variant = 'empty-state',
}: SuggestedChipsProps) => {
  if (variant === 'compact-bar') {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 pb-2 pt-1">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
          <span className="font-bold text-accent-iron flex-shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-accent-brass" />
            Try asking:
          </span>
          <div className="flex items-center gap-2 flex-nowrap">
            {questions.slice(0, 4).map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelect(q)}
                disabled={disabled}
                className="neu-raised-interactive px-3 py-1 rounded-full text-xs font-semibold text-accent-iron border border-shadow-dark/40 whitespace-nowrap disabled:opacity-50 flex-shrink-0 hover:border-accent-brass/60"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-5 pt-4 neu-hairline text-left">
      <div className="flex items-center gap-1.5 text-xs font-bold text-accent-iron mb-2.5">
        <Sparkles className="w-3.5 h-3.5 text-accent-brass" />
        <span>Try asking:</span>
      </div>
      <div className="flex flex-col gap-2">
        {questions.slice(0, 4).map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(q)}
            disabled={disabled}
            className="neu-raised-interactive w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-accent-iron border border-shadow-dark/30 hover:border-accent-brass/50 disabled:opacity-50 transition-all"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};
