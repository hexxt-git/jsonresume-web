import type { TextItem } from '../parser/types';

/**
 * PDF text extraction using the legacy pdfjs-dist build for Node.js test environment.
 * The browser build uses DOMMatrix which isn't available in jsdom/Node.
 */
export async function extractTextItemsFromPdfLegacy(file: File): Promise<TextItem[]> {
  // Dynamic import of the legacy build for Node.js compatibility
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const items: TextItem[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const commonObjs = page.commonObjs;

    for (const raw of content.items) {
      if (!('str' in raw)) continue;

      const text = (raw as any).str.replace(/-\u00AD\u2010/g, '-');
      if (!text.trim() && !(raw as any).hasEOL) continue;

      let fontName = (raw as any).fontName || '';
      try {
        const fontObj = commonObjs.get((raw as any).fontName);
        if (fontObj && typeof fontObj === 'object' && 'name' in fontObj) {
          fontName = (fontObj as any).name as string;
        }
      } catch {
        /* font lookup can fail */
      }

      items.push({
        text,
        x: (raw as any).transform[4],
        y: (raw as any).transform[5],
        width: (raw as any).width,
        height: (raw as any).height,
        fontName,
        hasEOL: (raw as any).hasEOL ?? false,
      });
    }
  }

  return items;
}
