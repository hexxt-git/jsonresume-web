/**
 * Extract TextItems from HTML by rendering it in a hidden DOM container
 * and reading real spatial data + font info from the browser layout engine.
 *
 * This lets DOCX files (via mammoth → HTML) be fed through the same
 * open-resume parsing pipeline as PDFs — no fake positions, no heuristics.
 */
import type { TextItem, TextItems } from './types';

export async function extractTextItemsFromHtml(html: string): Promise<TextItems> {
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

  // Wait for the browser to compute layout
  await new Promise((r) => requestAnimationFrame(r));

  try {
    return extractFromContainer(container);
  } finally {
    document.body.removeChild(container);
  }
}

function extractFromContainer(container: HTMLElement): TextItems {
  const items: TextItems = [];
  const cRect = container.getBoundingClientRect();
  // Large virtual page height so y values match PDF convention (higher on page = larger y)
  const pageH = cRect.height + 200;

  // Collect all block-level elements
  const blocks = Array.from(
    container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, tr, dt, dd, blockquote'),
  );
  // Fallback: direct children
  if (blocks.length === 0) {
    blocks.push(...(Array.from(container.children) as HTMLElement[]));
  }

  for (const block of blocks) {
    const blockRect = block.getBoundingClientRect();
    if (!blockRect.height) continue;

    const baseY = pageH - (blockRect.top - cRect.top);
    const isHeading = /^H[1-6]$/i.test(block.tagName);
    const isListItem = block.tagName === 'LI';

    // Prepend bullet character for list items so the open-resume
    // bullet-point detection works
    if (isListItem) {
      items.push({
        text: '•',
        x: blockRect.left - cRect.left - 12,
        y: baseY,
        width: 8,
        height: blockRect.height,
        fontName: 'sans-serif',
        hasEOL: false,
      });
    }

    // Walk text nodes within this block
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    let textNode: Text | null;

    while ((textNode = walker.nextNode() as Text | null)) {
      const raw = textNode.textContent || '';
      if (!raw.trim()) continue;

      // Check parent chain for bold styling
      const bold = isHeading || isNodeBold(textNode, block);

      // Get precise position via Range
      const range = document.createRange();
      range.selectNodeContents(textNode);
      const rects = range.getClientRects();

      if (rects.length === 0) {
        // Fallback: use block rect
        items.push({
          text: raw.trim(),
          x: blockRect.left - cRect.left,
          y: baseY,
          width: raw.length * 7,
          height: blockRect.height,
          fontName: bold ? 'sans-serif-Bold' : 'sans-serif',
          hasEOL: false,
        });
        continue;
      }

      // Handle text that wraps across multiple lines
      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        if (rect.width < 1) continue;

        // Approximate which slice of text belongs to this rect
        const lineText = getTextSliceForRect(raw, rects, i);
        if (!lineText.trim()) continue;

        items.push({
          text: lineText,
          x: rect.left - cRect.left,
          y: pageH - (rect.top - cRect.top),
          width: rect.width,
          height: rect.height,
          fontName: bold ? 'sans-serif-Bold' : 'sans-serif',
          hasEOL: false,
        });
      }
    }

    // Mark last item in this block as end-of-line
    if (items.length > 0) {
      items[items.length - 1].hasEOL = true;
    }
  }

  return items;
}

/** Check if a text node is inside a bold element (strong, b, or font-weight ≥ 600) */
function isNodeBold(textNode: Text, stopAt: Element): boolean {
  let el: HTMLElement | null = textNode.parentElement;
  while (el && el !== stopAt.parentElement) {
    const tag = el.tagName;
    if (tag === 'STRONG' || tag === 'B') return true;
    const fw = parseInt(getComputedStyle(el).fontWeight) || 400;
    if (fw >= 600) return true;
    el = el.parentElement;
  }
  return false;
}

/** Split a text node's content across its client rects (handles line wrapping) */
function getTextSliceForRect(fullText: string, rects: DOMRectList, rectIndex: number): string {
  if (rects.length === 1) return fullText;

  // Distribute characters proportional to rect widths
  const totalWidth = Array.from(rects).reduce((s, r) => s + r.width, 0);
  if (totalWidth === 0) return rectIndex === 0 ? fullText : '';

  let start = 0;
  for (let i = 0; i < rectIndex; i++) {
    start += Math.round((rects[i].width / totalWidth) * fullText.length);
  }
  const charCount = Math.round((rects[rectIndex].width / totalWidth) * fullText.length);
  return fullText.slice(start, start + charCount);
}
