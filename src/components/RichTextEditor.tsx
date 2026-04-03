import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle, FontFamily, FontSize } from '@tiptap/extension-text-style';
import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeEditorHtml } from '../lib/postContent';

const FONT_OPTIONS = [
  { label: 'Sans', value: 'var(--app-font-sans)' },
  { label: 'Serif', value: 'var(--app-font-serif)' },
  { label: 'Arabic', value: '"Noto Naskh Arabic", "Amiri", serif' },
  { label: 'Amiri', value: '"Amiri", "Noto Naskh Arabic", serif' },
  { label: 'Mono', value: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace' },
];

const FONT_SIZE_OPTIONS = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px'];
const COLOR_OPTIONS = ['#f8fafc', '#10b981', '#f59e0b', '#ef4444', '#38bdf8', '#a78bfa', '#f472b6'];

type SavedSelection = { from: number; to: number };

const ToolbarButton = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onMouseDown={(event) => event.preventDefault()}
    onPointerDown={(event) => event.preventDefault()}
    onClick={onClick}
    className="rounded-lg bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-widest text-app-text transition-all"
  >
    {children}
  </button>
);

const EditorToolbar = ({
  editor,
  rememberSelection,
  runWithSelection,
}: {
  editor: Editor | null;
  rememberSelection: () => void;
  runWithSelection: (command: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>) => void;
}) => {
  const [customFontSize, setCustomFontSize] = useState('16');

  if (!editor) {
    return null;
  }

  const runDirectCommand = (command: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>) => {
    command(editor.chain().focus()).run();
    rememberSelection();
  };

  const captureSelectionBeforeMenu = () => {
    rememberSelection();
  };

  return (
    <div className="border-b border-white/10 bg-white/[0.03]">
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-app-accent">
          Text Tools
        </span>
        <span className="text-[10px] text-app-muted">Select a word or line, then style it</span>
      </div>
      <div className="rich-editor-toolbar overflow-x-auto px-3 pb-3">
        <div className="flex min-w-max flex-wrap items-center gap-2">
          <ToolbarButton onClick={() => runDirectCommand((chain) => chain.toggleBold())}>
            Bold
          </ToolbarButton>
          <ToolbarButton onClick={() => runDirectCommand((chain) => chain.toggleItalic())}>
            Italic
          </ToolbarButton>
          <ToolbarButton onClick={() => runDirectCommand((chain) => chain.toggleBulletList())}>
            List
          </ToolbarButton>
          <ToolbarButton onClick={() => runDirectCommand((chain) => chain.toggleBlockquote())}>
            Quote
          </ToolbarButton>
          <ToolbarButton
            onClick={() => runDirectCommand((chain) => chain.toggleHeading({ level: 2 }))}
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            onClick={() => runDirectCommand((chain) => chain.toggleHeading({ level: 3 }))}
          >
            H3
          </ToolbarButton>
          <select
            defaultValue=""
            onPointerDown={captureSelectionBeforeMenu}
            onTouchStart={captureSelectionBeforeMenu}
            onChange={(event) => {
              const fontFamily = event.target.value;
              if (!fontFamily) return;
              runWithSelection((chain) => chain.setFontFamily(fontFamily));
              event.target.value = '';
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
            onPointerDown={captureSelectionBeforeMenu}
            onTouchStart={captureSelectionBeforeMenu}
            onChange={(event) => {
              const fontSize = event.target.value;
              if (!fontSize) return;
              runWithSelection((chain) => chain.setFontSize(fontSize));
              event.target.value = '';
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
              onPointerDown={captureSelectionBeforeMenu}
              onTouchStart={captureSelectionBeforeMenu}
              onChange={(event) => setCustomFontSize(event.target.value)}
              className="w-12 bg-transparent text-xs text-app-text outline-none"
            />
            <ToolbarButton
              onClick={() => {
                const nextSize = Math.max(8, Math.min(96, Number(customFontSize) || 16));
                runWithSelection((chain) => chain.setFontSize(`${nextSize}px`));
              }}
            >
              Px
            </ToolbarButton>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-app-bg px-2 py-1">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Set color ${color}`}
                onMouseDown={(event) => event.preventDefault()}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => runDirectCommand((chain) => chain.setColor(color))}
                className="h-6 w-6 rounded-full border-2 border-transparent transition-all hover:border-white"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
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
  const savedSelectionRef = useRef<SavedSelection | null>(null);

  const editor = useEditor({
    extensions: [StarterKit, TextStyle, FontFamily, FontSize, Color],
    content: normalizeEditorHtml(value) || '<p></p>',
    onCreate: ({ editor: instance }) => {
      const { from, to } = instance.state.selection;
      savedSelectionRef.current = { from, to };
    },
    onSelectionUpdate: ({ editor: instance }) => {
      const { from, to } = instance.state.selection;
      savedSelectionRef.current = { from, to };
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[180px] rounded-b-xl bg-app-bg px-4 py-3 text-app-text focus:outline-none ProseMirror',
        dir,
        'data-placeholder': placeholder || '',
      },
      handleDOMEvents: {
        mouseup: () => false,
        keyup: () => false,
        touchend: () => false,
      },
    },
  });

  const rememberSelection = useCallback(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    savedSelectionRef.current = { from, to };
  }, [editor]);

  const runWithSelection = useCallback(
    (command: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>) => {
      if (!editor) return;

      const savedSelection = savedSelectionRef.current;
      let chain = editor.chain().focus(undefined, { scrollIntoView: false });

      if (savedSelection) {
        chain = chain.setTextSelection(savedSelection);
      }

      command(chain).run();
      rememberSelection();
    },
    [editor, rememberSelection]
  );

  useEffect(() => {
    if (!editor) return;

    const normalizedValue = normalizeEditorHtml(value) || '<p></p>';
    if (normalizedValue === editor.getHTML()) return;

    const { from, to } = editor.state.selection;
    editor.commands.setContent(normalizedValue);

    const docSize = editor.state.doc.content.size;
    const nextFrom = Math.min(from, Math.max(1, docSize));
    const nextTo = Math.min(to, Math.max(1, docSize));
    editor.commands.setTextSelection({ from: nextFrom, to: nextTo });
    savedSelectionRef.current = { from: nextFrom, to: nextTo };
  }, [editor, value]);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-app-bg">
      <EditorToolbar editor={editor} rememberSelection={rememberSelection} runWithSelection={runWithSelection} />
      <div className="max-h-[260px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
