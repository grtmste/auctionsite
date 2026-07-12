"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rich-text tiptap px-3 py-2 text-sm",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? "" : editor.getHTML());
    },
  });

  if (!editor) {
    return (
      <div className="min-h-[220px] rounded-md border border-border bg-background" />
    );
  }

  const button = (
    action: () => void,
    active: boolean,
    icon: React.ReactNode,
    label: string
  ) => (
    <button
      type="button"
      onClick={action}
      title={label}
      className={cn(
        "rounded p-1.5 cursor-pointer transition-colors",
        active ? "bg-primary text-white" : "text-muted hover:bg-surface hover:text-foreground"
      )}
    >
      {icon}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-md border border-border bg-background">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-surface px-2 py-1.5">
        {button(
          () => editor.chain().focus().toggleBold().run(),
          editor.isActive("bold"),
          <Bold className="h-4 w-4" />,
          "Rasvane"
        )}
        {button(
          () => editor.chain().focus().toggleItalic().run(),
          editor.isActive("italic"),
          <Italic className="h-4 w-4" />,
          "Kaldkiri"
        )}
        <span className="mx-1 h-5 w-px bg-border" />
        {button(
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          editor.isActive("heading", { level: 2 }),
          <Heading2 className="h-4 w-4" />,
          "Pealkiri 2"
        )}
        {button(
          () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          editor.isActive("heading", { level: 3 }),
          <Heading3 className="h-4 w-4" />,
          "Pealkiri 3"
        )}
        <span className="mx-1 h-5 w-px bg-border" />
        {button(
          () => editor.chain().focus().toggleBulletList().run(),
          editor.isActive("bulletList"),
          <List className="h-4 w-4" />,
          "Loend"
        )}
        {button(
          () => editor.chain().focus().toggleOrderedList().run(),
          editor.isActive("orderedList"),
          <ListOrdered className="h-4 w-4" />,
          "Nummerdatud loend"
        )}
        <span className="mx-1 h-5 w-px bg-border" />
        {button(
          () => editor.chain().focus().undo().run(),
          false,
          <Undo className="h-4 w-4" />,
          "Võta tagasi"
        )}
        {button(
          () => editor.chain().focus().redo().run(),
          false,
          <Redo className="h-4 w-4" />,
          "Tee uuesti"
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
