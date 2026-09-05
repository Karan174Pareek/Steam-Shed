export const STATIC_SUGGESTED_QUESTIONS: string[] = [
  'What is the operating boiler pressure for the B-Class locomotive?',
  'What is the brake block to wheel tyre clearance?',
  'What is the eccentric crank pin fastening nut torque?',
  'What is the recommended renewal interval for fusible plugs?',
  'What is the maximum allowable side play for axle box horncheeks?',
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

