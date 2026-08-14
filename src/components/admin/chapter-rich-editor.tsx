"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Check,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Image as ImageIcon,
} from "lucide-react";

function insertImageAsBase64(editor: Editor | null, file: File) {
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result as string;
    editor?.chain().focus().setImage({ src: dataUrl }).run();
  };
  reader.readAsDataURL(file);
}

export default function ChapterRichEditor({
  chapterId,
  initialContent,
}: {
  chapterId: string;
  initialContent: string;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image,
      Placeholder.configure({
        placeholder: "Type or paste chapter content here (text + images)...",
      }),
    ],
    content: initialContent || "",
    onUpdate: () => setSaved(false),
    editorProps: {
      attributes: {
        class:
          "chapter-content min-h-[180px] p-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary",
      },
      handlePaste: (_view, event) => {
        const files = event.clipboardData?.files;
        if (files && files.length > 0) {
          let handled = false;
          Array.from(files).forEach((file) => {
            if (file.type.startsWith("image/")) {
              handled = true;
              insertImageAsBase64(editor, file);
            }
          });
          return handled;
        }
        return false;
      },
    },
  });

  async function save() {
    if (!editor) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/chapter/${chapterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editor.getHTML() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Save failed");
        return;
      }
      setSaved(true);
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!editor) {
    return <div className="text-xs text-muted-foreground">Loading editor...</div>;
  }

  return (
    <div className="rounded-lg border p-3 bg-card space-y-2">
      <label className="text-xs font-medium text-muted-foreground">
        Chapter Content (rich text + images)
      </label>

      <div className="flex flex-wrap items-center gap-1 mb-1">
        <Button
          type="button"
          size="icon"
          variant={editor.isActive("bold") ? "default" : "outline"}
          className="h-7 w-7"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={editor.isActive("italic") ? "default" : "outline"}
          className="h-7 w-7"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={editor.isActive("heading", { level: 2 }) ? "default" : "outline"}
          className="h-7 w-7"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={editor.isActive("heading", { level: 3 }) ? "default" : "outline"}
          className="h-7 w-7"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={editor.isActive("bulletList") ? "default" : "outline"}
          className="h-7 w-7"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={editor.isActive("orderedList") ? "default" : "outline"}
          className="h-7 w-7"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-7 w-7"
          onClick={() => fileRef.current?.click()}
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) insertImageAsBase64(editor, f);
            if (fileRef.current) fileRef.current.value = "";
          }}
        />
      </div>

      <EditorContent editor={editor} />

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            "Save Content"
          )}
        </Button>
        {saved && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
}
