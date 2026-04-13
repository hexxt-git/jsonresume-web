import type { TextItem, TextItems } from './types';

let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function loadPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
  }
  return pdfjsLib;
}

export async function extractPdfTextItems(fileUrl: string): Promise<TextItems> {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument(fileUrl).promise;
  const allItems: TextItems = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    await page.getOperatorList(); // forces font data into commonObjs
    const { commonObjs } = page;

    const pageItems: TextItems = content.items.map((raw: any) => {
      const [, , , scaleY, tx, ty] = raw.transform ?? [0, 0, 0, 0, 0, 0];

      return {
        text: (raw.str ?? '').replace(/-\u00AD\u2010/g, '-'),
        x: tx,
        y: ty,
        width: raw.width ?? 0,
        height: raw.height ?? Math.abs(scaleY),
        fontName: resolveFontName(commonObjs, raw.fontName ?? ''),
        hasEOL: raw.hasEOL ?? false,
      } satisfies TextItem;
    });

    allItems.push(...pageItems);
  }

  return allItems.filter((item) => item.hasEOL || item.text.trim() !== '');
}

function resolveFontName(commonObjs: any, ref: string): string {
  try {
    const obj = commonObjs.get(ref);
    if (obj && typeof obj === 'object' && 'name' in obj) return obj.name;
  } catch {
    /* unresolved font */
  }
  return ref;
}
