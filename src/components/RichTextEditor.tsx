import React, { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Extension } from '@tiptap/core';
import { cn } from '../lib/utils';

const FONT_OPTIONS = [
  { label: 'Sans', value: 'var(--app-font-sans)' },
  { label: 'Serif', value: 'var(--app-font-serif)' },
  { label: 'Arabic', value: '"Noto Naskh Arabic", "Amiri", serif' },
  { label: 'Amiri', value: '"Amiri", "Noto Naskh Arabic", serif' },
  { label: 'Mono', value: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace' },
];

const COLOR_OPTIONS = ['#f8fafc', '#10b981', '#f59e0b', '#ef4444', '#38bdf8', '#a78bfa', '#f472b6'];
const FONT_SIZE_OPTIONS = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px'];

const FontFamily = Extension.create({
  name: 'fontFamily',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element) => element.style.fontFamily || null,
            renderHTML: (attributes) => {
              if (!attributes.fontFamily) return {};
              return { style: `font-family: ${attributes.fontFamily}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontFamily:
        (fontFamily: string) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontFamily }).run(),
      unsetFontFamily:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontFamily: null }).removeEmptyTextStyle().run(),
    } as any;
  },
});

const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    } as any;
  },
});

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
  const [customFontSize, setCustomFontSize] = useState('16');
  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color, FontFamily, FontSize],
    content: value || '<p></p>',
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'min-h-[180px] rounded-b-xl bg-app-bg px-4 py-3 text-app-text focus:outline-none',
          dir === 'rtl' && 'text-right'
        ),
        'data-placeholder': placeholder || '',
        dir,
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() === value) return;
    editor.commands.setContent(value || '<p></p>', { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;

  const currentColor = editor.getAttributes('textStyle').color || '#f8fafc';
  const currentFont = editor.getAttributes('textStyle').fontFamily || FONT_OPTIONS[0].value;
  const currentFontSize = editor.getAttributes('textStyle').fontSize || '16px';

  const chain = () => editor.chain().focus() as any;
  const toolbarButtonClass =
    'rounded-lg px-3 py-1 text-xs font-black uppercase tracking-widest transition-all';

  useEffect(() => {
    setCustomFontSize(String(parseInt(currentFontSize, 10) || 16));
  }, [currentFontSize]);

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
              onClick={() => chain().toggleBold().run()}
              className={cn(
                toolbarButtonClass,
                editor.isActive('bold') ? 'bg-app-accent text-app-bg' : 'bg-white/5 text-app-text'
              )}
            >
              Bold
            </button>
            <button
              type="button"
              onClick={() => chain().toggleItalic().run()}
              className={cn(
                toolbarButtonClass,
                editor.isActive('italic') ? 'bg-app-accent text-app-bg' : 'bg-white/5 text-app-text'
              )}
            >
              Italic
            </button>
            <button
              type="button"
              onClick={() => chain().toggleBulletList().run()}
              className={cn(
                toolbarButtonClass,
                editor.isActive('bulletList') ? 'bg-app-accent text-app-bg' : 'bg-white/5 text-app-text'
              )}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => chain().toggleBlockquote().run()}
              className={cn(
                toolbarButtonClass,
                editor.isActive('blockquote') ? 'bg-app-accent text-app-bg' : 'bg-white/5 text-app-text'
              )}
            >
              Quote
            </button>
            <button
              type="button"
              onClick={() => chain().toggleHeading({ level: 2 }).run()}
              className={cn(
                toolbarButtonClass,
                editor.isActive('heading', { level: 2 }) ? 'bg-app-accent text-app-bg' : 'bg-white/5 text-app-text'
              )}
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => chain().toggleHeading({ level: 3 }).run()}
              className={cn(
                toolbarButtonClass,
                editor.isActive('heading', { level: 3 }) ? 'bg-app-accent text-app-bg' : 'bg-white/5 text-app-text'
              )}
            >
              H3
            </button>
            <select
              value={currentFont}
              onChange={(e) => chain().setFontFamily(e.target.value).run()}
              className="rounded-lg border border-white/10 bg-app-bg px-2 py-1 text-xs text-app-text outline-none"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
            <select
              value={currentFontSize}
              onChange={(e) => chain().setFontSize(e.target.value).run()}
              className="rounded-lg border border-white/10 bg-app-bg px-2 py-1 text-xs text-app-text outline-none"
            >
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
                onChange={(e) => setCustomFontSize(e.target.value)}
                className="w-12 bg-transparent text-xs text-app-text outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const size = Math.max(8, Math.min(96, Number(customFontSize) || 16));
                  chain().setFontSize(`${size}px`).run();
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
                  onClick={() => chain().setColor(color).run()}
                  className={cn(
                    'h-6 w-6 rounded-full border-2 transition-all',
                    currentColor === color ? 'border-white' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="max-h-[260px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
      {!editor.getText().trim() && placeholder ? (
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
