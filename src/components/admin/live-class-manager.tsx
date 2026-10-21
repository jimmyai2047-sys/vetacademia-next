"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Video,
  Calendar,
  Clock,
  Radio,
  Eye,
  Search,
  AlertTriangle,
} from "lucide-react";

type LiveClass = {
  id: string;
  title: string;
  description: string | null;
  exam: string;
  track: string | null;
  subject: string | null;
  youtubeUrl: string | null;
  scheduledAt: string;
  duration: number;
  status: string;
  /** derived from the clock by the API — what is actually true right now */
  effectiveStatus?: string;
  /** stored status disagrees with the derived one */
  statusStale?: boolean;
  /** past its scheduled end while still stored as SCHEDULED/LIVE */
  needsAttention?: boolean;
  recordingUrl: string | null;
  thumbnailUrl: string | null;
  isDemo: boolean;
  planSlug: string | null;
  order: number;
  _count?: { messages: number };
};

const EXAMS = [
  { value: "psc", label: "PSC (VO/LSA)" },
  { value: "icar-entrance", label: "ICAR Entrance" },
  { value: "net", label: "NET" },
  { value: "ars", label: "ARS" },
  { value: "other", label: "Other" },
];

const STATUSES = ["SCHEDULED", "LIVE", "ENDED", "CANCELLED"];

// Every schedule on this site is India wall-clock time. Stored instants are
// UTC, so both directions are converted explicitly instead of trusting the
// browser/.server zone (a datetime-local string with no offset otherwise
// shifts the class by 5.5 hours somewhere in the pipeline).
const TZ = "Asia/Kolkata";
const TZ_OFFSET = "+05:30";

function toInputValue(iso: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(iso));
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
  } catch {
    return iso.slice(0, 16);
  }
}

function toInstant(value: string): string {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
    ? new Date(`${value}${TZ_OFFSET}`).toISOString()
    : value;
}

function statusColor(s: string) {
  switch (s) {
    case "LIVE": return "bg-red-500 text-white animate-pulse";
    case "SCHEDULED": return "bg-blue-100 text-blue-700";
    case "ENDED": return "bg-green-100 text-green-700";
    case "CANCELLED": return "bg-gray-100 text-gray-500";
    default: return "";
  }
}

export default function LiveClassManager() {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [exam, setExam] = useState("psc");
  const [track, setTrack] = useState("");
  const [subject, setSubject] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState(60);
  const [status, setStatus] = useState("SCHEDULED");
  const [recordingUrl, setRecordingUrl] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [planSlug, setPlanSlug] = useState("");
  const [order, setOrder] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/live-classes");
      if (!res.ok) {
        setError("Failed to load live classes");
        return;
      }
      const data = await res.json();
      setClasses(Array.isArray(data) ? data : []);
    } catch {
      setError("Network error while loading live classes");
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setExam("psc");
    setTrack("");
    setSubject("");
    setYoutubeUrl("");
    setScheduledAt("");
    setDuration(60);
    setStatus("SCHEDULED");
    setRecordingUrl("");
    setIsDemo(false);
    setPlanSlug("");
    setOrder(0);
    setError(null);
    setShowForm(false);
  }

  function startEdit(c: LiveClass) {
    setEditingId(c.id);
    setTitle(c.title);
    setDescription(c.description || "");
    setExam(c.exam);
    setTrack(c.track || "");
    setSubject(c.subject || "");
    setYoutubeUrl(c.youtubeUrl || "");
    setScheduledAt(toInputValue(c.scheduledAt));
    setDuration(c.duration);
    setStatus(c.status);
    setRecordingUrl(c.recordingUrl || "");
    setIsDemo(c.isDemo);
    setPlanSlug(c.planSlug || "");
    setOrder(c.order);
    setError(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!title.trim()) { setError("Title required"); return; }
    if (!scheduledAt) { setError("Schedule time required"); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title, description, exam, track: track || null, subject: subject || null,
        youtubeUrl: youtubeUrl || null, scheduledAt: toInstant(scheduledAt), duration, status,
        recordingUrl: recordingUrl || null, isDemo, planSlug: planSlug || null, order,
      };
      const url = editingId ? `/api/admin/live-classes/${editingId}` : "/api/admin/live-classes";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Save failed");
        return;
      }
      resetForm();
      load();
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this live class? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/live-classes/${id}`, { method: "DELETE" });
      if (res.ok) {
        load();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to delete live class");
      }
    } catch {
      setError("Network error while deleting live class");
    }
  }

  // One-click resolution for a stale status: adopt the clock-derived status
  // (PUT is partial, so only the status field is sent).
  async function resolveAttention(c: LiveClass) {
    const eff = c.effectiveStatus || c.status;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/live-classes/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: eff }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Update failed");
        return;
      }
      load();
    } catch {
      setError("Network error while updating the class");
    } finally {
      setSaving(false);
    }
  }

  function formatDt(dt: string) {
    return `${new Date(dt).toLocaleString("en-IN", {
      timeZone: TZ,
      dateStyle: "medium",
      timeStyle: "short",
    })} IST`;
  }

  // Operational queue: sessions the admin still has to decide something about.
  // Overdue SCHEDULED/LIVE rows are auto-ended by the API sweep, so what is
  // left here is mostly finished sessions with no recording attached.
  const attention = classes.filter((c) => {
    const eff = c.effectiveStatus || c.status;
    return c.needsAttention || (eff === "ENDED" && !c.recordingUrl);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Radio className="h-5 w-5 text-red-500" /> Live Classes
        </h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1" /> New Live Class
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border p-4 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{editingId ? "Edit" : "Schedule"} Live Class</h3>
            <button onClick={resetForm}><X className="h-4 w-4" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <select value={exam} onChange={(e) => setExam(e.target.value)} className="border rounded-md px-3 py-2 text-sm bg-background">
              {EXAMS.map((ex) => <option key={ex.value} value={ex.value}>{ex.label}</option>)}
            </select>
            <Input placeholder="Subject (optional)" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <Input placeholder="Track (optional)" value={track} onChange={(e) => setTrack(e.target.value)} />
            <Input placeholder="YouTube Live URL" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} aria-label="Scheduled start (India time)" />
            <p className="text-xs text-muted-foreground sm:col-span-2 -mt-1">
              Schedule times are India Standard Time (Asia/Kolkata, UTC+05:30).
            </p>
            <Input type="number" placeholder="Duration (min)" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded-md px-3 py-2 text-sm bg-background">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="sm:col-span-2" />
            <Input placeholder="Recording URL (after live ends)" value={recordingUrl} onChange={(e) => setRecordingUrl(e.target.value)} className="sm:col-span-2" />
            <Input placeholder="Plan slug (premium gating)" value={planSlug} onChange={(e) => setPlanSlug(e.target.value)} />
            <Input type="number" placeholder="Order" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="lc-demo" checked={isDemo} onChange={(e) => setIsDemo(e.target.checked)} />
            <label htmlFor="lc-demo" className="text-sm">Demo (free for all)</label>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              {editingId ? "Update" : "Schedule"}
            </Button>
            <Button variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : classes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No live classes yet.</p>
      ) : (
        <div className="space-y-2">
          {attention.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
                <p className="text-xs font-bold text-amber-800">
                  {attention.length} class{attention.length === 1 ? "" : "es"} need
                  {attention.length === 1 ? "s" : ""} attention
                </p>
              </div>
              <ul className="space-y-1.5">
                {attention.map((c) => (
                  <li
                    key={`attention-${c.id}`}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="min-w-0 truncate">
                      {formatDt(c.scheduledAt)} · {c.title} —{" "}
                      {c.needsAttention
                        ? "past its scheduled end while still stored as SCHEDULED/LIVE"
                        : "ended, but no recording URL attached"}
                    </span>
                    <span className="flex shrink-0 gap-1">
                      {!c.recordingUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-[11px]"
                          onClick={() => startEdit(c)}
                        >
                          Add recording
                        </Button>
                      )}
                      {c.statusStale && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-[11px]"
                          onClick={() => resolveAttention(c)}
                          disabled={saving}
                        >
                          Mark {c.effectiveStatus}
                        </Button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, exam, or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              aria-label="Search live classes"
            />
          </div>
          {classes
            .filter(
              (c) =>
                !search ||
                c.title.toLowerCase().includes(search.toLowerCase()) ||
                c.exam.toLowerCase().includes(search.toLowerCase()) ||
                (c.subject && c.subject.toLowerCase().includes(search.toLowerCase()))
            )
            .map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-lg border p-3 bg-card">
              <Video className="h-5 w-5 shrink-0 text-red-500" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">{c.title}</span>
                  <Badge className={`text-[10px] ${statusColor(c.effectiveStatus || c.status)}`}>{c.effectiveStatus || c.status}</Badge>
                  {c.statusStale && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-amber-200 bg-amber-50 text-amber-700"
                      title="Stored status disagrees with the clock — the saved value stays editable below"
                    >
                      stored: {c.status}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px]">{c.exam}</Badge>
                  {c.isDemo && <Badge variant="secondary" className="text-[10px]">DEMO FIXTURE</Badge>}
                  {c.effectiveStatus === "ENDED" && !c.recordingUrl && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-muted-foreground/40 text-muted-foreground"
                      title="This class has ended but no recording URL is attached yet"
                    >
                      No recording
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDt(c.scheduledAt)}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {c.duration}m</span>
                  {c._count && <span>{c._count.messages} msgs</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {c.youtubeUrl && (
                  <a href={c.youtubeUrl} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                  </a>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(c)} aria-label="Edit live class">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(c.id)} aria-label="Delete live class">
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
