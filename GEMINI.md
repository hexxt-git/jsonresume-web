# JSON Resume Web

A client-side resume builder, parser, and renderer built on the [JSON Resume](https://jsonresume.org) standard. It features 10 built-in themes, a PDF/DOCX parser, and integrated AI tools for tailoring and chat.

## Project Overview

- **Standard:** Uses JSON Resume v1.0.0.
- **Privacy:** Entirely client-side. No data leaves the browser (except for AI API calls if configured).
- **Core Features:**
  - **Editor:** Form-based and JSON-based editing with multi-slot support.
  - **Themes:** 10 pure HTML/CSS themes (no React at render time for maximum portability).
  - **Parser:** Advanced 4-step PDF parsing pipeline plus DOCX/Text fallback.
  - **AI:** Integrated chat and automation tools (tailoring, batch processing) supporting Gemini, OpenAI, and Anthropic.
  - **I18n:** Multi-language support (en, fr, ar).
  - **Persistence:** LocalStorage via Zustand.

## Tech Stack

- **Framework:** React 19 + TypeScript 6.
- **Build Tool:** Vite 8.
- **Styling:** Tailwind CSS 4.
- **State Management:** Zustand (with persistence).
- **UI Components:** Radix UI, Lucide/Iconsax.
- **Parsing:** `pdfjs-dist` (PDF), `mammoth` (DOCX).
- **AI SDKs:** `@google/genai`, `openai`, `@anthropic-ai/sdk`.
- **Testing:** Vitest, Puppeteer (for PDF roundtrip tests).
- **Formatting:** Prettier, Husky.
- **Package Manager:** pnpm.

## Key Commands

- `pnpm dev`: Start the development server.
- `pnpm build`: Run type-checks and build for production.
- `pnpm test`: Execute the test suite (150+ tests).
- `pnpm lint`: Run ESLint.
- `pnpm format`: Format the codebase with Prettier.
- `pnpm preview`: Preview the production build.

## Architecture & Directory Structure

- `src/parser/`: The parsing pipeline (PDF to JSON Resume).
  - `pdfParser.ts`: Step 1 - Extract raw text items.
  - `groupLines.ts`: Step 2 - Merge items into lines.
  - `groupSections.ts`: Step 3 - Identify resume sections (Work, Education, etc.).
  - `extractors/`: Step 4 - Extract structured fields using competitive scoring.
- `src/themes/`: 10 themes implemented as pure `(resume) => string` (HTML) functions.
- `src/lib/ai/`: Provider-agnostic AI layer with specific adapters for Gemini, OpenAI, and Anthropic.
- `src/store/`: Zustand stores for resume data, settings, AI configuration, and automation.
- `src/components/`:
  - `editor/`: Form and JSON editors.
  - `ai/`: AI Chat and quick actions.
  - `automation/`: Batch tailoring and pipeline views.
  - `preview/`: Isolated `iframe` for resume rendering and PDF export.

## Development Conventions

- **State:** Use `useResumeStore` for resume data. Avoid local state for data that should be persisted or shared.
- **Styling:** Use Tailwind CSS 4 utility classes. Prefer CSS variables for theme-aware colors.
- **Themes:** New themes must be pure functions returning a string of HTML and handle missing fields gracefully.
- **I18n:** Use the `useT` hook for all user-facing text. Add translations to `src/i18n/`.
- **Testing:** Any new parser logic or theme should include corresponding unit tests in `src/test/`.
- **Surgical Updates:** When modifying components, maintain the existing patterns (e.g., using Radix primitives or specific icon libraries).
