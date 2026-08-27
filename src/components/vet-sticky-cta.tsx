"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Video, Clock, ShieldCheck } from "lucide-react";

export default function VetStickyCta() {
  return (
    <>
      {/* Desktop CTA */}
      <div className="hidden md:flex items-center justify-between rounded-[1.25rem] border border-emerald-200 bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Video className="h-5 w-5" />
          </span>
          <div>
            <div className="font-bold flex items-center gap-2">
              Book Consultation — 15 min <Badge className="bg-white text-emerald-700 rounded-full text-xs">₹299</Badge>
            </div>
            <div className="text-xs text-white/80 flex items-center gap-2">
              <Clock className="h-3 w-3" /> Today 4PM & 7PM slots • <ShieldCheck className="h-3 w-3" /> Verified vets
            </div>
          </div>
        </div>
        <Link href="/experts">
          <Button variant="secondary" className="rounded-full bg-white text-emerald-700 hover:bg-white/90 gap-2">
            <Users className="h-4 w-4" /> Find Experts
          </Button>
        </Link>
      </div>

      {/* Mobile sticky CTA */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-3 shadow-2xl border border-white/10 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4" />
          <div>
            <div className="text-sm font-bold">Book 15 min — ₹299</div>
            <div className="text-[11px] text-white/80">Today 4PM, 7PM</div>
          </div>
        </div>
        <Link href="/experts">
          <Button size="sm" variant="secondary" className="rounded-full bg-white text-emerald-700 h-8">
            Book
          </Button>
        </Link>
      </div>
    </>
  );
}
