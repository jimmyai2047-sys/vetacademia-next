"use client";

import { useState, type ReactNode } from "react";
import ConfirmDialog from "@/components/admin/confirm-dialog";

type ConfirmRequest = {
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  variant?: "destructive" | "default";
  run: () => void | Promise<void>;
};

// Shared imperative confirm helper — replaces native window.confirm() with the
// admin ConfirmDialog (pattern established in admin/users/client.tsx).
// Usage: showConfirm(title, description, asyncAction); + render {confirmDialog}.
export function useConfirm() {
  const [req, setReq] = useState<ConfirmRequest | null>(null);
  const [loading, setLoading] = useState(false);

  const showConfirm = (
    title: string,
    description: ReactNode,
    run: () => void | Promise<void>,
    opts?: { confirmLabel?: string; variant?: "destructive" | "default" }
  ) => {
    setReq({ title, description, run, ...opts });
  };

  const runConfirm = async () => {
    if (!req) return;
    setLoading(true);
    try {
      await req.run();
    } finally {
      setLoading(false);
      setReq(null);
    }
  };

  const confirmDialog = (
    <ConfirmDialog
      open={req !== null}
      onOpenChange={(o) => {
        if (!o && !loading) setReq(null);
      }}
      title={req?.title ?? ""}
      description={req?.description ?? ""}
      confirmLabel={req?.confirmLabel}
      variant={req?.variant}
      onConfirm={runConfirm}
      loading={loading}
    />
  );

  return { showConfirm, confirmDialog };
}
