import React, { useEffect } from 'react';
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
  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color, FontFamily],
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

  const chain = () => editor.chain().focus() as any;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-app-bg">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-white/[0.03] px-3 py-2">
        <button
          type="button"
          onClick={() => chain().toggleBold().run()}
          className={cn(
            'rounded-lg px-3 py-1 text-xs font-black uppercase tracking-widest transition-all',
            editor.isActive('bold') ? 'bg-app-accent text-app-bg' : 'bg-white/5 text-app-text'
          )}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => chain().toggleItalic().run()}
          className={cn(
            'rounded-lg px-3 py-1 text-xs font-black uppercase tracking-widest transition-all',
            editor.isActive('italic') ? 'bg-app-accent text-app-bg' : 'bg-white/5 text-app-text'
          )}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => chain().toggleBulletList().run()}
          className={cn(
            'rounded-lg px-3 py-1 text-xs font-black uppercase tracking-widest transition-all',
            editor.isActive('bulletList') ? 'bg-app-accent text-app-bg' : 'bg-white/5 text-app-text'
          )}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => chain().toggleBlockquote().run()}
          className={cn(
            'rounded-lg px-3 py-1 text-xs font-black uppercase tracking-widest transition-all',
            editor.isActive('blockquote') ? 'bg-app-accent text-app-bg' : 'bg-white/5 text-app-text'
          )}
        >
          Quote
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
        <div className="flex items-center gap-1">
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
      <EditorContent editor={editor} />
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
