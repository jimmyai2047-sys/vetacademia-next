"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Loader2,
  FileText,
  GraduationCap,
  ChevronRight,
  BookOpen,
  Folder,
} from "lucide-react";
import RichTextEditor from "@/components/admin/rich-text-editor";
import { importDocxAsHtml } from "@/lib/docx-import";
import ChapterBulkImporter from "@/components/admin/chapter-bulk-importer";

type Chapter = {
  id: string;
  title: string;
  unitNumber: number;
  courseCode: string | null;
  type: string | null;
};
type Subject = { id: string; name: string; chapters: Chapter[] };
type Programme = {
  id: string;
  name: string;
  slug: string;
  isPG: boolean;
  subjects: Subject[];
};
type Material = {
  id: string;
  title: string;
  type: string;
  isDemo: boolean;
  isPublic: boolean;
  subjectId: string | null;
  chapterId: string | null;
  content?: string | null;
  url?: string | null;
  fileName?: string | null;
  fileType?: string | null;
};

const TYPES = ["NOTE", "PDF", "DOC", "XLS", "PPT", "VIDEO", "LINK", "IMAGE"];
const FILE_TYPES_SM = ["PDF", "DOC", "XLS", "PPT", "IMAGE"];

function courseLabel(code: string | null) {
  return code || "General";
}

export default function StudyMaterialManager({
  programmeTree,
}: {
  programmeTree: Programme[];
}) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  // navigation state (drill-down path)
  const [progId, setProgId] = useState<string | null>(null);
  const [subjId, setSubjId] = useState<string | null>(null);
  const [courseCode, setCourseCode] = useState<string | null>(null);

  // form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("NOTE");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [file, setFile] = useState<{
    url: string;
    fileName: string;
    fileType: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const docxRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const m = await fetch("/api/admin/study-materials").then((r) => r.json());
      setMaterials(m);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const programme = programmeTree.find((p) => p.id === progId) || null;
  const subject = programme?.subjects.find((s) => s.id === subjId) || null;

  function selectProgramme(id: string) {
    setProgId(id);
    setSubjId(null);
    setCourseCode(null);
  }
  function selectSubject(id: string) {
    setSubjId(id);
    setCourseCode(null);
  }
  function selectCourse(code: string) {
    setCourseCode(code);
  }
  function resetNav() {
    setProgId(null);
    setSubjId(null);
    setCourseCode(null);
  }

  // PG: distinct course codes across the subject's chapters
  const courses = subject
    ? Array.from(
        new Set(subject.chapters.map((c) => courseLabel(c.courseCode)))
      ).sort()
    : [];

  function chaptersFor(subj: Subject, course: string | null) {
    if (course == null) return subj.chapters;
    return subj.chapters.filter((c) => courseLabel(c.courseCode) === course);
  }

  function chapterMaterials(chId: string) {
    return materials.filter((m) => m.chapterId === chId);
  }
  function subjectLevelMaterials(sId: string) {
    return materials.filter((m) => m.subjectId === sId && !m.chapterId);
  }

  function openNew(chId: string | null, subjId: string | null) {
    setEditingId(null);
    setTitle("");
    setType("NOTE");
    setContent("");
    setUrl("");
    setFileName("");
    setFileType("");
    setFile(null);
    setChapterId(chId);
    setSubjectId(subjId);
    setIsDemo(false);
    setIsPublic(true);
    setError(null);
    setShowForm(true);
  }

  function openEdit(m: Material) {
    setEditingId(m.id);
    setTitle(m.title);
    setType(m.type);
    setContent(m.content || "");
    setUrl(m.url || "");
    setFileName(m.fileName || "");
    setFileType(m.fileType || "");
    setFile(
      m.url
        ? { url: m.url, fileName: m.fileName || "", fileType: m.fileType || "" }
        : null
    );
    setChapterId(m.chapterId);
    setSubjectId(m.subjectId);
    setIsDemo(m.isDemo);
    setIsPublic(m.isPublic);
    setError(null);
    setShowForm(true);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      setFile({ url: data.url, fileName: data.fileName, fileType: data.fileType });
      setUrl(data.url);
      setFileName(data.fileName);
      setFileType(data.fileType);
      if (!title.trim()) {
        setTitle(data.fileName.replace(/\.[^.]+$/, ""));
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDocxImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setImporting(true);
    setError(null);
    try {
      const html = await importDocxAsHtml(f);
      setContent(html);
    } catch (err: any) {
      setError(err?.message || "Word file conversion failed");
    } finally {
      setImporting(false);
      if (docxRef.current) docxRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title,
        type,
        content: content || null,
        url: url || null,
        fileName: fileName || null,
        fileType: fileType || null,
        subjectId: subjectId || null,
        chapterId: chapterId || null,
        isDemo,
        isPublic,
      };
      const res = editingId
        ? await fetch(`/api/admin/study-materials/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/study-materials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Save failed");
        return;
      }
      setShowForm(false);
      await load();
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this study material?")) return;
    const res = await fetch(`/api/admin/study-materials/${id}`, {
      method: "DELETE",
    });
    if (res.ok) load();
  }

  const card =
    "rounded-xl border bg-card hover:border-primary/50 transition-colors cursor-pointer";

  return (
    <div className="space-y-4">
      {showForm && (
        <div className="rounded-lg border p-4 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {editingId ? "Edit" : "New"} Study Material
              {chapterId ? " (bound to chapter)" : " (subject level)"}
            </h3>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium block">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium block">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            {type === "LINK" || type === "VIDEO" ? (
              <div className="space-y-1.5">
                <label className="text-sm font-medium block">URL</label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
            ) : null}
          </div>

          {type === "NOTE" ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium block">
                  Content (paste chapter from Word — formatting is kept &amp;
                  cleaned)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={docxRef}
                    type="file"
                    accept=".doc,.docx"
                    className="hidden"
                    onChange={handleDocxImport}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => docxRef.current?.click()}
                    disabled={importing}
                  >
                    {importing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    Import from Word (.docx)
                  </Button>
                </div>
              </div>
              <RichTextEditor value={content} onChange={setContent} />
            </div>
          ) : FILE_TYPES_SM.includes(type) ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium block">
                Upload File ({type})
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp"
                  className="hidden"
                  onChange={handleFile}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Upload File
                </Button>
                {file && (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    {file.fileName}
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setUrl("");
                        setFileName("");
                        setFileType("");
                      }}
                      className="text-red-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Or paste an external URL instead:
              </p>
              <Input
                className="mt-1"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
          ) : null}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sm-isDemo"
                checked={isDemo}
                onChange={(e) => setIsDemo(e.target.checked)}
              />
              <label htmlFor="sm-isDemo" className="text-sm">
                Demo content (free for everyone)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sm-isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <label htmlFor="sm-isPublic" className="text-sm">
                Public
              </label>
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
        <button className="hover:underline" onClick={resetNav}>
          All Programmes
        </button>
        {programme && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <button
              className="hover:underline"
              onClick={() => selectProgramme(programme.id)}
            >
              {programme.name}
            </button>
          </>
        )}
        {subject && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <button
              className="hover:underline"
              onClick={() => selectSubject(subject.id)}
            >
              {subject.name}
            </button>
          </>
        )}
        {programme?.isPG && courseCode && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>{courseCode}</span>
          </>
        )}
      </nav>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-4">
          {/* LEVEL 0: Programmes */}
          {!programme && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {programmeTree.map((p) => {
                const total = p.subjects.reduce(
                  (a, s) => a + s.chapters.length,
                  0
                );
                return (
                  <div
                    key={p.id}
                    className={card + " p-4"}
                    onClick={() => selectProgramme(p.id)}
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{p.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {p.subjects.length} subjects
                      {p.isPG ? " · PG (Courses → Chapters)" : " · UG (Chapters)"}
                      {` · ${total} chapters`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* LEVEL 1: Subjects */}
          {programme && !subject && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {programme.subjects.map((s) => {
                const subjMats = subjectLevelMaterials(s.id).length;
                const chapMats = materials.filter(
                  (m) => m.subjectId === s.id
                ).length;
                return (
                  <div
                    key={s.id}
                    className={card + " p-4"}
                    onClick={() => selectSubject(s.id)}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{s.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {s.chapters.length} chapters
                      {programme.isPG ? " · drill into Courses" : ""}
                      {` · ${chapMats} materials`}
                    </p>
                  </div>
                );
              })}
              {programme.subjects.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No subjects under this programme yet.
                </p>
              )}
            </div>
          )}

          {/* LEVEL 2 (PG): Courses */}
          {programme && subject && programme.isPG && courseCode === null && (
            <div className="space-y-4">
              {courses.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No courses found for this subject. Pehle chapters create karein
                    (course code chapters me set hoga):
                  </p>
                  <ChapterBulkImporter subjectId={subject.id} />
                </div>
              )}
              {courses.map((code) => {
                const chaps = chaptersFor(subject, code);
                const mats = chaps.reduce(
                  (a, c) => a + chapterMaterials(c.id).length,
                  0
                );
                return (
                  <div
                    key={code}
                    className={card + " p-4"}
                    onClick={() => selectCourse(code)}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{code}</h3>
                      <Badge variant="secondary">{chaps.length} chapters</Badge>
                      <Badge variant="outline">{mats} materials</Badge>
                    </div>
                  </div>
                );
              })}
              <SubjectLevelMaterials
                materials={subjectLevelMaterials(subject.id)}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            </div>
          )}

          {/* LEVEL 2 (UG) / LEVEL 3 (PG): Chapters */}
          {programme && subject && (!programme.isPG || courseCode !== null) && (
            <div className="space-y-4">
              {subjectLevelMaterials(subject.id).length > 0 && (
                <SubjectLevelMaterials
                  materials={subjectLevelMaterials(subject.id)}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              )}
              {chaptersFor(subject, programme.isPG ? courseCode : null).map(
                (ch) => {
                  const mats = chapterMaterials(ch.id);
                  return (
                    <div
                      key={ch.id}
                      className="rounded-xl border bg-card overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-muted/40 border-b">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold">
                            {ch.unitNumber ? `Unit ${ch.unitNumber}: ` : ""}
                            {ch.title}
                          </h3>
                          <Badge variant="secondary">{mats.length}</Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openNew(ch.id, subject.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Material
                        </Button>
                      </div>
                      <div className="divide-y">
                        {mats.length === 0 ? (
                          <p className="text-sm text-muted-foreground px-4 py-3">
                            No materials yet for this chapter.
                          </p>
                        ) : (
                          mats.map((m) => (
                            <div
                              key={m.id}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm"
                            >
                              <span className="font-medium truncate">
                                {m.title}
                              </span>
                              <Badge variant="outline">{m.type}</Badge>
                              {m.isDemo && (
                                <Badge
                                  variant="outline"
                                  className="text-emerald-600 border-emerald-600"
                                >
                                  Demo
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {m.isPublic ? "Public" : "Private"}
                              </span>
                              <div className="ml-auto flex items-center gap-3">
                                <button
                                  className="text-primary hover:underline"
                                  onClick={() => openEdit(m)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="text-red-600 hover:underline"
                                  onClick={() => handleDelete(m.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                }
              )}
              {chaptersFor(subject, programme.isPG ? courseCode : null)
                .length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No chapters under this
                    {programme.isPG ? " course" : " subject"} yet. Pehle chapters
                    create karein:
                  </p>
                  <ChapterBulkImporter subjectId={subject.id} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubjectLevelMaterials({
  materials,
  onEdit,
  onDelete,
}: {
  materials: Material[];
  onEdit: (m: Material) => void;
  onDelete: (id: string) => void;
}) {
  if (materials.length === 0) return null;
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-4 py-3 bg-muted/40 border-b">
        <h3 className="font-semibold text-sm">Subject-level materials</h3>
      </div>
      <div className="divide-y">
        {materials.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 px-4 py-2.5 text-sm"
          >
            <span className="font-medium truncate">{m.title}</span>
            <Badge variant="outline">{m.type}</Badge>
            {m.isDemo && (
              <Badge
                variant="outline"
                className="text-emerald-600 border-emerald-600"
              >
                Demo
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {m.isPublic ? "Public" : "Private"}
            </span>
            <div className="ml-auto flex items-center gap-3">
              <button
                className="text-primary hover:underline"
                onClick={() => onEdit(m)}
              >
                Edit
              </button>
              <button
                className="text-red-600 hover:underline"
                onClick={() => onDelete(m.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
