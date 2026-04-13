import type { TextItems } from '../parser/types';
import { groupIntoLines } from '../parser/line-grouper';
import { groupIntoSections } from '../parser/section-grouper';
import { extractAllSections } from '../parser/extractors';

export async function extractTextItemsFromPdfBuffer(data: Uint8Array): Promise<TextItems> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const allItems: TextItems = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    await page.getOperatorList();
    const { commonObjs } = page;

    const pageItems = content.items.map((raw: any) => {
      const [, , , scaleY, tx, ty] = raw.transform ?? [0, 0, 0, 0, 0, 0];
      let fontName: string = raw.fontName ?? '';
      try {
        const obj = commonObjs.get(raw.fontName);
        if (obj && typeof obj === 'object' && 'name' in obj) fontName = obj.name;
      } catch {
        /* unresolved */
      }

      return {
        text: ((raw.str ?? '') as string).replace(/-\u00AD\u2010/g, '-'),
        x: tx,
        y: ty,
        width: raw.width ?? 0,
        height: raw.height ?? Math.abs(scaleY),
        fontName,
        hasEOL: raw.hasEOL ?? false,
      };
    });

    allItems.push(...pageItems);
  }

  return allItems.filter((i) => i.hasEOL || i.text.trim() !== '');
}

export async function parseResumeFromPdfBuffer(data: Uint8Array) {
  const items = await extractTextItemsFromPdfBuffer(data);
  return extractAllSections(groupIntoSections(groupIntoLines(items)));
}
