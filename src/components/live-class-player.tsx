"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Radio } from "lucide-react";

type ChatMsg = {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
};

function ytEmbedFromUrl(url: string | null): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0`;
  }
  if (url.includes("youtube.com/embed/")) return url;
  return null;
}

export default function LiveClassPlayer({
  liveClassId,
  youtubeUrl,
  recordingUrl,
  status,
  scheduledAt,
}: {
  liveClassId: string;
  youtubeUrl: string | null;
  recordingUrl: string | null;
  status: string;
  scheduledAt: string;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingChat, setLoadingChat] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<string | null>(null);

  const videoUrl = status === "ENDED" && recordingUrl ? recordingUrl : youtubeUrl;
  const embedUrl = ytEmbedFromUrl(videoUrl);

  const fetchMessages = useCallback(async (after?: string) => {
    try {
      const qs = after ? `?after=${after}` : "";
      const res = await fetch(`/api/live-classes/${liveClassId}/messages${qs}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = data.filter((m: ChatMsg) => !existingIds.has(m.id));
          return [...prev, ...newMsgs];
        });
        pollRef.current = data[data.length - 1].createdAt;
      }
    } catch { /* empty */ }
  }, [liveClassId]);

  useEffect(() => {
    setLoadingChat(true);
    fetchMessages().finally(() => setLoadingChat(false));
    const interval = setInterval(() => {
      if (pollRef.current) {
        fetchMessages(pollRef.current);
      } else {
        fetchMessages();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = chatInput.trim();
    if (!text) return;
    setSending(true);
    setChatError(null);
    try {
      const res = await fetch(`/api/live-classes/${liveClassId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setChatError(d.error || "Send failed");
        return;
      }
      const msg = await res.json();
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      pollRef.current = msg.createdAt;
      setChatInput("");
    } catch {
      setChatError("Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Video Player */}
      <div className="lg:col-span-2">
        {embedUrl ? (
          <div className="relative w-full pb-[56.25%] rounded-lg overflow-hidden bg-black">
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={status === "ENDED" ? "Recording" : "Live Class"}
            />
          </div>
        ) : (
          <div className="relative w-full pb-[56.25%] rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <Radio className="h-12 w-12 mb-3 opacity-50" />
              {status === "SCHEDULED" ? (
                <>
                  <p className="font-medium">Class Scheduled</p>
                  <p className="text-sm">
                    Starts {new Date(scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </>
              ) : status === "LIVE" ? (
                <p className="font-medium animate-pulse">Live stream starting soon...</p>
              ) : (
                <p className="font-medium">Recording not available</p>
              )}
            </div>
          </div>
        )}

        {status === "ENDED" && recordingUrl && (
          <p className="text-sm text-muted-foreground mt-2">
            This class has ended. Watching recording.
          </p>
        )}
      </div>

      {/* Chat */}
      <div className="flex flex-col rounded-lg border bg-card h-[500px] lg:h-auto">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Radio className={`h-4 w-4 ${status === "LIVE" ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
          <span className="font-medium text-sm">
            Live Chat
            {status === "LIVE" && <span className="text-red-500 ml-1">(LIVE)</span>}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
          {loadingChat ? (
            <div className="flex items-center justify-center h-20">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center mt-8">
              No messages yet. Be the first to say something!
            </p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="text-sm">
                <span className="font-medium text-primary">{m.user.name}: </span>
                <span className="text-foreground">{m.text}</span>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="border-t p-3">
          {chatError && <p className="text-xs text-red-500 mb-1">{chatError}</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              className="h-8 text-sm"
              maxLength={500}
              disabled={status === "ENDED"}
            />
            <Button
              type="submit"
              size="icon"
              className="h-8 w-8 shrink-0"
              disabled={sending || !chatInput.trim() || status === "ENDED"}
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
