import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { 
  Bold, Italic, List, ListOrdered, Quote, 
  Code, Link as LinkIcon, Image as ImageIcon, 
  Heading1, Heading2, Heading3, Undo, Redo, 
  Terminal
} from 'lucide-react';
import './RichTextEditor.css';

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  label?: string;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, label, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Handled by CodeBlockLowlight
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'editor-content',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="rich-text-editor-container">
      {label && <label className="rich-text-editor-label">{label}</label>}
      <div className="rich-text-editor">
        <div className="editor-toolbar">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
            title="Heading 1"
          >
            <Heading1 size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
            title="Heading 2"
          >
            <Heading2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
            title="Heading 3"
          >
            <Heading3 size={18} />
          </button>

          <div className="toolbar-divider" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
            title="Bold"
          >
            <Bold size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
            title="Italic"
          >
            <Italic size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`toolbar-btn ${editor.isActive('code') ? 'is-active' : ''}`}
            title="Inline Code"
          >
            <Code size={18} />
          </button>

          <div className="toolbar-divider" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
            title="Bullet List"
          >
            <List size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
            title="Ordered List"
          >
            <ListOrdered size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`toolbar-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
            title="Blockquote"
          >
            <Quote size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`toolbar-btn ${editor.isActive('codeBlock') ? 'is-active' : ''}`}
            title="Code Block"
          >
            <Terminal size={18} />
          </button>

          <div className="toolbar-divider" />

          <button
            type="button"
            onClick={addLink}
            className={`toolbar-btn ${editor.isActive('link') ? 'is-active' : ''}`}
            title="Add Link"
          >
            <LinkIcon size={18} />
          </button>
          <button
            type="button"
            onClick={addImage}
            className="toolbar-btn"
            title="Add Image"
          >
            <ImageIcon size={18} />
          </button>

          <div className="toolbar-divider" />

          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="toolbar-btn"
            title="Undo"
          >
            <Undo size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="toolbar-btn"
            title="Redo"
          >
            <Redo size={18} />
          </button>
        </div>
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>
    </div>
  );
}
