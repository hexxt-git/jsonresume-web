import { extractTextFromDocx } from '../../../parser/docxParser';

export async function readFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') {
    const { extractTextItemsFromPdf } = await import('../../../parser/pdfParser');
    const items = await extractTextItemsFromPdf(file);
    return items.map((i) => i.text).join(' ');
  }
  if (ext === 'docx' || ext === 'doc') return extractTextFromDocx(file);
  return file.text();
}

interface JdInputProps {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  label?: string;
  placeholder?: string;
}

export function JdInput({
  value,
  onChange,
  rows = 4,
  label = 'Job Description',
  placeholder = 'Paste the job description here...',
}: JdInputProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-text mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 text-xs border border-border-input bg-bg-input text-text rounded-lg focus:outline-none focus:ring-1 focus:ring-accent resize-y"
      />
      <label className="inline-flex items-center gap-1 mt-1 text-[10px] text-text-muted hover:text-text-secondary cursor-pointer">
        <input
          type="file"
          accept=".txt,.pdf,.doc,.docx"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const text = await readFile(file);
            onChange(value ? value + '\n\n' + text : text);
            e.target.value = '';
          }}
        />
        Or upload a file
      </label>
    </div>
  );
}
