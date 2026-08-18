import Link from "next/link";
import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function EnrollCta({
  planSlug,
  title = "Premium Content",
  message,
}: {
  planSlug: string;
  title?: string;
  message?: string;
}) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-8 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {message ||
              "Enroll in this plan to unlock the full content, study material and resources."}
          </p>
        </div>
        <Link
          href={`/pricing?plan=${encodeURIComponent(planSlug)}`}
          className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          View Plans &amp; Enroll
        </Link>
      </CardContent>
    </Card>
  );
}
