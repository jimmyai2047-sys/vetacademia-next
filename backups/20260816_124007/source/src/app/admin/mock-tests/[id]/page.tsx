import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import QuestionManager from "@/components/admin/question-manager";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminMockTestQuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const test = await prisma.mockTest.findUnique({ where: { id } });
  if (!test) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/mock-tests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{test.title}</h1>
          <p className="text-muted-foreground">
            {test.duration} min &middot; {test.totalMarks} marks
            {test.description ? ` &middot; ${test.description}` : ""}
          </p>
        </div>
      </div>
      <QuestionManager testId={id} />
    </div>
  );
}
