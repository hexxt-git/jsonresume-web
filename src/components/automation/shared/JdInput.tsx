import { useState, useMemo } from 'react';
import { CloseCircle, ArrowLeft2 } from 'iconsax-react';
import { useJdStore } from '@/store/jdStore';
import type { SavedJd } from '@/store/jdStore';
import { extractTextFromDocx } from '@/parser/docxParser';
import { extractMeta, splitJds, timeAgo } from './helpers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/utils/cn';

/* ── File reader ─────────────────────────────────────────── */

export async function readFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') {
    const { extractPdfTextItems } = await import('@/parser/pdf-reader');
    const url = URL.createObjectURL(file);
    try {
      const items = await extractPdfTextItems(url);
      return items.map((i: { text: string }) => i.text).join(' ');
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  if (ext === 'docx' || ext === 'doc') return extractTextFromDocx(file);
  return file.text();
}

/* ── Component ───────────────────────────────────────────── */

interface JdInputProps {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  label?: string;
  placeholder?: string;
  /** When true, loading from library appends with --- separator instead of replacing */
  append?: boolean;
}

export function JdInput({
  value,
  onChange,
  rows = 4,
  label = 'Job Description',
  placeholder = 'Paste the job description here...',
  append = false,
}: JdInputProps) {
  const items = useJdStore((s) => s.items);

  const [view, setView] = useState<'write' | 'library'>('write');
  const [loadedJdId, setLoadedJdId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveCompany, setSaveCompany] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'recent' | 'alpha'>('recent');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const loadedJd = useMemo(
    () => (loadedJdId ? items.find((j) => j.id === loadedJdId) : null),
    [loadedJdId, items],
  );
  const isModified = loadedJd ? value !== loadedJd.content : false;

  const recentItems = useMemo(
    () => [...items].sort((a, b) => b.lastUsedAt - a.lastUsedAt).slice(0, 3),
    [items],
  );

  const filteredItems = useMemo(() => {
    let result = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.content.toLowerCase().includes(q),
      );
    }
    return [...result].sort((a, b) =>
      sort === 'alpha' ? a.title.localeCompare(b.title) : b.lastUsedAt - a.lastUsedAt,
    );
  }, [items, search, sort]);

  /* ── Batch helpers ───────────────────────────────────────── */

  const isAdded = (jd: SavedJd) => append && value.includes(jd.content.trim());

  const unsavedChunks = useMemo(() => {
    if (!append || !value.trim()) return [];
    return splitJds(value).filter(
      (chunk) => !items.some((item) => item.content.trim() === chunk.trim()),
    );
  }, [append, value, items]);

  /* ── Handlers ────────────────────────────────────────────── */

  const handleLoad = (jd: SavedJd) => {
    if (isAdded(jd)) return;
    if (append && value.trim()) {
      onChange(value.trim() + '\n\n---\n\n' + jd.content);
      setLoadedJdId(null);
    } else {
      onChange(jd.content);
      setLoadedJdId(jd.id);
    }
    useJdStore.getState().markUsed(jd.id);
    setView('write');
    setConfirmDeleteId(null);
  };

  const handleStartSave = () => {
    const meta = extractMeta(value);
    setSaveTitle(meta.title);
    setSaveCompany(meta.company);
    setSaving(true);
  };

  const handleSave = () => {
    if (!value.trim()) return;
    const id = useJdStore.getState().save({
      title: saveTitle || 'Untitled',
      company: saveCompany,
      content: value,
    });
    setLoadedJdId(id);
    setSaving(false);
  };

  const handleSaveAll = () => {
    let count = 0;
    for (const chunk of unsavedChunks) {
      const meta = extractMeta(chunk);
      useJdStore.getState().save({
        title: meta.title || 'Untitled',
        company: meta.company,
        content: chunk,
      });
      count++;
    }
    if (count > 0) {
      setSavedFeedback(`Saved ${count}`);
      setTimeout(() => setSavedFeedback(null), 2000);
    }
  };

  const handleUpdateLoaded = () => {
    if (loadedJdId && value.trim()) {
      useJdStore.getState().update(loadedJdId, { content: value });
    }
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      useJdStore.getState().remove(id);
      if (loadedJdId === id) setLoadedJdId(null);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  const handleStartEdit = (jd: SavedJd) => {
    setEditingId(jd.id);
    setEditTitle(jd.title);
    setEditCompany(jd.company);
    setConfirmDeleteId(null);
  };

  const handleSaveEdit = () => {
    if (editingId) {
      useJdStore.getState().update(editingId, { title: editTitle, company: editCompany });
      setEditingId(null);
    }
  };

  const openLibrary = () => {
    setView('library');
    setSaving(false);
    setSearch('');
    setConfirmDeleteId(null);
    setEditingId(null);
  };

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div>
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-text text-xs font-medium">{label}</span>
        <div className="flex items-center gap-1.5">
          {savedFeedback && (
            <span className="text-accent animate-pulse text-[10px]">{savedFeedback}</span>
          )}
          {view === 'library' ? (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setView('write')}
              leftIcon={<ArrowLeft2 size={12} variant="Bold" color="currentColor" />}
              className="text-text-muted hover:text-text-secondary"
            >
              Back
            </Button>
          ) : (
            <>
              {/* Single mode: save one JD */}
              {!append && value.trim() && !saving && !loadedJd && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleStartSave}
                  className="text-text-muted hover:text-text-secondary"
                >
                  Save
                </Button>
              )}
              {/* Batch mode: save each unsaved JD individually */}
              {append && unsavedChunks.length > 0 && !saving && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleSaveAll}
                  className="text-text-muted hover:text-text-secondary"
                >
                  Save all ({unsavedChunks.length})
                </Button>
              )}
              <label className="text-text-muted hover:text-text-secondary hover:bg-bg-hover inline-flex h-6 cursor-pointer items-center justify-center rounded-md px-2 text-[10px] font-medium transition-colors">
                <input
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const text = await readFile(file);
                    onChange(value ? value + '\n\n' + text : text);
                    setLoadedJdId(null);
                    e.target.value = '';
                  }}
                />
                Upload
              </label>
            </>
          )}
        </div>
      </div>

      {/* ─── Loaded JD badge (single mode only) ──────────── */}
      {!append && loadedJd && view === 'write' && (
        <div className="bg-bg-secondary border-l-accent mb-1.5 flex items-center gap-2 rounded-lg border-l-2 px-2.5 py-1.5">
          <span className="text-text-secondary flex-1 truncate text-[10px]">
            {loadedJd.title}
            {loadedJd.company ? ` · ${loadedJd.company}` : ''}
          </span>
          {isModified && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpdateLoaded}
              className="h-6 rounded-md px-2 text-[10px]"
            >
              Update
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLoadedJdId(null)}
            className="text-text-muted hover:text-text-secondary h-6 w-6 shrink-0 p-0"
          >
            <CloseCircle size={14} variant="Bold" color="currentColor" />
          </Button>
        </div>
      )}

      {/* ─── Inline save form (single mode only) ─────────── */}
      {!append && saving && (
        <div className="bg-bg-secondary mb-1.5 flex flex-wrap items-center gap-1.5 rounded-lg border p-1.5">
          <Input
            value={saveTitle}
            onChange={(e) => setSaveTitle(e.target.value)}
            placeholder="Title"
            className="h-7 min-w-[80px] flex-1 rounded-md px-2 text-[10px]"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setSaving(false);
            }}
          />
          <Input
            value={saveCompany}
            onChange={(e) => setSaveCompany(e.target.value)}
            placeholder="Company"
            className="h-7 min-w-[80px] flex-1 rounded-md px-2 text-[10px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setSaving(false);
            }}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            className="h-7 rounded-md px-3 text-[10px]"
          >
            Save
          </Button>
          <button
            type="button"
            onClick={() => setSaving(false)}
            className="text-text-muted hover:text-text-secondary shrink-0 cursor-pointer"
          >
            <CloseCircle size={14} variant="Bold" color="currentColor" />
          </button>
        </div>
      )}

      {/* ─── Write view ──────────────────────────────────── */}
      {view === 'write' && (
        <>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="text-xs"
          />

          {/* Recent JDs */}
          {items.length > 0 && (
            <div className="mt-2">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-text-muted text-[10px] font-medium tracking-wide uppercase">
                  Recent
                </span>
                <button
                  type="button"
                  onClick={openLibrary}
                  className="text-text-muted hover:text-accent cursor-pointer text-[10px] transition-colors"
                >
                  View all{items.length > 3 ? ` (${items.length})` : ''} →
                </button>
              </div>
              <div className="flex gap-2">
                {recentItems.map((jd) => {
                  const added = isAdded(jd);
                  return (
                    <button
                      key={jd.id}
                      type="button"
                      onClick={() => handleLoad(jd)}
                      disabled={added}
                      className={`min-w-0 flex-1 rounded-lg border px-2.5 py-2 text-left transition-colors ${
                        added
                          ? 'border-accent/30 bg-accent/5 cursor-default'
                          : loadedJdId === jd.id
                            ? 'border-accent/50 bg-accent/5 cursor-pointer'
                            : 'hover:bg-bg-hover cursor-pointer'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-1">
                        {append && (
                          <span
                            className={`shrink-0 text-[10px] ${added ? 'text-accent' : 'text-text-muted'}`}
                          >
                            {added ? '✓' : '+'}
                          </span>
                        )}
                        <span className="text-text truncate text-[11px] font-medium">
                          {jd.title}
                        </span>
                      </div>
                      <div className="text-text-muted mt-0.5 truncate text-[10px]">
                        {[jd.company, timeAgo(jd.lastUsedAt)].filter(Boolean).join(' · ')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Library view ────────────────────────────────── */}
      {view === 'library' && (
        <div
          className="border-border-input overflow-hidden rounded-lg border"
          style={{ minHeight: `${rows * 1.5}rem` }}
        >
          {/* Search + sort header */}
          <div className="bg-bg-secondary flex items-center gap-1.5 border-b px-2.5 py-1.5">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setConfirmDeleteId(null);
              }}
              placeholder="Search titles, companies, or content..."
              className="h-7 flex-1 border-none bg-transparent text-[10px] shadow-none ring-0 focus:ring-0"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') setView('write');
              }}
            />
            <button
              type="button"
              onClick={() => setSort((s) => (s === 'recent' ? 'alpha' : 'recent'))}
              className="text-text-muted hover:text-text-secondary shrink-0 cursor-pointer text-[10px]"
            >
              {sort === 'recent' ? 'Recent' : 'A–Z'}
            </button>
          </div>

          {/* Items list */}
          <div
            className="overflow-y-auto"
            style={{ maxHeight: `${Math.max(rows * 1.5 - 2, 10)}rem` }}
          >
            {filteredItems.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <div className="text-text-muted text-[10px]">
                  {items.length === 0 ? 'No saved job descriptions yet' : 'No matches found'}
                </div>
                {items.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setView('write')}
                    className="text-accent mt-1 cursor-pointer text-[10px] hover:underline"
                  >
                    Write one to get started
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-border divide-y">
                {filteredItems.map((jd) => {
                  const added = isAdded(jd);
                  return (
                    <div key={jd.id} className="group relative">
                      {editingId === jd.id ? (
                        /* ── Inline edit mode ── */
                        <div className="space-y-1.5 px-3 py-2.5">
                          <div className="flex gap-1.5">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="h-7 flex-1 rounded px-2 py-1 text-[10px]"
                              placeholder="Title"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                            <Input
                              value={editCompany}
                              onChange={(e) => setEditCompany(e.target.value)}
                              className="h-7 flex-1 rounded px-2 py-1 text-[10px]"
                              placeholder="Company"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                          </div>
                          <div className="flex justify-end gap-1.5">
                            <Button variant="ghost" size="xs" onClick={() => setEditingId(null)}>
                              Cancel
                            </Button>
                            <Button size="xs" onClick={handleSaveEdit}>
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* ── Normal item ── */
                        <button
                          type="button"
                          onClick={() => handleLoad(jd)}
                          disabled={added}
                          className={`w-full px-3 py-2.5 text-left transition-colors ${
                            added
                              ? 'bg-accent/5 cursor-default'
                              : 'hover:bg-bg-hover cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {append && (
                              <span
                                className={`shrink-0 text-[10px] ${added ? 'text-accent' : 'text-text-muted'}`}
                              >
                                {added ? '✓' : '+'}
                              </span>
                            )}
                            <span className="text-text flex-1 truncate text-xs font-medium">
                              {jd.title}
                              {jd.company && (
                                <span className="text-text-muted font-normal"> · {jd.company}</span>
                              )}
                            </span>
                            <span className="text-text-faint shrink-0 text-[10px]">
                              {added ? 'Added' : timeAgo(jd.lastUsedAt)}
                            </span>
                          </div>
                          <div
                            className={`text-text-faint mt-0.5 truncate text-[10px] ${append ? 'ml-4' : ''}`}
                          >
                            {jd.content.slice(0, 100)}
                          </div>
                        </button>
                      )}

                      {/* Hover actions */}
                      {editingId !== jd.id && (
                        <div className="bg-bg-secondary/90 absolute top-2 right-2 hidden items-center gap-0.5 rounded border px-1 py-0.5 shadow-sm backdrop-blur-sm group-hover:flex">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(jd);
                            }}
                            className="h-5 px-1 font-normal lowercase"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(jd.id);
                            }}
                            className={cn(
                              'h-5 px-1 font-normal lowercase',
                              confirmDeleteId === jd.id
                                ? 'text-danger font-medium'
                                : 'text-text-muted hover:text-danger',
                            )}
                          >
                            {confirmDeleteId === jd.id ? 'Sure?' : 'Del'}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
