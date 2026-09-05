import type { GenerationResult } from '../generation';
import { CitationStrip } from './CitationStrip';

export interface MessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  resultMeta?: GenerationResult;
}

interface ChatMessageProps {
  message: MessageItem;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.sender === 'user';

  if (isUser) {
    return (
      <div className="w-full flex justify-end mb-4">
        <div className="max-w-[85%] sm:max-w-[70ch] rounded-2xl p-4 neu-raised text-accent-iron border border-shadow-dark/30">
          <p className="text-sm sm:text-base font-sans font-semibold whitespace-pre-wrap break-words leading-relaxed text-accent-iron">
            {message.text}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-start mb-5">
      <div className="w-full max-w-[95%] sm:max-w-[70ch] rounded-2xl p-4 sm:p-5 neu-inset text-accent-iron border border-shadow-dark/40">
        {/* Answer Text: crisp, dark, WCAG AA compliant text */}
        <div className="text-sm sm:text-base font-sans font-medium leading-relaxed whitespace-pre-wrap break-words text-accent-iron">
          {message.text}
        </div>

        {/* Citations */}
        {message.resultMeta?.citations && message.resultMeta.citations.length > 0 && (
          <CitationStrip citations={message.resultMeta.citations} />
        )}
      </div>
    </div>
  );
};
