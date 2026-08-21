"use client";

import { useEffect, useState } from "react";
import { FileText, Presentation, Video, BookOpen, Download, Maximize2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProtectedHtml from "@/components/protected-html";

interface ContentFile {
  id: string;
  title: string;
  fileType: string;
  fileName: string;
  url: string;
  size: number | null;
}

interface ChapterContentViewerProps {
  htmlContent: string;
  files: ContentFile[];
  chapterTitle?: string;
}

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function PptViewer({ url, title }: { url: string; title: string }) {
  const [proxied, setProxied] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setProxied(
        `${window.location.origin}/api/blob?url=${encodeURIComponent(url)}`
      );
    }
  }, [url]);

  // External viewers (Office/Google) fetch the URL server-side, so they need a
  // publicly reachable URL. The proxy streams our private blob. We use Google's
  // viewer as primary — it is far more tolerant of file types/sizes than
  // Office Online (which shows "This content is blocked" for octet-stream or
  // files over ~10 MB).
  const encodedUrl = encodeURIComponent(proxied || url);
  const googleViewer = `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Presentation className="h-4 w-4 text-orange-500" />
          {title}
        </h4>
        <div className="flex gap-2">
          <a
            href={googleViewer}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Maximize2 className="h-3 w-3" /> Full Screen
          </a>
          <a
            href={url}
            download
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline"
          >
            <Download className="h-3 w-3" /> Download
          </a>
        </div>
      </div>
      <div className="w-full rounded-lg overflow-hidden border bg-muted" style={{ minHeight: "min(500px, 60vh)" }}>
        {proxied ? (
          <iframe
            src={googleViewer}
            className="w-full border-0"
            style={{ height: "min(600px, 70vh)" }}
            title={title}
            allowFullScreen
          />
        ) : (
          <div className="p-6 text-sm text-muted-foreground">
            Loading viewer…
          </div>
        )}
      </div>
    </div>
  );
}

function VideoPlayer({ url, title }: { url: string; title: string }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Video className="h-4 w-4 text-red-500" />
          {title}
        </h4>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" /> Open in New Tab
        </a>
      </div>
      <div className="w-full rounded-lg overflow-hidden border bg-black">
        <video
          controls
          className="w-full"
          style={{ maxHeight: "500px" }}
          preload="metadata"
        >
          <source src={url} />
          Your browser does not support video.
        </video>
      </div>
    </div>
  );
}

function PdfViewer({ url, title }: { url: string; title: string }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-500" />
          {title}
        </h4>
        <div className="flex gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Maximize2 className="h-3 w-3" /> Full Screen
          </a>
          <a
            href={url}
            download
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline"
          >
            <Download className="h-3 w-3" /> Download
          </a>
        </div>
      </div>
      <div className="w-full rounded-lg overflow-hidden border" style={{ height: "min(600px, 80vh)" }}>
        <iframe src={url} className="w-full h-full border-0" title={title} />
      </div>
    </div>
  );
}

export default function ChapterContentViewer({
  htmlContent,
  files,
  chapterTitle,
}: ChapterContentViewerProps) {
  const ppts = files.filter((f) => f.fileType === "PPT" || f.fileType === "PPTX" || f.fileName?.endsWith(".pptx") || f.fileName?.endsWith(".ppt"));
  const videos = files.filter((f) => f.fileType === "VIDEO" || f.fileType?.startsWith("VIDEO") || f.fileName?.match(/\.(mp4|webm|ogg|mov)$/i));
  const pdfs = files.filter((f) => f.fileType === "PDF" || f.fileName?.endsWith(".pdf"));
  const others = files.filter(
    (f) => !ppts.includes(f) && !videos.includes(f) && !pdfs.includes(f)
  );

  const hasContent = htmlContent && htmlContent.replace(/<[^>]*>/g, "").trim().length > 0;
  const hasPpt = ppts.length > 0;
  const hasVideo = videos.length > 0;
  const hasPdf = pdfs.length > 0;
  const hasFiles = hasPpt || hasVideo || hasPdf || others.length > 0;

  // Build tabs
  const tabs: { id: string; label: string; icon: typeof BookOpen; count?: number }[] = [];
  if (hasContent) tabs.push({ id: "content", label: "Content", icon: BookOpen });
  if (hasPpt) tabs.push({ id: "ppt", label: "PPT", icon: Presentation, count: ppts.length });
  if (hasVideo) tabs.push({ id: "video", label: "Video", icon: Video, count: videos.length });
  if (hasPdf) tabs.push({ id: "pdf", label: "PDF", icon: FileText, count: pdfs.length });
  if (others.length > 0) tabs.push({ id: "files", label: "Files", icon: Download, count: others.length });

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "content");

  if (tabs.length === 0) {
    return (
      <div className="px-2 text-muted-foreground italic">Content coming soon...</div>
    );
  }

  return (
    <div className="px-2">
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-4 p-1 bg-muted/50 rounded-lg overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold
                transition-all whitespace-nowrap
                ${
                  isActive
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }
              `}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count && tab.count > 1 && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-0.5">
                  {tab.count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "content" && hasContent && (
          <ProtectedHtml html={htmlContent} />
        )}

        {activeTab === "ppt" && hasPpt && (
          <div className="space-y-6">
            {ppts.map((ppt) => (
              <PptViewer key={ppt.id} url={ppt.url} title={ppt.title} />
            ))}
          </div>
        )}

        {activeTab === "video" && hasVideo && (
          <div className="space-y-6">
            {videos.map((vid) => (
              <VideoPlayer key={vid.id} url={vid.url} title={vid.title} />
            ))}
          </div>
        )}

        {activeTab === "pdf" && hasPdf && (
          <div className="space-y-6">
            {pdfs.map((pdf) => (
              <PdfViewer key={pdf.id} url={pdf.url} title={pdf.title} />
            ))}
          </div>
        )}

        {activeTab === "files" && others.length > 0 && (
          <ul className="space-y-2">
            {others.map((f) => (
              <li key={f.id}>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm hover:bg-muted hover:underline"
                >
                  <Download className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate max-w-[300px]">{f.title}</span>
                  {f.size && (
                    <span className="text-xs text-muted-foreground">{formatSize(f.size)}</span>
                  )}
                  <Badge variant="outline" className="text-[10px] shrink-0">{f.fileType}</Badge>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
