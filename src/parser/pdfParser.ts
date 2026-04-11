import type { TextItem } from './types';

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

export async function extractTextItemsFromPdf(file: File): Promise<TextItem[]> {
  const pdfjs = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const items: TextItem[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const tx = item.transform;

      // Attempt to extract font name from the item
      let fontName = '';
      if ('fontName' in item && typeof item.fontName === 'string') {
        fontName = item.fontName;
      }

      items.push({
        text: item.str.replace(/[\u00AD\u2010]/g, '-'),
        x: tx[4],
        y: tx[5],
        width: (item as any).width ?? 0,
        height: (item as any).height ?? Math.abs(tx[3]),
        fontName,
        hasEOL: (item as any).hasEOL ?? false,
      });
    }
  }

  return items;
}
