"use client";

import { useState } from "react";

export default function ImportantLinkCard({
  name,
  href,
  logo,
  short,
  color,
}: {
  name: string;
  href: string;
  logo: string;
  short: string;
  color: string;
}) {
  const [errored, setErrored] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`Visit ${name}`}
      className="flex flex-col items-center gap-2 rounded-xl border bg-background p-4 text-center hover:border-primary hover:shadow-md transition-all shrink-0 w-28 md:w-32"
    >
      {logo && !errored ? (
        <img
          src={logo}
          alt={`${name} logo`}
          width={56}
          height={56}
          className="h-14 w-14 object-contain"
          onError={() => setErrored(true)}
        />
      ) : (
        <div
          className="h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: color }}
        >
          {short}
        </div>
      )}
      <span className="text-sm font-medium text-foreground">{name}</span>
    </a>
  );
}
