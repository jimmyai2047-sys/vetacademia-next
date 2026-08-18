"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import { useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

// Recover images pasted/dropped from Word: Word embeds images as broken
// `file:///` srcs in the HTML, while the actual bytes arrive as clipboard
// image files. We swap each broken <img> for the next available image file
// (as an inline base64 data URI) and then insert the combined HTML so that
// tables/text flow through untouched.
async function readClipboardImages(): Promise<File[]> {
  try {
    if (!navigator.clipboard?.read) return [];
    const items = await navigator.clipboard.read();
    const files: File[] = [];
    for (const item of items) {
      for (const type of item.types) {
        if (type.startsWith("image/")) {
          const blob = await item.getType(type);
          const ext = type.split("/")[1] || "png";
          files.push(new File([blob], `clipboard.${ext}`, { type }));
        }
      }
    }
    return files;
  } catch {
    return [];
  }
}

async function handleRichContent(
  editor: Editor | null,
  html: string | null,
  imageFiles: File[]
) {
  if (html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const imgs = Array.from(doc.querySelectorAll("img"));
    const brokenImgs = imgs.filter((img) => {
      const src = img.getAttribute("src") || "";
      return !src || /^file:/i.test(src) || /^blob:/i.test(src);
    });

    if (brokenImgs.length > 0 && imageFiles.length === 0) {
      const clipboardFiles = await readClipboardImages();
      if (clipboardFiles.length > 0) imageFiles = clipboardFiles;
    }

    let fileIdx = 0;
    const tasks: Promise<void>[] = [];
    for (const img of imgs) {
      const src = img.getAttribute("src") || "";
      const broken = !src || /^file:/i.test(src) || /^blob:/i.test(src);
      if (broken && fileIdx < imageFiles.length) {
        const file = imageFiles[fileIdx++];
        tasks.push(
          fileToDataUrl(file).then((url) => {
            img.setAttribute("src", url);
            img.removeAttribute("srcset");
          })
        );
      }
    }
    await Promise.all(tasks);

    doc.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (!src || /^file:/i.test(src) || /^blob:/i.test(src)) {
        img.remove();
      }
    });

    const finalHtml = doc.body.innerHTML;
    if (finalHtml) editor?.commands.insertContent(finalHtml);
    for (; fileIdx < imageFiles.length; fileIdx++) {
      insertImageAsBase64(editor, imageFiles[fileIdx]);
    }
  } else {
    imageFiles.forEach((f) => insertImageAsBase64(editor, f));
  }
}

export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

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
    </div>
  );
}
