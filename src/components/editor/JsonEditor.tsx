import { useState, useCallback, useRef } from 'react';
import Editor, { type OnMount, type BeforeMount } from '@monaco-editor/react';
import { useResumeStore, activeSlot } from '../../store/resumeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useT } from '../../i18n';
import resumeSchema from '../../utils/resumeSchema.json';
import { saveAs } from 'file-saver';

export default function JsonEditor() {
  const t = useT();
  const darkMode = useSettingsStore((s) => s.colorMode);
  const isDark =
    darkMode === 'dark' ||
    (darkMode === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  const resume = useResumeStore((s) => activeSlot(s).resume);
  const setResume = useResumeStore((s) => s.setResume);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const editorRef = useRef<Parameters<OnMount>[0]>(null);

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (!value) return;
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        try {
          const parsed = JSON.parse(value);
          setResume(parsed);
          setError(null);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Invalid JSON');
        }
      }, 400);
    },
    [setResume],
  );

  const handleBeforeMount: BeforeMount = (monaco) => {
    // Define custom dark theme BEFORE editor renders so it's available immediately
    monaco.editor.defineTheme('app-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'c3c3cb' },
        { token: 'string.key.json', foreground: 'cfbefc' },
        { token: 'string.value.json', foreground: 'a09efc' },
        { token: 'number', foreground: 'f98080' },
        { token: 'keyword', foreground: 'cfbefc' },
        { token: 'comment', foreground: '6e6e77' },
      ],
      colors: {
        'editor.background': '#18181c',
        'editor.foreground': '#c3c3cb',
        'editor.lineHighlightBackground': '#202025',
        'editor.selectionBackground': '#393944',
        'editor.inactiveSelectionBackground': '#28282e',
        'editorCursor.foreground': '#a09efc',
        'editorLineNumber.foreground': '#3b3b40',
        'editorLineNumber.activeForeground': '#6e6e77',
        'editorIndentGuide.background': '#2a2a2f',
        'editorIndentGuide.activeBackground': '#393944',
        'editorBracketMatch.background': '#28282e',
        'editorBracketMatch.border': '#393944',
        'editorWidget.background': '#202025',
        'editorWidget.border': '#2a2a2f',
        'input.background': '#202025',
        'input.border': '#393944',
        'dropdown.background': '#202025',
        'dropdown.border': '#2a2a2f',
        'list.hoverBackground': '#28282e',
        'list.activeSelectionBackground': '#222228',
        'scrollbarSlider.background': '#2a2a2f80',
        'scrollbarSlider.hoverBackground': '#39394480',
      },
    });
  };

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure JSON language defaults
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      trailingCommas: 'error',
      schemaValidation: 'warning',
      schemas: [
        {
          uri: 'jsonresume://schema',
          fileMatch: ['*'],
          schema: resumeSchema,
        },
      ],
    });

    // Cmd/Ctrl+S saves the JSON file
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const value = editor.getValue();
      const blob = new Blob([value], { type: 'application/json' });
      const name =
        activeSlot(useResumeStore.getState()).resume.basics?.name?.replace(/\s+/g, '_') || 'resume';
      saveAs(blob, `${name}.json`);
    });

    // Auto-format on load
    setTimeout(() => {
      editor.getAction('editor.action.formatDocument')?.run();
    }, 100);
  };

  const handleFormat = () => {
    editorRef.current?.getAction('editor.action.formatDocument')?.run();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 bg-bg-secondary border-b border-border shrink-0">
        <span className="text-xs text-text-muted">
          {error ? <span className="text-danger">{error}</span> : t('jsonEditor.schema')}
        </span>
        <button
          onClick={handleFormat}
          className="text-xs px-2 py-0.5 text-text-tertiary hover:text-text hover:bg-bg-tertiary rounded cursor-pointer"
        >
          {t('jsonEditor.format')}
        </button>
      </div>
      <div className="flex-1">
        <Editor
          defaultLanguage="json"
          defaultValue={JSON.stringify(resume, null, 2)}
          onChange={handleChange}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          theme={isDark ? 'app-dark' : 'vs-light'}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
            formatOnPaste: true,
            formatOnType: true,
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoIndent: 'full',
            automaticLayout: true,
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true },
            suggest: { showProperties: true },
            quickSuggestions: true,
            folding: true,
            foldingHighlight: true,
            matchBrackets: 'always',
          }}
        />
      </div>
    </div>
  );
}
