# Resume Renderer

A fully client-side resume builder, parser, and renderer built on the [JSON Resume](https://jsonresume.org) open standard. No server, no accounts, no data leaves your browser.

## Why

The JSON Resume ecosystem has good ideas (structured data, separating content from presentation) but rough tooling. The original `resume-cli` is unmaintained. Its replacement `resumed` works but the npm theme ecosystem is broken: CJS/ESM conflicts, JSX themes that require compilation, phantom peer dependencies, and themes that crash on missing fields. PDF export depends on Puppeteer.

This project replaces that entire pipeline with a single client-side app: 10 built-in themes as pure template-literal functions, a form editor for every schema field, a PDF resume parser modeled after [OpenResume](https://github.com/xitanggg/open-resume), and export to JSON/HTML/PDF via the browser's native print dialog.

## Architecture

```
src/
  themes/         10 themes, each a pure (resume) => html function
  parser/         4-step PDF parsing pipeline + DOCX/text fallback
  store/          Zustand store with localStorage persistence
  components/     React components (editor, preview, import/export, theme picker)
  types/          JSON Resume v1.0.0 TypeScript types
  test/           159 tests including PDF roundtrip (parse, rebuild and re-export)
```

### Schema

Uses [JSON Resume v1.0.0](https://jsonresume.org/schema) -- the open standard for structured resumes. The `ResumeSchema` TypeScript type covers all 14 sections: basics, work, volunteer, education, awards, certificates, publications, skills, languages, interests, references, projects, and meta. All fields are optional; the schema allows `additionalProperties` for custom data.

The type definition lives in `src/types/resume.ts`, derived from the `jsonresume-theme-even` package's auto-generated types.

### Themes

Each theme is a pure function with the signature `(resume: ResumeSchema) => string`. No React, no JSX, no virtual DOM at runtime. Just template literals returning self-contained HTML documents with inlined CSS.

This design was a deliberate response to the npm theme ecosystem's problems. By writing themes as plain functions:

- No CJS/ESM compatibility issues
- No build step, no peer dependencies
- Themes work identically in Node.js, browsers, tests, and email rendering
- Every theme handles missing fields gracefully (no crashes on empty sections)
- Every theme includes `@media print` rules for clean PDF output

| Theme        | Visual                                                                |
| ------------ | --------------------------------------------------------------------- |
| Modern       | Sans-serif, generous whitespace, minimal decoration                   |
| Classic      | Georgia serif, traditional single-column, formal borders              |
| Compact      | 11.5px base, tight spacing, designed to fit one printed page          |
| Professional | Blue (#2563eb) accents, colored section underlines, card-style skills |
| Creative     | Gradient header, colorful skill tags, rounded corners                 |
| Academic     | LaTeX-inspired serif, justified text, definition-list skills          |
| Dark         | Navy (#0f172a) background, cyan accents, full print override to light |
| Sidebar      | Two-column: 280px dark sidebar (contact, skills) + main content area  |
| Timeline     | Vertical timeline with dots and connecting lines for experience       |
| Minimal      | No colors, no borders, pure text hierarchy via size and weight        |

### Parser

The PDF parser follows the approach described in [OpenResume](https://github.com/xitanggg/open-resume)'s `parse-resume-from-pdf` module. It's a 4-step pipeline that preserves spatial and typographic information from the PDF for accurate field extraction.

#### Step 1: Extract text items (`pdfParser.ts`)

Uses Mozilla's [pdf.js](https://mozilla.github.io/pdf.js/) (`pdfjs-dist`) to extract raw text items from each PDF page. Unlike naive text extraction that discards layout, this preserves per-item metadata:

- `text` -- the string content
- `x`, `y` -- position on the page (origin: bottom-left)
- `width`, `height` -- bounding box dimensions
- `fontName` -- the resolved font name (e.g., `Arial-BoldMT`)
- `hasEOL` -- whether the item ends a line

Font names are resolved via `page.commonObjs.get(fontName)` to get real names instead of internal pdf.js identifiers.

#### Step 2: Group into lines (`groupLines.ts`)

Raw text items are grouped into lines using `hasEOL` flags, then adjacent items within each line are merged based on proximity.

The merge threshold is computed as the **typical character width** of the document's dominant font (most common font name + most common height). Items whose gap is less than or equal to one character width are merged, with spaces inserted at punctuation/bullet boundaries.

#### Step 3: Group into sections (`groupSections.ts`)

Lines are assigned to resume sections. Everything before the first detected section title goes into a `profile` pseudo-section.

Section title detection uses two heuristics:

1. **Primary**: The line is a single text item, the font name contains "bold" (or "semibold", "600", etc.), AND all letters are uppercase. This catches well-formatted resumes with bold uppercase headers.
2. **Fallback**: The line has at most 3 words, contains only letters/spaces, starts with a capital letter, and a word matches or starts with a known keyword (`experience`, `education`, `skill`, `project`, `language`, `volunteer`, `award`, `certificate`, `publication`, `interest`, `reference`, `summary`, `objective`, etc.).

Lines at index 0-1 are always assigned to `profile` (they're assumed to be the candidate's name and title).

#### Step 4: Extract structured fields (`extractors.ts` + `scoring.ts`)

Each resume field is extracted using a **competitive feature scoring system**. For a given field (name, email, phone, etc.), a set of weighted feature functions is defined:

```typescript
// Example: email extraction
const emailFeatures: FeatureSet[] = [
  [(i) => i.text.match(/\S+@\S+\.\S+/), 4, true], // regex match: +4
  [isBold, -1], // bold text: -1
  [isAllUpper, -1], // all uppercase: -1
  [hasParenthesis, -4], // has parens: -4
];
```

Each text item is scored against all features. The item with the highest positive score wins. Regex features can return only the matched substring. Boolean features with negative scores serve as penalties (e.g., an email shouldn't be bold or contain parentheses).

The scoring engine handles a subtlety: when a regex match fires (strong direct evidence), negative boolean features are suppressed for that item. This prevents self-contradictory feature sets from cancelling out.

**Subsection detection** (for multiple jobs, schools, or projects within a section) uses line gap analysis: compute Y-position gaps between consecutive lines, find the typical gap, and split where the gap exceeds 1.4x the typical. Falls back to bold-line detection if gap analysis yields only one subsection.

**Bullet point extraction** scans for Unicode bullet characters (`\u2022`, `\u2023`, `\u25E6`, etc.), finds the most common one, and splits the concatenated description text by that character.

#### DOCX and plain text fallback (`textToResume.ts`)

For non-PDF files, a regex-based heuristic parser handles section detection via known header strings, contact info extraction via patterns (email, phone, URL, LinkedIn), and date range parsing. This is less accurate than the PDF pipeline but works offline for any text input.

### State Management

Zustand store (`src/store/resumeStore.ts`) with the `persist` middleware for automatic localStorage save/restore. The store holds:

- `resume: ResumeSchema` -- the current resume data
- `selectedThemeId: string` -- which theme to render
- `activeSection: EditorSection` -- which editor tab is active

Immutable updates via spread operators. Each form field dispatches a targeted update (e.g., `updateBasics('name', 'John')`) rather than replacing the entire resume object.

### Preview

The rendered HTML is displayed in an `<iframe>` with `srcdoc`. This provides complete style isolation -- theme CSS can't leak into the app, and app styles can't affect the preview. The iframe also enables PDF export via `contentWindow.print()` using the browser's native print dialog.

The `html` output is memoized via `useMemo` on `[resume, themeId]`.

### Export

- **JSON**: `Blob` download of `JSON.stringify(resume, null, 2)` via `file-saver`
- **HTML**: `Blob` download of the theme's rendered HTML string
- **PDF**: `iframe.contentWindow.print()` -- opens the browser's print dialog where the user selects "Save as PDF". No Puppeteer, no server, no headless browser.

## Testing

159 tests across 9 test files:

| File                    | Tests | Coverage                                                                |
| ----------------------- | ----- | ----------------------------------------------------------------------- |
| `helpers.test.ts`       | 11    | HTML escaping, date formatting, section/link helpers                    |
| `themes.test.ts`        | 83    | All 10 themes: rendering, XSS escaping, empty data, missing fields      |
| `store.test.ts`         | 10    | Zustand store: CRUD operations, reset, sample loading                   |
| `scoring.test.ts`       | 10    | Feature scoring: positive/negative weights, regex matches, ties         |
| `groupLines.test.ts`    | 5     | Text item grouping, merging, whitespace filtering                       |
| `groupSections.test.ts` | 5     | Section title detection: bold+uppercase, keyword fallback               |
| `extractors.test.ts`    | 14    | Field extraction: profile, work, education, projects, skills, languages |
| `textToResume.test.ts`  | 7     | DOCX/text fallback parser                                               |
| `roundtrip.test.ts`     | 8     | Full PDF roundtrip (see below)                                          |

### PDF roundtrip test

The roundtrip test validates that the parser can recover structured data from its own rendered output:

1. Render `sampleResume` with the Modern theme to get HTML
2. Use Puppeteer (headless) to convert the HTML to a PDF buffer
3. Parse the PDF through the full 4-step pipeline
4. Assert that name, email, phone, work entries, education, skills, projects, and languages are all recovered

This test uses `pdfjs-dist/legacy/build/pdf.mjs` (the Node.js-compatible build) since the standard build requires `DOMMatrix` which isn't available in jsdom.

```
pnpm test
```

## Stack

| Layer           | Technology                          |
| --------------- | ----------------------------------- |
| Framework       | React 19, TypeScript 6              |
| Bundler         | Vite 8 (Rolldown)                   |
| Styling         | Tailwind CSS 4                      |
| State           | Zustand (with `persist` middleware) |
| PDF parsing     | pdfjs-dist (Mozilla pdf.js)         |
| DOCX parsing    | mammoth.js                          |
| File downloads  | file-saver                          |
| Testing         | Vitest, Puppeteer (roundtrip tests) |
| Formatting      | Prettier, lint-staged, Husky        |
| Package manager | pnpm                                |

## Scripts

```sh
pnpm dev        # start dev server
pnpm build      # type-check + production build
pnpm test       # run all 159 tests
pnpm format     # format all files with prettier
pnpm preview    # preview production build
```

## Project structure

```
src/
  types/resume.ts                     JSON Resume v1.0.0 TypeScript types
  store/resumeStore.ts                Zustand store + localStorage persistence
  themes/
    helpers.ts                        Shared: esc(), formatDate(), dateRange(), section(), link()
    types.ts                          ThemeDefinition interface
    index.ts                          Theme registry + getThemeById()
    modern.ts classic.ts compact.ts   10 theme implementations
    professional.ts creative.ts
    academic.ts dark.ts sidebar.ts
    timeline.ts minimal.ts
  parser/
    types.ts                          TextItem, Line, Lines, Sections, FeatureSet
    pdfParser.ts                      Step 1: PDF -> TextItem[] via pdf.js
    groupLines.ts                     Step 2: TextItem[] -> Lines (merge by proximity)
    groupSections.ts                  Step 3: Lines -> Sections (bold/keyword detection)
    scoring.ts                        Feature scoring engine + common feature helpers
    extractors.ts                     Step 4: Sections -> ResumeSchema fields
    docxParser.ts                     DOCX text extraction via mammoth.js
    textToResume.ts                   Regex-based fallback for DOCX/text
    index.ts                          Entry point: routes PDF vs DOCX vs JSON
  components/
    editor/                           Form components for all 12 schema sections
    preview/ResumePreview.tsx         iframe with srcdoc
    themes/ThemePicker.tsx            Theme selection grid
    import-export/                    Import (file upload / paste JSON) + Export dialogs
  utils/sample.ts                     Bundled sample resume data
  test/                               159 tests (unit + integration + roundtrip)
```
