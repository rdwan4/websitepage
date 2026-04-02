import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';

import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Quote, 
  Undo, 
  Redo, 
  Type,
  Palette
} from 'lucide-react';
import { cn } from '../lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  lang?: 'en' | 'ar';
}

const MenuButton = ({ 
  onClick, 
  isActive = false, 
  disabled = false, 
  children, 
  title 
}: { 
  onClick: () => void; 
  isActive?: boolean; 
  disabled?: boolean; 
  children: React.ReactNode;
  title?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "h-9 w-9 flex items-center justify-center rounded-lg transition-all",
      isActive 
        ? "bg-app-accent text-app-bg shadow-lg shadow-app-accent/20" 
        : "text-app-muted hover:bg-white/5 hover:text-white disabled:opacity-30"
    )}
  >
    {children}
  </button>
);

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, placeholder, lang = 'en' }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-invert max-w-none min-h-[200px] outline-none px-4 py-3 focus:ring-0',
          lang === 'ar' ? 'text-right' : 'text-left'
        ),
      },
    },
  });

  if (!editor) return null;

  const colors = [
    { name: 'Default', value: '#f8fafc' }, // app-text
    { name: 'Accent', value: '#10b981' }, // app-accent
    { name: 'Gold', value: '#fbbf24' },   // gold
    { name: 'Red', value: '#f87171' },    // red-400
    { name: 'Muted', value: '#94a3b8' },  // app-muted
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-app-bg overflow-hidden flex flex-col focus-within:border-app-accent/40 transition-colors">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-white/[0.02] border-b border-white/5">
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </MenuButton>

        <div className="w-px h-6 bg-white/5 mx-1" />

        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </MenuButton>

        <div className="w-px h-6 bg-white/5 mx-1" />

        <MenuButton 
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </MenuButton>

        <div className="w-px h-6 bg-white/5 mx-1" />

        {/* Color Palette */}
        <div className="flex items-center gap-1 ml-1">
          {colors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => editor.chain().focus().setColor(color.value).run()}
              className={cn(
                "h-6 w-6 rounded-full border border-white/10 transition-transform active:scale-95",
                editor.isActive('textStyle', { color: color.value }) && "scale-110 ring-2 ring-white/20 ring-offset-2 ring-offset-app-bg"
              )}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>

        <div className="flex-1" />

        <MenuButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo className="h-4 w-4" />
        </MenuButton>
      </div>

      {/* Editor Content Area */}
      <div className="relative">
        {editor.isEmpty && placeholder && (
          <div className={cn(
            "absolute top-3 px-4 pointer-events-none text-app-muted/50 text-sm italic",
            lang === 'ar' ? 'right-0' : 'left-0'
          )}>
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
