import type { TextItem, TextItems } from './types';

export async function extractHtmlTextItems(html: string): Promise<TextItems> {
  const container = document.createElement('div');
  container.style.cssText = [
    'position:absolute',
    'left:-10000px',
    'top:0',
    'width:700px',
    'padding:40px',
    'font:12px/1.5 sans-serif',
    'visibility:hidden',
  ].join(';');
  container.innerHTML = html;
  document.body.appendChild(container);

  await new Promise((r) => requestAnimationFrame(r));

  try {
    return collectTextItems(container);
  } finally {
    document.body.removeChild(container);
  }
}

// ── Internals ───────────────────────────────────────────────────────

function collectTextItems(container: HTMLElement): TextItems {
  const items: TextItems = [];
  const cRect = container.getBoundingClientRect();
  const pageHeight = cRect.height + 200;

  const blocks = Array.from(
    container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, tr, dt, dd, blockquote'),
  );
  if (blocks.length === 0) blocks.push(...(Array.from(container.children) as HTMLElement[]));

  blocks.forEach((block) => {
    const bRect = block.getBoundingClientRect();
    if (!bRect.height) return;

    const baseY = pageHeight - (bRect.top - cRect.top);
    const isHeading = /^H[1-6]$/i.test(block.tagName);

    if (block.tagName === 'LI') {
      items.push(makeBulletItem(bRect, cRect, baseY));
    }

    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      const raw = node.textContent ?? '';
      if (!raw.trim()) continue;

      const bold = isHeading || checkBoldAncestry(node, block);
      const range = document.createRange();
      range.selectNodeContents(node);
      const rects = range.getClientRects();

      if (rects.length === 0) {
        items.push(
          createItem(
            raw.trim(),
            bRect.left - cRect.left,
            baseY,
            raw.length * 7,
            bRect.height,
            bold,
          ),
        );
        continue;
      }

      Array.from(rects).forEach((rect, i) => {
        if (rect.width < 1) return;
        const slice = distributeText(raw, rects, i);
        if (!slice.trim()) return;
        items.push(
          createItem(
            slice,
            rect.left - cRect.left,
            pageHeight - (rect.top - cRect.top),
            rect.width,
            rect.height,
            bold,
          ),
        );
      });
    }

    if (items.length > 0) items[items.length - 1].hasEOL = true;
  });

  return items;
}

function createItem(
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  bold: boolean,
): TextItem {
  return {
    text,
    x,
    y,
    width,
    height,
    fontName: bold ? 'sans-serif-Bold' : 'sans-serif',
    hasEOL: false,
  };
}

function makeBulletItem(blockRect: DOMRect, containerRect: DOMRect, baseY: number): TextItem {
  return createItem(
    '•',
    blockRect.left - containerRect.left - 12,
    baseY,
    8,
    blockRect.height,
    false,
  );
}

function checkBoldAncestry(node: Text, boundary: Element): boolean {
  let el = node.parentElement;
  while (el && el !== boundary.parentElement) {
    if (el.tagName === 'STRONG' || el.tagName === 'B') return true;
    if (parseInt(getComputedStyle(el).fontWeight) >= 600) return true;
    el = el.parentElement;
  }
  return false;
}

function distributeText(full: string, rects: DOMRectList, idx: number): string {
  if (rects.length === 1) return full;

  const widths = Array.from(rects).map((r) => r.width);
  const total = widths.reduce((a, b) => a + b, 0);
  if (total === 0) return idx === 0 ? full : '';

  const start = widths.slice(0, idx).reduce((a, w) => a + Math.round((w / total) * full.length), 0);
  const len = Math.round((widths[idx] / total) * full.length);
  return full.slice(start, start + len);
}
