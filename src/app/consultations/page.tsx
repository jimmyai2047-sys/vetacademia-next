import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default async function ConsultationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const expert = await prisma.expert.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const consultations = await prisma.consultation.findMany({
    where: expert
      ? { expertId: expert.id }
      : { studentId: session.user.id },
    orderBy: { slot: "desc" },
    include: {
      student: { select: { name: true, email: true } },
      expert: { include: { user: { select: { name: true } } } },
    },
  });

  const isExpert = !!expert;

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">My Consultations</h1>
      <p className="text-muted-foreground mb-8">
        {isExpert
          ? "Consultation requests from students."
          : "Your expert consultation bookings."}
      </p>

      {consultations.length === 0 ? (
        <div className="rounded-xl border bg-muted/40 p-10 text-center text-muted-foreground">
          No consultations yet.
          {!isExpert && (
            <div className="mt-4">
              <Link href="/experts">
                <Button>Book a Consultation</Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {consultations.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {isExpert ? c.student.name : c.expert.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.slot).toLocaleString("en-IN")} &middot; {c.duration} min
                  </p>
                </div>
                <Badge variant="outline">{STATUS[c.status] || c.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
