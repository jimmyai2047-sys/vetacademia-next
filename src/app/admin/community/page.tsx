import CommunityManager from "@/components/admin/community-manager";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Sparkles, MessageCircle } from "lucide-react";

export const metadata = { title: "Community Links | Admin" };

export default async function AdminCommunityPage() {
  return (
    <div className="space-y-6">
      {/* Royal Header */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#003d2e] via-primary to-[#005f48]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#d4a843]/15 blur-3xl" />
        <div className="relative px-6 py-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" aria-label="Back to dashboard" className="rounded-xl bg-white/15 backdrop-blur border border-white/20 text-white hover:bg-white/25 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur border border-white/20 shadow-sm">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase">
                <Crown className="h-3 w-3 text-[#d4a843]" /> Royal Community
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Community Links</h1>
              <p className="text-white/70 text-sm flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> Manage WhatsApp & Telegram invites for enrolled users
              </p>
            </div>
          </div>
          <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a843] text-[#003d2e] shadow-lg">
            <MessageCircle className="h-5 w-5" />
          </div>
        </div>
      </div>
      <CommunityManager />
    </div>
  );
}
