import Link from "next/link";
import { SOCIAL_LINKS } from "@/lib/social";
import { cn } from "@/lib/utils";

type IconProps = { className?: string };

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.9 3.77-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.08L2 22l5.05-1.32A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3 .79.8-2.93-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.59-6.15c-.25-.13-1.49-.73-1.72-.82-.23-.08-.4-.12-.56.13-.17.25-.64.82-.78.99-.14.17-.29.19-.54.06-.25-.12-1.05-.38-2-1.23-.73-.66-1.23-1.47-1.37-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.08 0 1.22.89 2.4 1.01 2.57.13.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.6.19 1.13.16 1.56.1.48-.07 1.49-.61 1.7-1.2.21-.58.21-1.08.14-1.2-.06-.11-.23-.17-.48-.3Z" />
    </svg>
  );
}

export function TelegramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M21.9 4.6 2.7 12.1c-.8.3-.8 1.4.1 1.6l4.7 1.5 1.8 5.6c.3.8 1.3.9 1.8.2l2.6-3.1 4.9 3.6c.6.4 1.5.1 1.7-.6l2.8-14.6c.2-1-.9-1.9-2.2-1.7ZM8.5 13.4l9.5-7.3c.2-.2.5.1.3.3l-7.9 8.4-.3 3-1.6-4.4Z" />
    </svg>
  );
}

const socials = [
  {
    name: "Facebook",
    href: SOCIAL_LINKS.facebook,
    Icon: FacebookIcon,
    hover: "hover:bg-[#1877F2] hover:border-[#1877F2]",
  },
  {
    name: "Instagram",
    href: SOCIAL_LINKS.instagram,
    Icon: InstagramIcon,
    hover: "hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:border-transparent",
  },
  {
    name: "WhatsApp",
    href: SOCIAL_LINKS.whatsapp,
    Icon: WhatsAppIcon,
    hover: "hover:bg-[#25D366] hover:border-[#25D366]",
  },
  {
    name: "Telegram",
    href: SOCIAL_LINKS.telegram,
    Icon: TelegramIcon,
    hover: "hover:bg-[#229ED9] hover:border-[#229ED9]",
  },
];

function isExternal(href: string) {
  return href.startsWith("http");
}

export default function SocialLinks({
  className,
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const base =
    variant === "dark"
      ? "border-white/15 bg-white/5 text-white/80 hover:text-white"
      : "border-primary/15 bg-white text-muted-foreground hover:text-white shadow-sm";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {socials.map(({ name, href, Icon, hover }) => {
        const external = isExternal(href);
        const cls = cn(
          "flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur-sm transition-all hover:scale-105 hover:shadow-lg",
          base,
          hover
        );
        const label = name === "Telegram" ? "VetAcademia Telegram groups" : `VetAcademia on ${name}`;
        const title = name === "Telegram" ? "Join Telegram groups" : `Follow us on ${name}`;
        return external ? (
          <a
            key={name}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={title}
            className={cls}
          >
            <Icon className="h-[18px] w-[18px]" />
          </a>
        ) : (
          <Link key={name} href={href} aria-label={label} title={title} className={cls}>
            <Icon className="h-[18px] w-[18px]" />
          </Link>
        );
      })}
    </div>
  );
}
