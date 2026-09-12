import type { Browser } from 'puppeteer';

// ponytail: single shared headless browser instance, relaunched if it dies.
// Fine for local dev / low-traffic use; a real deployment should pool pages
// and consider a request queue if usage grows.
let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    const puppeteer = await import('puppeteer');
    browserPromise = puppeteer.default.launch({ headless: true, args: ['--no-sandbox'] });
  }
  const browser = await browserPromise;
  if (!browser.connected) {
    browserPromise = null;
    return getBrowser();
  }
  return browser;
}

export interface PdfMarginInput {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

/**
 * Renders an already-built resume HTML string (the exact srcDoc the preview
 * iframe shows) to a PDF buffer via headless Chromium, so the file matches
 * the preview pixel-for-pixel with no OS print dialog / header-footer chrome.
 *
 * `margin` is applied as a real per-page inset by the PDF renderer itself
 * (not CSS body padding), so every page — not just the first/last — gets
 * an identical "container" margin around the content.
 */
export async function renderPdfBuffer(html: string, margin?: PdfMarginInput): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: margin?.top ?? '16mm',
        right: margin?.right ?? '14mm',
        bottom: margin?.bottom ?? '16mm',
        left: margin?.left ?? '14mm',
      },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}
