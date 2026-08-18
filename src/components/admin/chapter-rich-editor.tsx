"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension } from "@tiptap/core";
import { TableKit } from "@tiptap/extension-table/kit";
import { useRef, useState, useCallback } from "react";
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
  FileUp,
  AlertTriangle,
} from "lucide-react";
import { compressDataUrl, compressAllDataUrls } from "@/lib/client-image-compress";
import { importDocxAsHtml } from "@/lib/docx-import";

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

function hasBrokenImages(html: string): boolean {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const imgs = Array.from(doc.querySelectorAll("img"));
  return imgs.some((img) => {
    const src = img.getAttribute("src") || "";
    return !src || /^file:/i.test(src) || /^blob:/i.test(src);
  });
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
  const [importing, setImporting] = useState(false);
  const [wordWarning, setWordWarning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const docxRef = useRef<HTMLInputElement>(null);

  const insertHtml = useCallback(
    (html: string) => {
      const editor = instanceRef.current;
      if (!editor) return;
      editor.commands.setContent(html);
    },
    []
  );

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

        // Check for image files in clipboard (Word paste includes images as items)
        const imageItems = Array.from(clip.items).filter((item) =>
          item.type.startsWith("image/")
        );

        if (imageItems.length > 0) {
          event.preventDefault();

          // Extract images from clipboard asynchronously
          (async () => {
            const imageMap = new Map<string, string>();
            for (let i = 0; i < imageItems.length; i++) {
              const blob = imageItems[i].getAsFile();
              if (!blob) continue;
              const dataUrl = await compressDataUrl(await fileToDataUrl(blob));
              imageMap.set(`clipboard-img-${i}`, dataUrl);
            }

            // Try to get HTML, replace broken image URLs with clipboard images
            const html = clip.getData("text/html") || null;
            if (html && imageMap.size > 0) {
              const doc = new DOMParser().parseFromString(html, "text/html");
              const imgs = doc.querySelectorAll("img");
              let imgIdx = 0;
              imgs.forEach((img) => {
                const src = img.getAttribute("src") || "";
                const isBroken = !src || /^file:/i.test(src) || /^blob:/i.test(src) || src.startsWith("data:");
                if (isBroken && imgIdx < imageMap.size) {
                  img.setAttribute("src", imageMap.get(`clipboard-img-${imgIdx}`) || "");
                  imgIdx++;
                }
              });
              const cleanHtml = doc.body.innerHTML;
              if (cleanHtml.trim()) {
                editor?.commands.insertContent(cleanHtml);
                setWordWarning(false);
                return;
              }
            }

            // Fallback: insert images directly
            for (const dataUrl of imageMap.values()) {
              editor?.chain().focus().setImage({ src: dataUrl }).run();
            }
            setWordWarning(false);
          })();

          return true;
        }

        // No images — handle text/html paste as before
        const html = clip.getData("text/html") || null;
        if (!html) return false;
        event.preventDefault();

        if (hasBrokenImages(html)) {
          setWordWarning(true);
          const doc = new DOMParser().parseFromString(html, "text/html");
          doc.querySelectorAll("img").forEach((img) => {
            const src = img.getAttribute("src") || "";
            if (!src || /^file:/i.test(src) || /^blob:/i.test(src)) {
              img.remove();
            }
          });
          const cleanHtml = doc.body.innerHTML;
          if (cleanHtml.trim()) {
            editor?.commands.insertContent(cleanHtml);
          }
        } else {
          editor?.commands.insertContent(html);
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

  // Keep a stable ref so insertHtml can access the editor instance
  const instanceRef = useRef(editor);
  instanceRef.current = editor;

  async function handleDocxImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setImporting(true);
    setError(null);
    try {
      const html = await importDocxAsHtml(f);
      insertHtml(html);
      setWordWarning(false);
      setSaved(false);
    } catch (err: any) {
      setError(err?.message || "Word file import failed");
    } finally {
      setImporting(false);
      if (docxRef.current) docxRef.current.value = "";
    }
  }

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

      {wordWarning && (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-700 dark:bg-amber-950">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="flex-1 space-y-1">
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Word se paste kiya gaya hai — images paste nahi ho sakti.
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Images ke liye Word file (.docx) select karein — mammoth server-side images extract karega.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <input
                ref={docxRef}
                type="file"
                accept=".doc,.docx"
                className="hidden"
                onChange={handleDocxImport}
              />
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
