import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { Send, AlertCircle } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  hasDocuments: boolean;
  placeholder?: string;
}

export const ChatInput = ({
  onSend,
  disabled,
  hasDocuments,
  placeholder = 'Ask a question about locomotive specs...',
}: ChatInputProps) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (disabled || !hasDocuments) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    onSend(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <footer className="w-full bg-base border-t border-shadow-dark/40 px-4 py-3 sm:px-6 sticky bottom-0 z-20 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-4xl mx-auto">
        {!hasDocuments && (
          <div className="mb-2 flex items-center gap-1.5 text-xs text-accent-iron font-semibold">
            <AlertCircle className="w-4 h-4 text-accent-brass flex-shrink-0" />
            <span>Add a maintenance PDF to enable questions.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-2 sm:gap-3">
          <div className="flex-1 relative rounded-xl neu-raised overflow-hidden border border-shadow-dark/30">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled || !hasDocuments}
              placeholder={
                !hasDocuments
                  ? 'Please load a maintenance manual first...'
                  : placeholder
              }
              className="w-full bg-transparent resize-none px-4 py-3 text-sm sm:text-base font-sans font-medium text-accent-iron placeholder-accent-iron-muted focus:outline-none focus:ring-2 focus:ring-accent-brass rounded-xl transition-all"
              style={{ maxHeight: '120px' }}
            />
          </div>

          <button
            type="submit"
            disabled={disabled || !hasDocuments || !input.trim()}
            className="neu-raised-interactive disabled:opacity-40 disabled:pointer-events-none w-12 h-12 rounded-xl flex items-center justify-center text-accent-iron flex-shrink-0 border border-shadow-dark/30"
            aria-label="Send maintenance question"
          >
            <Send className="w-5 h-5 text-accent-iron" />
          </button>
        </form>
      </div>
    </footer>
  );
};
