interface LoadingIndicatorProps {
  statusText?: string;
}

export const LoadingIndicator = ({
  statusText = 'Thinking through the manual...',
}: LoadingIndicatorProps) => {
  return (
    <div className="w-full flex justify-start mb-5">
      <div className="rounded-2xl px-5 py-4 neu-inset text-accent-iron flex items-center gap-3 max-w-md border border-shadow-dark/40">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-accent-brass animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-accent-brass animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-accent-brass animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-xs sm:text-sm font-sans font-bold text-accent-iron tracking-tight">
          {statusText}
        </p>
      </div>
    </div>
  );
};
