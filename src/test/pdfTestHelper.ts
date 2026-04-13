import type { TextItems } from '../parser/types';
import { groupTextItemsIntoLines } from '../parser/group-text-items-into-lines';
import { groupLinesIntoSections } from '../parser/group-lines-into-sections';
import { extractResumeFromSections } from '../parser/extract-resume-from-sections';

/**
 * PDF text extraction using the legacy pdfjs-dist build for Node.js tests.
 * Accepts raw PDF data (Uint8Array) since file:// URLs don't work in Node.
 */
export async function extractTextItemsFromPdfBuffer(data: Uint8Array): Promise<TextItems> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const pdf = await pdfjsLib.getDocument({ data }).promise;
  let items: TextItems = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    await page.getOperatorList();
    const commonObjs = page.commonObjs;

    const pageItems = content.items.map((raw: any) => {
      const text: string = (raw.str ?? '').replace(/-\u00AD\u2010/g, '-');
      const transform: number[] = raw.transform ?? [0, 0, 0, 0, 0, 0];

      let fontName: string = raw.fontName ?? '';
      try {
        const fontObj = commonObjs.get(raw.fontName);
        if (fontObj && typeof fontObj === 'object' && 'name' in fontObj) {
          fontName = (fontObj as any).name as string;
        }
      } catch {
        /* font lookup can fail */
      }

      return {
        text,
        x: transform[4],
        y: transform[5],
        width: raw.width ?? 0,
        height: raw.height ?? Math.abs(transform[3]),
        fontName,
        hasEOL: raw.hasEOL ?? false,
      };
    });

    items.push(...pageItems);
  }

  items = items.filter((item) => item.hasEOL || item.text.trim() !== '');
  return items;
}

/**
 * Full parse pipeline for testing: PDF buffer → open-resume result.
 */
export async function parseResumeFromPdfBuffer(data: Uint8Array) {
  const textItems = await extractTextItemsFromPdfBuffer(data);
  const lines = groupTextItemsIntoLines(textItems);
  const sections = groupLinesIntoSections(lines);
  return extractResumeFromSections(sections);
}
