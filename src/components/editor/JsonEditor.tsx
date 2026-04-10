import { useState, useCallback, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useResumeStore } from '../../store/resumeStore';
import resumeSchema from '../../utils/resumeSchema.json';
import { saveAs } from 'file-saver';

export function JsonEditor() {
  const resume = useResumeStore((s) => s.resume);
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
      const name = useResumeStore.getState().resume.basics?.name?.replace(/\s+/g, '_') || 'resume';
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
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-200 shrink-0">
        <span className="text-xs text-gray-400">
          {error ? <span className="text-red-500">{error}</span> : 'JSON Resume v1.0.0'}
        </span>
        <button
          onClick={handleFormat}
          className="text-xs px-2 py-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded cursor-pointer"
        >
          Format
        </button>
      </div>
      <div className="flex-1">
        <Editor
          defaultLanguage="json"
          defaultValue={JSON.stringify(resume, null, 2)}
          onChange={handleChange}
          onMount={handleMount}
          theme="vs-light"
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
