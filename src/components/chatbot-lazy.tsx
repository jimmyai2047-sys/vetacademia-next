"use client";

import dynamic from "next/dynamic";

// Defer the chatbot bundle to the client so it doesn't block initial render
// or inflate the server-rendered HTML on every page that mounts it.
const Chatbot = dynamic(() => import("./chatbot"), {
  ssr: false,
  loading: () => null,
});

export default function ChatbotLazy() {
  return <Chatbot />;
}
