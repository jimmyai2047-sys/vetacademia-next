import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEligibleCommunityLinks, PROGRAMME_REFS, EXAM_REFS } from "@/lib/community";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, ArrowLeft } from "lucide-react";

export const metadata = { title: "Community | VetAcademia" };

function refLabel(category: string, ref: string) {
  const list = category === "PROGRAMME" ? PROGRAMME_REFS : EXAM_REFS;
  return list.find((r) => r.value === ref)?.label || ref;
}

export default async function CommunityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-xl text-center">
        <h1 className="text-3xl font-bold mb-3">Community</h1>
        <p className="text-muted-foreground mb-6">
          Please log in to view your WhatsApp groups and Telegram channels.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Log In
        </Link>
      </div>
    );
  }

  const userId = session.user.id;
  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-xl text-center">
        <h1 className="text-3xl font-bold mb-3">Community</h1>
        <p className="text-muted-foreground mb-6">
          Please log in to view your WhatsApp groups and Telegram channels.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Log In
        </Link>
      </div>
    );
  }

  const links = await getEligibleCommunityLinks(userId);

  const byCategory = links.reduce<Record<string, typeof links>>((acc, l) => {
    (acc[l.category] ||= []).push(l);
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
      </Link>
      <h1 className="text-3xl md:text-4xl font-bold mb-2">Community</h1>
      <p className="text-muted-foreground mb-8">
        Join your batch&apos;s WhatsApp groups and Telegram channels to connect
        with fellow students and stay updated.
      </p>

      {links.length === 0 ? (
        <div className="rounded-xl border bg-muted/40 p-10 text-center">
          <p className="font-medium mb-2">No communities available yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            You&apos;ll see groups here once you enrol in a programme or exam
            track.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Browse Plans
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(byCategory).map(([category, items]) => (
            <section key={category}>
              <h2 className="text-xl font-semibold mb-4">
                {category === "PROGRAMME" ? "By Programme" : "By Examination"}
              </h2>
              <div className="space-y-4">
                {items.map((l) => (
                  <Card key={l.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        {l.platform === "WHATSAPP" ? (
                          <MessageCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Send className="h-5 w-5 text-sky-500" />
                        )}
                        {l.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {refLabel(l.category, l.ref)}
                      </span>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Join {l.platform === "WHATSAPP" ? "WhatsApp" : "Telegram"}
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
