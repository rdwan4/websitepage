import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { normalizeEditorHtml } from '../lib/postContent';

const FONT_OPTIONS = [
  { label: 'Sans', value: 'var(--app-font-sans)' },
  { label: 'Serif', value: 'var(--app-font-serif)' },
  { label: 'Arabic', value: '"Noto Naskh Arabic", "Amiri", serif' },
  { label: 'Amiri', value: '"Amiri", "Noto Naskh Arabic", serif' },
  { label: 'Mono', value: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace' },
];

const COLOR_OPTIONS = ['#f8fafc', '#10b981', '#f59e0b', '#ef4444', '#38bdf8', '#a78bfa', '#f472b6'];
const FONT_SIZE_OPTIONS = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px'];

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeInitialHtml = (value: string) => normalizeEditorHtml(value) || '<p></p>';

const buildStyledSpan = (html: string, styles: Record<string, string>) => {
  const styleText = Object.entries(styles)
    .filter(([, styleValue]) => styleValue)
    .map(([key, styleValue]) => `${key}: ${styleValue}`)
    .join('; ');

  return `<span style="${styleText}">${html}</span>`;
};

export const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  dir = 'ltr',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dir?: 'ltr' | 'rtl';
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const rememberSelectionTimeoutRef = useRef<number | null>(null);
  const [customFontSize, setCustomFontSize] = useState('16');
  const [isFocused, setIsFocused] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!value.trim());

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML === value) return;
    if (document.activeElement === editor) return;

    editor.innerHTML = normalizeInitialHtml(value);
    setIsEmpty(!editor.textContent?.trim());
  }, [value]);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const html = editor.innerHTML === '<br>' ? '' : editor.innerHTML;
    setIsEmpty(!editor.textContent?.trim());
    onChange(html);
  };

  const rememberSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;

    savedRangeRef.current = range.cloneRange();
  };

  const queueRememberSelection = () => {
    if (typeof window === 'undefined') return;

    if (rememberSelectionTimeoutRef.current) {
      window.clearTimeout(rememberSelectionTimeoutRef.current);
    }

    rememberSelectionTimeoutRef.current = window.setTimeout(() => {
      rememberSelection();
      rememberSelectionTimeoutRef.current = null;
    }, 0);
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    const savedRange = savedRangeRef.current;

    if (!editor || !selection || !savedRange) return;

    editor.focus();
    selection.removeAllRanges();
    selection.addRange(savedRange.cloneRange());
  };

  const focusEditor = () => {
    editorRef.current?.focus();
    restoreSelection();
  };

  const runCommand = (command: string, commandValue?: string) => {
    focusEditor();
    rememberSelection();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, commandValue);
    emitChange();
    rememberSelection();
  };

  const applyInlineStyle = (styles: Record<string, string>) => {
    focusEditor();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) return;

    const selectedText = range.toString();
    const selectedHtml = range.cloneContents();
    const wrapper = document.createElement('div');
    wrapper.appendChild(selectedHtml);
    const html = wrapper.innerHTML;

    if (!selectedText && !html) {
      const marker = buildStyledSpan('\u200b', styles);
      document.execCommand('insertHTML', false, marker);
      emitChange();
      rememberSelection();
      return;
    }

    const finalHtml = buildStyledSpan(html || escapeHtml(selectedText), styles);
    document.execCommand('insertHTML', false, finalHtml);
    emitChange();
    rememberSelection();
  };

  const applyFontFamily = (fontFamily: string) => {
    applyInlineStyle({ 'font-family': fontFamily });
  };

  const applyFontSize = (fontSize: string) => {
    applyInlineStyle({ 'font-size': fontSize });
  };

  const toolbarButtonClass =
    'rounded-lg px-3 py-1 text-xs font-black uppercase tracking-widest transition-all';

  const preserveEditorSelection = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    focusEditor();
  };

  const preserveEditorSelectionOnTouch = (event: React.TouchEvent<HTMLElement>) => {
    event.preventDefault();
    focusEditor();
  };

  const captureSelectionBeforeControlFocus = () => {
    queueRememberSelection();
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      queueRememberSelection();
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (rememberSelectionTimeoutRef.current && typeof window !== 'undefined') {
        window.clearTimeout(rememberSelectionTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-app-bg">
      <div className="border-b border-white/10 bg-white/[0.03]">
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-app-accent">
            Text Tools
          </span>
          <span className="text-[10px] text-app-muted">
            Select a word or line, then style it
          </span>
        </div>
        <div className="rich-editor-toolbar overflow-x-auto px-3 pb-3">
          <div className="flex min-w-max flex-wrap items-center gap-2">
            <button
              type="button"
              onMouseDown={preserveEditorSelection}
              onTouchStart={preserveEditorSelectionOnTouch}
              onClick={() => runCommand('bold')}
              className={cn(toolbarButtonClass, 'bg-white/5 text-app-text')}
            >
              Bold
            </button>
            <button
              type="button"
              onMouseDown={preserveEditorSelection}
              onTouchStart={preserveEditorSelectionOnTouch}
              onClick={() => runCommand('italic')}
              className={cn(toolbarButtonClass, 'bg-white/5 text-app-text')}
            >
              Italic
            </button>
            <button
              type="button"
              onMouseDown={preserveEditorSelection}
              onTouchStart={preserveEditorSelectionOnTouch}
              onClick={() => runCommand('insertUnorderedList')}
              className={cn(toolbarButtonClass, 'bg-white/5 text-app-text')}
            >
              List
            </button>
            <button
              type="button"
              onMouseDown={preserveEditorSelection}
              onTouchStart={preserveEditorSelectionOnTouch}
              onClick={() => runCommand('formatBlock', 'blockquote')}
              className={cn(toolbarButtonClass, 'bg-white/5 text-app-text')}
            >
              Quote
            </button>
            <button
              type="button"
              onMouseDown={preserveEditorSelection}
              onTouchStart={preserveEditorSelectionOnTouch}
              onClick={() => runCommand('formatBlock', 'h2')}
              className={cn(toolbarButtonClass, 'bg-white/5 text-app-text')}
            >
              H2
            </button>
            <button
              type="button"
              onMouseDown={preserveEditorSelection}
              onTouchStart={preserveEditorSelectionOnTouch}
              onClick={() => runCommand('formatBlock', 'h3')}
              className={cn(toolbarButtonClass, 'bg-white/5 text-app-text')}
            >
              H3
            </button>
            <select
              defaultValue=""
              onPointerDown={captureSelectionBeforeControlFocus}
              onTouchStart={captureSelectionBeforeControlFocus}
              onChange={(e) => {
                if (!e.target.value) return;
                applyFontFamily(e.target.value);
                e.target.value = '';
              }}
              className="rounded-lg border border-white/10 bg-app-bg px-2 py-1 text-xs text-app-text outline-none"
            >
              <option value="">Font</option>
              {FONT_OPTIONS.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
            <select
              defaultValue=""
              onPointerDown={captureSelectionBeforeControlFocus}
              onTouchStart={captureSelectionBeforeControlFocus}
              onChange={(e) => {
                if (!e.target.value) return;
                applyFontSize(e.target.value);
                e.target.value = '';
              }}
              className="rounded-lg border border-white/10 bg-app-bg px-2 py-1 text-xs text-app-text outline-none"
            >
              <option value="">Size</option>
              {FONT_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-app-bg px-2 py-1">
              <input
                type="number"
                min={8}
                max={96}
                value={customFontSize}
                onPointerDown={captureSelectionBeforeControlFocus}
                onTouchStart={captureSelectionBeforeControlFocus}
                onChange={(e) => setCustomFontSize(e.target.value)}
                className="w-12 bg-transparent text-xs text-app-text outline-none"
              />
              <button
                type="button"
                onMouseDown={preserveEditorSelection}
                onTouchStart={preserveEditorSelectionOnTouch}
                onClick={() => {
                  const size = Math.max(8, Math.min(96, Number(customFontSize) || 16));
                  applyFontSize(`${size}px`);
                }}
                className="rounded-md bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-app-text"
              >
                Px
              </button>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-app-bg px-2 py-1">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Set color ${color}`}
                  onMouseDown={preserveEditorSelection}
                  onTouchStart={preserveEditorSelectionOnTouch}
                  onClick={() => applyInlineStyle({ color })}
                  className="h-6 w-6 rounded-full border-2 border-transparent transition-all hover:border-white"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-h-[260px] overflow-y-auto">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          dir={dir}
          onMouseUp={queueRememberSelection}
          onTouchEnd={queueRememberSelection}
          onKeyUp={queueRememberSelection}
          onInput={emitChange}
          onBlur={() => {
            setIsFocused(false);
            queueRememberSelection();
            emitChange();
          }}
          onFocus={() => setIsFocused(true)}
          className={cn(
            'min-h-[180px] rounded-b-xl bg-app-bg px-4 py-3 text-app-text focus:outline-none',
            dir === 'rtl' && 'text-right'
          )}
          dangerouslySetInnerHTML={{ __html: normalizeInitialHtml(value) }}
        />
      </div>

      {!isFocused && isEmpty && placeholder ? (
        <div
          className={cn(
            'pointer-events-none -mt-[172px] px-4 py-3 text-sm text-app-muted/70',
            dir === 'rtl' && 'text-right'
          )}
        >
          {placeholder}
        </div>
      ) : null}
    </div>
  );
};
