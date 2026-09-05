export const STATIC_SUGGESTED_QUESTIONS: string[] = [
  'What is the torque on the injector fitting?',
  'What is the safety valve set pressure?',
  "What's the brake rigging pin torque?",
  'How often should the boiler be washed out?',
  'What are the steps to replace piston rod packing?',
  "What's the part number for the axle box bearing shell?",
  'What lubricant do the main rod bearings need?',
  "What's the axle box bearing clearance?",
  'How much wheel wear is allowed before reprofiling?',
];

export function deriveSuggestedQuestions(chunks: { sectionHeading: string }[]): string[] {
  if (!chunks || chunks.length === 0) {
    return STATIC_SUGGESTED_QUESTIONS;
  }

  const uniqueHeadings = Array.from(
    new Set(chunks.map((c) => c.sectionHeading).filter(Boolean))
  ).filter((h) => !/General Information|Overview|Notice/i.test(h));

  if (uniqueHeadings.length === 0) {
    return STATIC_SUGGESTED_QUESTIONS;
  }

  // Check if headings match the canonical DHR sample manual
  const isSampleManual = uniqueHeadings.some((h) =>
    /Safety Valve|Injector Fitting|Brake Rigging|Wheel Tread|Piston Rod/i.test(h)
  );

  if (isSampleManual) {
    return STATIC_SUGGESTED_QUESTIONS;
  }

  // For custom uploaded PDFs, derive varied natural questions based on heading keywords
  const generatedQuestions: string[] = [];
  for (const h of uniqueHeadings) {
    // Strip leading "Section 1.2 - " or "1.2 "
    const clean = h
      .replace(/^(?:section|chapter|part|item|annex)?\s*[\d.IVXLCDM]+\s*[-:—–]\s*/i, '')
      .trim();

    if (!clean) continue;

    const lower = clean.toLowerCase();
    let q = '';

    if (/\btorque\b/i.test(clean)) {
      const topic = lower.replace(/\btorque\b|\bspecification\b|\blimits?\b/gi, '').trim();
      q = `What is the torque for ${topic || clean}?`;
    } else if (/\b(pressure|psi|bar)\b/i.test(clean)) {
      const topic = lower.replace(/\bpressure\b|\bsetting\b|\blimits?\b/gi, '').trim();
      q = `What is the pressure setting for ${topic || clean}?`;
    } else if (/\b(interval|schedule|frequency|period)\b/i.test(clean)) {
      const topic = lower.replace(/\binterval\b|\bschedule\b|\bmaintenance\b/gi, '').trim();
      q = `How often should ${topic || clean} be inspected?`;
    } else if (/\b(procedure|steps?|process|replacement|overhaul)\b/i.test(clean)) {
      const topic = lower.replace(/\bprocedure\b|\bsteps?\b/gi, '').trim();
      q = `What are the steps for ${topic || clean}?`;
    } else if (/\b(part|spare|number|reference)\b/i.test(clean)) {
      const topic = lower.replace(/\bpart\b|\bnumber\b|\breference\b|\bspares?\b/gi, '').trim();
      q = `What is the part number for ${topic || clean}?`;
    } else if (/\b(clearance|tolerance|wear|dimension|diameter)\b/i.test(clean)) {
      q = `What is the allowable clearance for ${lower}?`;
    } else {
      q = `What does the manual specify for ${lower}?`;
    }

    // Capitalize first character after 'for ' if needed and ensure question ends with '?'
    q = q.replace(/\s+/g, ' ').trim();
    if (!q.endsWith('?')) q += '?';

    if (!generatedQuestions.includes(q)) {
      generatedQuestions.push(q);
    }
  }

  const combined = Array.from(new Set([...generatedQuestions, ...STATIC_SUGGESTED_QUESTIONS]));
  return combined;
}


