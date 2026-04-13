import type { TextItem, TextItems } from './types';

let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
  }
  return pdfjsLib;
}

/**
 * Read a pdf resume file into text items.
 * Ported from open-resume. Uses getOperatorList() to force font loading
 * so commonObjs resolves real font names.
 */
export const readPdf = async (fileUrl: string): Promise<TextItems> => {
  const pdfjs = await getPdfjs();

  const pdfFile = await pdfjs.getDocument(fileUrl).promise;
  let textItems: TextItems = [];

  for (let i = 1; i <= pdfFile.numPages; i++) {
    const page = await pdfFile.getPage(i);
    const textContent = await page.getTextContent();

    // Wait for font data to be loaded
    await page.getOperatorList();
    const commonObjs = page.commonObjs;

    const pageTextItems = textContent.items.map((item: any) => {
      const text: string = item.str ?? '';
      const transform: number[] = item.transform ?? [0, 0, 0, 0, 0, 0];
      const x = transform[4];
      const y = transform[5];

      // Use commonObjs to convert font name to original name
      let fontName = item.fontName ?? '';
      try {
        const fontObj = commonObjs.get(item.fontName);
        if (fontObj && typeof fontObj === 'object' && 'name' in fontObj) {
          fontName = (fontObj as any).name as string;
        }
      } catch {
        // font lookup can fail in some environments
      }

      // pdfjs reads a "-" as "-­‐" in some cases. Revert it.
      const newText = text.replace(/-\u00AD\u2010/g, '-');

      return {
        text: newText,
        x,
        y,
        width: item.width ?? 0,
        height: item.height ?? Math.abs(transform[3]),
        fontName,
        hasEOL: item.hasEOL ?? false,
      } satisfies TextItem;
    });

    textItems.push(...pageTextItems);
  }

  // Filter out empty space textItem noise
  const isEmptySpace = (textItem: TextItem) => !textItem.hasEOL && textItem.text.trim() === '';
  textItems = textItems.filter((textItem) => !isEmptySpace(textItem));

  return textItems;
};
