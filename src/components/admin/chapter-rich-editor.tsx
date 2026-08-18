"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension } from "@tiptap/core";
import { TableKit } from "@tiptap/extension-table/kit";
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
  Table as TableIcon,
} from "lucide-react";
import { compressDataUrl, compressAllDataUrls } from "@/lib/client-image-compress";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function insertImageAsBase64(editor: Editor | null, file: File) {
  const dataUrl = await compressDataUrl(await fileToDataUrl(file));
  editor?.chain().focus().setImage({ src: dataUrl }).run();
}

async function handleRichContent(
  editor: Editor | null,
  html: string | null,
  imageFiles: File[]
) {
  if (html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const imgs = Array.from(doc.querySelectorAll("img"));
    let fileIdx = 0;
    const tasks: Promise<void>[] = [];
    for (const img of imgs) {
      const src = img.getAttribute("src") || "";
      const broken = !src || /^file:/i.test(src) || /^blob:/i.test(src);
      if (broken && fileIdx < imageFiles.length) {
        const file = imageFiles[fileIdx++];
        tasks.push(
          fileToDataUrl(file).then(async (url) => {
            const compressed = await compressDataUrl(url);
            img.setAttribute("src", compressed);
            img.removeAttribute("srcset");
          })
        );
      }
    }
    await Promise.all(tasks);
    const finalHtml = doc.body.innerHTML;
    if (finalHtml) editor?.commands.insertContent(finalHtml);
    for (; fileIdx < imageFiles.length; fileIdx++) {
      insertImageAsBase64(editor, imageFiles[fileIdx]);
    }
  } else {
    imageFiles.forEach((f) => insertImageAsBase64(editor, f));
  }
}

// Keep inline `style` attributes (e.g. colours, alignment, fonts) coming from
// pasted Word / Google-Docs HTML so the visual formatting is preserved.
const StyleAttribute = Extension.create({
  name: "styleAttribute",
  addGlobalAttributes() {
    return [
      {
        types: [
          "paragraph",
          "heading",
          "bulletList",
          "orderedList",
          "listItem",
          "table",
          "tableRow",
          "tableCell",
          "tableHeader",
          "image",
          "blockquote",
          "codeBlock",
        ],
        attributes: {
          style: {
            default: null as string | null,
            parseHTML: (element: Element) =>
              (element as HTMLElement).getAttribute("style"),
            renderHTML: (attributes: Record<string, unknown>) => {
              const style = attributes.style as string | null | undefined;
              if (!style) return {};
              return { style };
            },
          },
        },
      },
    ];
  },
});

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
      TableKit,
      StyleAttribute,
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
        const clip = event.clipboardData;
        if (!clip) return false;
        const html = clip.getData("text/html") || null;
        const imageFiles = Array.from(clip.files || []).filter((f) =>
          f.type.startsWith("image/")
        );
        if (!html && imageFiles.length === 0) return false;
        event.preventDefault();
        handleRichContent(editor, html, imageFiles);
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
        handleRichContent(editor, null, imageFiles);
        return true;
      },
    },
  });

  async function save() {
    if (!editor) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const html = await compressAllDataUrls(editor.getHTML());
      const payloadSize = new Blob([JSON.stringify({ content: html })]).size;
      if (payloadSize > 4 * 1024 * 1024) {
        setError("Content bahut bada hai. Kam images ya chhoti images try karein.");
        setSaving(false);
        return;
      }
      const res = await fetch(`/api/admin/chapter/${chapterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: html }),
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
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-7 w-7"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          title="Insert table"
        >
          <TableIcon className="h-3.5 w-3.5" />
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
