import {
  FileText,
  Presentation,
  Video,
  Image as ImageIcon,
  Archive,
  File as FileIcon,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

function iconFor(type: string) {
  switch (type) {
    case "PDF":
    case "DOC":
    case "XLS":
      return FileText;
    case "PPT":
      return Presentation;
    case "VIDEO":
      return Video;
    case "IMAGE":
      return ImageIcon;
    case "ZIP":
      return Archive;
    default:
      return FileIcon;
  }
}

export default function ChapterResources({
  contents,
}: {
  contents: {
    id: string;
    title: string;
    fileType: string;
    fileName: string;
    url: string;
    size: number | null;
  }[];
}) {
  if (!contents || contents.length === 0) return null;

  function formatSize(bytes: number | null) {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="pl-10 mt-3">
      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
        <Download className="h-3 w-3" /> Resources ({contents.length})
      </p>
      <ul className="space-y-1.5">
        {contents.map((c) => {
          const Icon = iconFor(c.fileType);
          const href = c.url;
          return (
            <li key={c.id}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs hover:bg-muted hover:underline"
              >
                <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate max-w-[260px]">{c.title}</span>
                {c.size ? (
                  <span className="text-[10px] text-muted-foreground">
                    {formatSize(c.size)}
                  </span>
                ) : null}
                <Badge variant="outline" className="text-[9px] shrink-0">
                  {c.fileType}
                </Badge>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
