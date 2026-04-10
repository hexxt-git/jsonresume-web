import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from './types';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export async function extractTextItemsFromPdf(file: File): Promise<TextItem[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const items: TextItem[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const commonObjs = page.commonObjs;

    for (const raw of content.items) {
      if (!('str' in raw)) continue;

      const text = raw.str.replace(/-\u00AD\u2010/g, '-');
      if (!text.trim() && !raw.hasEOL) continue;

      let fontName = raw.fontName || '';
      try {
        const fontObj = commonObjs.get(raw.fontName);
        if (fontObj && typeof fontObj === 'object' && 'name' in fontObj) {
          fontName = fontObj.name as string;
        }
      } catch {
        /* font lookup can fail */
      }

      items.push({
        text,
        x: raw.transform[4],
        y: raw.transform[5],
        width: raw.width,
        height: raw.height,
        fontName,
        hasEOL: raw.hasEOL ?? false,
      });
    }
  }

  return items;
}
