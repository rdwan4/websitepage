import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import TextStyle, { FontSize } from '@tiptap/extension-text-style';
import { useCallback } from 'react';

const FONT_OPTIONS = [
  { label: 'Sans', value: 'var(--app-font-sans)' },
  { label: 'Serif', value: 'var(--app-font-serif)' },
  { label: 'Arabic', value: '"Noto Naskh Arabic", "Amiri", serif' },
  { label: 'Amiri', value: '"Amiri", "Noto Naskh Arabic", serif' },
  { label: 'Mono', value: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace' },
];

const FONT_SIZE_OPTIONS = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px'];

const COLOR_OPTIONS = ['#f8fafc', '#10b981', '#f59e0b', '#ef4444', '#38bdf8', '#a78bfa', '#f472b6'];

const ToolbarButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-lg px-3 py-1 text-xs font-black uppercase tracking-widest transition-all bg-white/5 text-app-text"
  >
    {children}
  </button>
);

const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const setFontFamily = useCallback((fontFamily: string) => {
    editor.chain().focus().setFontFamily(fontFamily).run();
  }, [editor]);

  const setFontSize = useCallback((fontSize: string) => {
    editor.chain().focus().setFontSize(fontSize).run();
  }, [editor]);
  
  const setColor = useCallback((color: string) => {
    editor.chain().focus().setColor(color).run();
  }, [editor]);

  return (
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
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()}>Bold</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()}>Italic</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()}>List</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()}>Quote</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolbarButton>
          <select
            onChange={(e) => setFontFamily(e.target.value)}
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
            onChange={(e) => setFontSize(e.target.value)}
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
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Set color ${color}`}
                onClick={() => setColor(color)}
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
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontSize,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
        attributes: {
            class: 'min-h-[180px] rounded-b-xl bg-app-bg px-4 py-3 text-app-text focus:outline-none'
        }
    }
  });

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-app-bg">
      <EditorToolbar editor={editor} />
      <div className="max-h-[260px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
