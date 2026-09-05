export const STATIC_SUGGESTED_QUESTIONS: string[] = [
  'What is the torque on the injector fitting?',
  'What is the safety valve set pressure?',
  'What is the brake rigging pin torque?',
  'How often should brake rigging be inspected?',
  'What are the steps to replace piston rod packing?',
  "What's the part number for the axle box bearing shell?",
];

export function deriveSuggestedQuestions(chunks: { sectionHeading: string }[]): string[] {
  if (!chunks || chunks.length === 0) {
    return STATIC_SUGGESTED_QUESTIONS;
  }
  
  const uniqueHeadings = Array.from(
    new Set(chunks.map((c) => c.sectionHeading).filter(Boolean))
  ).filter((h) => h !== 'General Information');

  if (uniqueHeadings.length === 0) {
    return STATIC_SUGGESTED_QUESTIONS;
  }

  const generatedQuestions = uniqueHeadings.map((h) => {
    // Strip leading "Section 1.2 - " or "1.2 "
    const cleanHeading = h.replace(/^(?:section|chapter|part|item|annex)?\s*[\d.IVXLCDM]+\s*[-:—–]\s*/i, '').trim();
    return `What does the manual specify for ${cleanHeading.toLowerCase()}?`;
  });

  // Combine generated with static questions, avoiding duplicates
  const combined = Array.from(new Set([...generatedQuestions, ...STATIC_SUGGESTED_QUESTIONS]));
  return combined.slice(0, 5);
}

