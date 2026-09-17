import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, ArrowRight, ArrowUpRight } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/social";
import {
  FacebookIcon,
  InstagramIcon,
  WhatsAppIcon,
  TelegramIcon,
} from "@/components/social-icons";

const channels = [
  {
    name: "Facebook Page",
    desc: "Results, live class alerts & updates",
    cta: "Follow Page",
    href: SOCIAL_LINKS.facebook,
    external: true,
    Icon: FacebookIcon,
    iconBg: "bg-[#1877F2]",
    btn: "bg-[#1877F2] hover:bg-[#1464cc]",
    bar: "from-[#1877F2] to-[#42a5f5]",
  },
  {
    name: "Instagram",
    desc: "Reels, topper stories & daily quiz",
    cta: "Follow",
    href: SOCIAL_LINKS.instagram,
    external: true,
    Icon: InstagramIcon,
    iconBg: "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]",
    btn: "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] hover:opacity-90",
    bar: "from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]",
  },
  {
    name: "WhatsApp",
    desc: "1:1 chat + programme-wise groups",
    cta: "Chat Now",
    href: SOCIAL_LINKS.whatsapp,
    external: true,
    secondary: { label: "Join study groups →", href: "/community" },
    Icon: WhatsAppIcon,
    iconBg: "bg-[#25D366]",
    btn: "bg-[#25D366] hover:bg-[#1eb856]",
    bar: "from-[#25D366] to-[#128C7E]",
  },
  {
    name: "Telegram Groups",
    desc: "Exam-wise groups: VO • LSA • ICAR",
    cta: "Join Groups",
    href: "/community",
    external: false,
    Icon: TelegramIcon,
    iconBg: "bg-[#229ED9]",
    btn: "bg-[#229ED9] hover:bg-[#1b8bc0]",
    bar: "from-[#229ED9] to-[#0e6fa8]",
  },
];

/**
 * "Join Our Community" — Home page section with clickable
 * Facebook / Instagram / WhatsApp / Telegram cards.
 */
export default function JoinCommunity() {
  return (
    <section className="relative py-8 md:py-12 overflow-hidden bg-gradient-to-b from-muted/40 via-muted/20 to-background">
      <div className="absolute inset-0 va-pattern-grid opacity-[0.03]" />
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="rounded-full bg-primary/10 text-primary border-primary/15 gap-1.5">
            <Users className="h-3.5 w-3.5" /> Join Our Community
          </Badge>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
            Follow Us. <span className="va-gradient-text">Join Groups.</span>
          </h2>
          <div className="va-divider-dots my-4 mx-auto max-w-[120px]"><span /></div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Facebook aur Instagram par follow karo — WhatsApp aur Telegram groups me apne programme ke students se judo.
          </p>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {channels.map((c) => (
            <Card
              key={c.name}
              className="va-card-hover group relative h-full overflow-hidden rounded-[1.5rem] border border-primary/5 bg-white p-0 shadow-sm hover:shadow-xl"
            >
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${c.bar} opacity-70 group-hover:opacity-100 transition-opacity`} />
              <CardContent className="flex h-full flex-col items-center p-6 text-center">
                <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${c.iconBg} text-white shadow-md transition-transform group-hover:scale-105`}>
                  <c.Icon className="h-7 w-7" />
                </span>
                <h3 className="mt-4 font-bold text-[17px]">{c.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
                <div className="mt-5 w-full flex-1 flex flex-col justify-end gap-2">
                  {c.external ? (
                    <a
                      href={c.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${c.cta} — ${c.name} (opens in new tab)`}
                      className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg ${c.btn}`}
                    >
                      {c.cta} <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ) : (
                    <Link
                      href={c.href}
                      aria-label={`${c.cta} — ${c.name}`}
                      className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg ${c.btn}`}
                    >
                      {c.cta} <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                  {c.secondary && (
                    <Link
                      href={c.secondary.href}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {c.secondary.label}
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
