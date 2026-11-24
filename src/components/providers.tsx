"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";

// Step C (Nov 2026): study content is view-only. Two layers:
//   1. JS — block copy/cut/context-menu/drag on everything except form fields.
//   2. CSS — `user-select: none` in globals.css with the same exemptions.
// /admin is exempt so the owner can still select and copy text there.
const FIELD_SELECTOR = "input, textarea, select, [contenteditable]";

function isField(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest(FIELD_SELECTOR);
}

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("va-admin", isAdmin);
    if (isAdmin) return;

    const block = (e: Event) => {
      if (isField(e.target)) return;
      e.preventDefault();
    };

    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("dragstart", block);
    };
  }, [isAdmin]);

  return <SessionProvider>{children}</SessionProvider>;
}
