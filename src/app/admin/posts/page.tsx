import PostManager from "@/components/admin/post-manager";
import { Crown, Sparkles, Shield, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  return (
    <div className="space-y-6">
      {/* Royal Gradient Header */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#003d2e] via-primary to-[#005f48]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-[#d4a843]/15 blur-3xl" />
        <div className="relative px-6 py-7 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-bold tracking-widest uppercase">
              <Crown className="h-3.5 w-3.5 text-[#d4a843]" /> Royal Content
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Posts &amp; Resources</h1>
            <p className="mt-1 text-white/70 flex items-center gap-2 text-sm">
              <Shield className="h-3.5 w-3.5 text-[#d4a843]" /> Manage content for Animal Owners, Vets, Advisory and Previous Year Papers (articles + file uploads)
            </p>
          </div>
          <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a843] text-[#003d2e] shadow-lg shrink-0">
            <FileText className="h-6 w-6" />
          </div>
        </div>
      </div>
      <div className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm p-5">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60" />
        <PostManager />
      </div>
    </div>
  );
}
