"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { WhatsAppIcon } from "@/components/social-icons";

const WA_NUMBER = "918949929291";

/**
 * Floating WhatsApp chat button — visible on every page (bottom-right).
 * Pre-fills the chat with the page the user is on so support knows the
 * context. Opens wa.me chat in a new tab.
 */
export default function FloatingWhatsApp() {
  const pathname = usePathname();
  const href = useMemo(() => {
    const page = pathname && pathname !== "/" ? pathname : "the homepage";
    const msg = `Hi VetAcademia, I need help with my preparation (page: ${page})`;
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  }, [pathname]);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with VetAcademia on WhatsApp"
      title="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.45)] transition-all hover:scale-110 hover:bg-[#1eb856] hover:shadow-[0_10px_30px_rgba(37,211,102,0.6)] active:scale-95"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-20" aria-hidden="true" />
      <WhatsAppIcon className="relative h-6 w-6" />
    </a>
  );
}
