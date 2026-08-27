"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle } from "lucide-react";

export default function FarmStickyHelpline() {
  return (
    <>
      {/* Desktop - inline already in page, this is mobile sticky */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-3 shadow-2xl border border-white/10 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          <div>
            <div className="text-sm font-bold">Helpline • 24/7</div>
            <div className="text-[11px] text-white/80">Call / WhatsApp</div>
          </div>
        </div>
        <div className="flex gap-2">
          <a href="tel:+918949929291">
            <Button size="sm" variant="secondary" className="rounded-full bg-white text-emerald-700 h-8 gap-1">
              <Phone className="h-3.5 w-3.5" /> Call
            </Button>
          </a>
          <a href="https://wa.me/918949929291" target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline" className="rounded-full bg-white/10 border-white/20 text-white h-8 gap-1">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </>
  );
}
