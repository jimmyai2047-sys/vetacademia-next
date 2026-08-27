"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import { useRef, useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Image as ImageIcon,
  Loader2,
  FileUp,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { importDocxAsHtml } from "@/lib/docx-import";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function insertImageAsBase64(editor: Editor | null, file: File) {
  fileToDataUrl(file)
    .then((dataUrl) => {
      editor?.chain().focus().setImage({ src: dataUrl }).run();
    })
    .catch(() => {});
}

function hasBrokenImages(html: string): boolean {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return Array.from(doc.querySelectorAll("img")).some((img) => {
    const src = img.getAttribute("src") || "";
    return !src || /^file:/i.test(src) || /^blob:/i.test(src);
  });
}

function stripBrokenImages(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (!src || /^file:/i.test(src) || /^blob:/i.test(src)) {
      img.remove();
    }
  });
  return doc.body.innerHTML;
}

export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const docxRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [wordWarning, setWordWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image,
      TableKit,
      Placeholder.configure({ placeholder: "Type or paste content here (text + images)..." }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "chapter-content min-h-[180px] p-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary",
      },
      handlePaste: (_view, event) => {
        const clip = event.clipboardData;
        if (!clip) return false;
        const html = clip.getData("text/html") || null;
        if (!html) return false;
        event.preventDefault();

        if (hasBrokenImages(html)) {
          setWordWarning(true);
          const clean = stripBrokenImages(html);
          if (clean.trim() && editor) {
            editor.commands.insertContent(clean);
            onChange(editor.getHTML());
          }
        } else if (editor) {
          editor.commands.insertContent(html);
          onChange(editor.getHTML());
        }
        return true;
      },
      handleDrop: (_view, event) => {
        const files = (event as DragEvent).dataTransfer?.files;
        if (!files || files.length === 0) return false;
        const imageFiles = Array.from(files).filter((f) =>
          f.type.startsWith("image/")
        );
        if (imageFiles.length === 0) return false;
        event.preventDefault();
        imageFiles.forEach((f) => insertImageAsBase64(editor, f));
        return true;
      },
    },
  });

  async function handleDocxImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !editor) return;
    setImporting(true);
    setError(null);
    try {
      const html = await importDocxAsHtml(f);
      editor.commands.setContent(html);
      onChange(editor.getHTML());
      setWordWarning(false);
    } catch (err: any) {
      setError(err?.message || "Word file import failed");
    } finally {
      setImporting(false);
      if (docxRef.current) docxRef.current.value = "";
    }
  }

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) {
    return <div className="text-xs text-muted-foreground">Loading editor...</div>;
  }

  return (
    <div className="rounded-lg border p-3 bg-card space-y-2">
      {wordWarning && (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-700 dark:bg-amber-950">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="flex-1 space-y-1">
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Pasted from Word — images cannot be pasted directly.
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              For images, select a Word file (.docx) — images will be extracted server-side using Mammoth.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={importing}
                onClick={() => docxRef.current?.click()}
              >
                {importing ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <FileUp className="h-3 w-3 mr-1" />
                )}
                {importing ? "Importing..." : "Import Word File (.docx)"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setWordWarning(false)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

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
        <input
          ref={docxRef}
          type="file"
          accept=".doc,.docx"
          className="hidden"
          onChange={handleDocxImport}
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-7 w-7"
          disabled={importing}
          onClick={() => docxRef.current?.click()}
          title="Import from Word (.docx)"
        >
          {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <EditorContent editor={editor} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
