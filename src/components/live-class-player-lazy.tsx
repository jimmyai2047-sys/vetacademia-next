"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const LiveClassPlayer = dynamic(
  () => import("./live-class-player").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Loading class…
      </div>
    ),
  }
);

type LiveClassPlayerProps = ComponentProps<
  (typeof import("./live-class-player"))["default"]
>;

export default function LiveClassPlayerLazy(props: LiveClassPlayerProps) {
  return <LiveClassPlayer {...props} />;
}
