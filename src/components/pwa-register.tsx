"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Simple SW registration — uses Next.js default caching
      // For now, just ensure manifest is linked; no custom SW needed
      // Future: add workbox for offline syllabus
      console.log("PWA ready: manifest linked");
    }
  }, []);
  return null;
}
