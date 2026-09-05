import * as pdfjsLib from 'pdfjs-dist';

// Set worker source to the static worker served from public/, respecting base path
if (typeof window !== 'undefined') {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${cleanBase}pdf.worker.min.mjs`;
}

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractedDocument {
  pages: ExtractedPage[];
  totalTextLength: number;
}

/**
 * Extracts text from a PDF File object page-by-page using pdf.js.
 */
export async function parsePdfFile(file: File): Promise<ExtractedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
    disableFontFace: false,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pages: ExtractedPage[] = [];
  let totalTextLength = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Group text items into lines based on Y position
    const lines: string[] = [];
    let currentLine = '';
    let lastY: number | null = null;

    for (const item of textContent.items) {
      if ('str' in item) {
        const textItem = item as { str: string; transform: number[] };
        const y = textItem.transform[5];

        if (lastY === null || Math.abs(y - lastY) < 5) {
          // Same line
          currentLine += (currentLine.length > 0 && !currentLine.endsWith(' ') ? ' ' : '') + textItem.str;
        } else {
          // New line
          if (currentLine.trim()) {
            lines.push(currentLine.trim());
          }
          currentLine = textItem.str;
        }
        lastY = y;
      }
    }

    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    const pageText = lines.join('\n');
    totalTextLength += pageText.trim().length;

    pages.push({
      pageNumber: pageNum,
      text: pageText,
    });
  }

  return {
    pages,
    totalTextLength,
  };
}
