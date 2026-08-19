"use client";

import { ToastProvider } from "@/components/admin/toast-provider";

export default function AdminProviders({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
