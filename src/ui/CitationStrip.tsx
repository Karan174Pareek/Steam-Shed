import type { Citation } from '../generation';
import { FileText } from 'lucide-react';

interface CitationStripProps {
  citations: Citation[];
}

export const CitationStrip = ({ citations }: CitationStripProps) => {
  if (!citations || citations.length === 0) return null;

  // Deduplicate citations by document, section, and page
  const uniqueCitations = citations.filter(
    (c, idx, arr) =>
      arr.findIndex(
        (o) =>
          o.documentName === c.documentName &&
          o.sectionHeading === c.sectionHeading &&
          o.pageNumber === c.pageNumber
      ) === idx
  );

  return (
    <div className="mt-3.5 pt-3 neu-hairline">
      <div className="flex flex-col gap-2">
        {uniqueCitations.map((cit, idx) => (
          <div
            key={idx}
            className="flex flex-wrap items-center gap-1.5 text-xs text-accent-iron font-sans"
          >
            <FileText className="w-4 h-4 flex-shrink-0 text-accent-iron" />
            <span className="font-bold text-accent-iron truncate max-w-[220px] sm:max-w-xs">
              {cit.documentName}
            </span>
            <span className="text-accent-iron font-bold px-0.5">&bull;</span>
            <span className="font-semibold text-accent-iron truncate max-w-[200px] sm:max-w-sm">
              {cit.sectionHeading.startsWith('§') ? cit.sectionHeading : `§ ${cit.sectionHeading}`}
            </span>
            <span className="text-accent-iron font-bold px-0.5">&bull;</span>
            <span className="font-mono font-bold text-accent-iron bg-base-raised px-1.5 py-0.5 rounded border border-shadow-dark/50 flex-shrink-0">
              p.{cit.pageNumber}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
