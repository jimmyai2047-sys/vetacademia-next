"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const MockTestPlayer = dynamic(
  () => import("./mock-test-player").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Loading test…
      </div>
    ),
  }
);

type MockTestPlayerProps = ComponentProps<
  (typeof import("./mock-test-player"))["default"]
>;

export default function MockTestPlayerLazy(props: MockTestPlayerProps) {
  return <MockTestPlayer {...props} />;
}
