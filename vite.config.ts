/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';

// Dev-only PDF export endpoint (see server/pdfExport.ts). Scaffold for Fix 1:
// generates the PDF with headless Chromium instead of window.print(), so the
// export has no browser print header/footer and matches the preview exactly.
// This only runs in `vite dev` — a real deployment needs this ported to
// whatever server/function runtime hosts the built app.
function pdfExportPlugin(): Plugin {
  return {
    name: 'pdf-export-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/export-pdf', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const { html, margin } = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
          if (typeof html !== 'string' || !html) {
            res.statusCode = 400;
            res.end('Missing "html" string in request body');
            return;
          }

          const { renderPdfBuffer } = await server.ssrLoadModule('/server/pdfExport.ts');
          const pdf = await renderPdfBuffer(html, margin);

          res.setHeader('Content-Type', 'application/pdf');
          res.end(pdf);
        } catch (err) {
          console.error('[pdf-export] failed:', err);
          res.statusCode = 500;
          res.end('PDF generation failed');
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), pdfExportPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    testTimeout: 30000,
  },
});
