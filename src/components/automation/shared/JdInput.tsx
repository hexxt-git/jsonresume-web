import { useState, useMemo } from 'react';
import { useJdStore } from '../../../store/jdStore';
import type { SavedJd } from '../../../store/jdStore';
import { extractTextFromDocx } from '../../../parser/docxParser';
import { extractMeta, splitJds, timeAgo } from './helpers';

/* ── File reader ─────────────────────────────────────────── */

export async function readFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') {
    const { extractPdfTextItems } = await import('../../../parser/pdf-reader');
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
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-text">{label}</span>
        <div className="flex items-center gap-1.5">
          {savedFeedback && (
            <span className="text-[10px] text-accent animate-pulse">{savedFeedback}</span>
          )}
          {view === 'library' ? (
            <button
              type="button"
              onClick={() => setView('write')}
              className="text-[10px] px-2 py-0.5 rounded border border-border text-text-muted hover:text-text-secondary hover:border-accent/30 cursor-pointer transition-colors"
            >
              ← Back
            </button>
          ) : (
            <>
              {/* Single mode: save one JD */}
              {!append && value.trim() && !saving && !loadedJd && (
                <button
                  type="button"
                  onClick={handleStartSave}
                  className="text-[10px] px-2 py-0.5 rounded border border-border text-text-muted hover:text-text-secondary hover:border-accent/30 cursor-pointer transition-colors"
                >
                  Save
                </button>
              )}
              {/* Batch mode: save each unsaved JD individually */}
              {append && unsavedChunks.length > 0 && !saving && (
                <button
                  type="button"
                  onClick={handleSaveAll}
                  className="text-[10px] px-2 py-0.5 rounded border border-border text-text-muted hover:text-text-secondary hover:border-accent/30 cursor-pointer transition-colors"
                >
                  Save all ({unsavedChunks.length})
                </button>
              )}
              <label className="text-[10px] px-2 py-0.5 rounded border border-border text-text-muted hover:text-text-secondary hover:border-accent/30 cursor-pointer transition-colors">
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
        <div className="flex items-center gap-2 mb-1.5 px-2.5 py-1.5 bg-bg-secondary rounded-lg border-l-2 border-l-accent">
          <span className="text-[10px] text-text-secondary truncate flex-1">
            {loadedJd.title}
            {loadedJd.company ? ` · ${loadedJd.company}` : ''}
          </span>
          {isModified && (
            <button
              type="button"
              onClick={handleUpdateLoaded}
              className="text-[10px] px-2 py-0.5 bg-accent text-white rounded hover:opacity-90 cursor-pointer shrink-0"
            >
              Update
            </button>
          )}
          <button
            type="button"
            onClick={() => setLoadedJdId(null)}
            className="text-text-muted hover:text-text-secondary cursor-pointer text-sm leading-none shrink-0"
          >
            ×
          </button>
        </div>
      )}

      {/* ─── Inline save form (single mode only) ─────────── */}
      {!append && saving && (
        <div className="flex items-center gap-1.5 mb-1.5 p-1.5 border border-border rounded-lg bg-bg-secondary flex-wrap">
          <input
            value={saveTitle}
            onChange={(e) => setSaveTitle(e.target.value)}
            placeholder="Title"
            className="flex-1 min-w-[80px] px-2 py-1 text-[10px] border border-border-input bg-bg-input text-text rounded focus:outline-none focus:ring-1 focus:ring-accent"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setSaving(false);
            }}
          />
          <input
            value={saveCompany}
            onChange={(e) => setSaveCompany(e.target.value)}
            placeholder="Company"
            className="flex-1 min-w-[80px] px-2 py-1 text-[10px] border border-border-input bg-bg-input text-text rounded focus:outline-none focus:ring-1 focus:ring-accent"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setSaving(false);
            }}
          />
          <button
            type="button"
            onClick={handleSave}
            className="text-[10px] px-2.5 py-1 bg-accent text-white rounded hover:opacity-90 cursor-pointer shrink-0"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setSaving(false)}
            className="text-text-muted hover:text-text-secondary cursor-pointer text-sm leading-none shrink-0"
          >
            ×
          </button>
        </div>
      )}

      {/* ─── Write view ──────────────────────────────────── */}
      {view === 'write' && (
        <>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full px-3 py-2 text-xs border border-border-input bg-bg-input text-text rounded-lg focus:outline-none focus:ring-1 focus:ring-accent resize-y"
          />

          {/* Recent JDs */}
          {items.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-text-muted uppercase tracking-wide">
                  Recent
                </span>
                <button
                  type="button"
                  onClick={openLibrary}
                  className="text-[10px] text-text-muted hover:text-accent cursor-pointer transition-colors"
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
                      className={`flex-1 min-w-0 text-left px-2.5 py-2 rounded-lg border transition-colors ${
                        added
                          ? 'border-accent/30 bg-accent/5 cursor-default'
                          : loadedJdId === jd.id
                            ? 'border-accent/50 bg-accent/5 cursor-pointer'
                            : 'border-border hover:border-accent/30 hover:bg-bg-hover cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        {append && (
                          <span
                            className={`text-[10px] shrink-0 ${added ? 'text-accent' : 'text-text-muted'}`}
                          >
                            {added ? '✓' : '+'}
                          </span>
                        )}
                        <span className="text-[11px] font-medium text-text truncate">
                          {jd.title}
                        </span>
                      </div>
                      <div className="text-[10px] text-text-muted truncate mt-0.5">
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
          className="border border-border-input rounded-lg overflow-hidden"
          style={{ minHeight: `${rows * 1.5}rem` }}
        >
          {/* Search + sort header */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-border bg-bg-secondary">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setConfirmDeleteId(null);
              }}
              placeholder="Search titles, companies, or content..."
              className="flex-1 min-w-0 text-[10px] bg-transparent text-text outline-none placeholder:text-text-faint"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') setView('write');
              }}
            />
            <button
              type="button"
              onClick={() => setSort((s) => (s === 'recent' ? 'alpha' : 'recent'))}
              className="text-[10px] text-text-muted hover:text-text-secondary cursor-pointer shrink-0"
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
                <div className="text-[10px] text-text-muted">
                  {items.length === 0 ? 'No saved job descriptions yet' : 'No matches found'}
                </div>
                {items.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setView('write')}
                    className="text-[10px] text-accent hover:underline cursor-pointer mt-1"
                  >
                    Write one to get started
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredItems.map((jd) => {
                  const added = isAdded(jd);
                  return (
                    <div key={jd.id} className="group relative">
                      {editingId === jd.id ? (
                        /* ── Inline edit mode ── */
                        <div className="px-3 py-2.5 space-y-1.5">
                          <div className="flex gap-1.5">
                            <input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="flex-1 min-w-0 px-2 py-1 text-[10px] border border-border-input bg-bg-input text-text rounded focus:outline-none focus:ring-1 focus:ring-accent"
                              placeholder="Title"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                            <input
                              value={editCompany}
                              onChange={(e) => setEditCompany(e.target.value)}
                              className="flex-1 min-w-0 px-2 py-1 text-[10px] border border-border-input bg-bg-input text-text rounded focus:outline-none focus:ring-1 focus:ring-accent"
                              placeholder="Company"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                          </div>
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="text-[10px] px-2 py-0.5 text-text-muted hover:text-text-secondary cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              className="text-[10px] px-2.5 py-0.5 bg-accent text-white rounded cursor-pointer hover:opacity-90"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── Normal item ── */
                        <button
                          type="button"
                          onClick={() => handleLoad(jd)}
                          disabled={added}
                          className={`w-full text-left px-3 py-2.5 transition-colors ${
                            added
                              ? 'bg-accent/5 cursor-default'
                              : 'hover:bg-bg-hover cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {append && (
                              <span
                                className={`text-[10px] shrink-0 ${added ? 'text-accent' : 'text-text-muted'}`}
                              >
                                {added ? '✓' : '+'}
                              </span>
                            )}
                            <span className="text-xs font-medium text-text truncate flex-1">
                              {jd.title}
                              {jd.company && (
                                <span className="font-normal text-text-muted"> · {jd.company}</span>
                              )}
                            </span>
                            <span className="text-[10px] text-text-faint shrink-0">
                              {added ? 'Added' : timeAgo(jd.lastUsedAt)}
                            </span>
                          </div>
                          <div
                            className={`text-[10px] text-text-faint truncate mt-0.5 ${append ? 'ml-4' : ''}`}
                          >
                            {jd.content.slice(0, 100)}
                          </div>
                        </button>
                      )}

                      {/* Hover actions */}
                      {editingId !== jd.id && (
                        <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-0.5 bg-bg-secondary/90 backdrop-blur-sm rounded px-1 py-0.5 shadow-sm border border-border">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(jd);
                            }}
                            className="text-[10px] text-text-muted hover:text-text-secondary cursor-pointer px-1"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(jd.id);
                            }}
                            className={`text-[10px] cursor-pointer px-1 ${
                              confirmDeleteId === jd.id
                                ? 'text-danger font-medium'
                                : 'text-text-muted hover:text-danger'
                            }`}
                          >
                            {confirmDeleteId === jd.id ? 'Sure?' : 'Del'}
                          </button>
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
