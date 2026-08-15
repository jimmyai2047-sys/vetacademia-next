import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Layers, BookOpen, FlaskConical } from "lucide-react";

export const metadata = { title: "Flashcards | VetAcademia" };

export default function FlashcardsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">Flashcards</h1>
      <p className="text-muted-foreground mb-8">
        Reinforce your learning with quick-revision flashcards. Browse related
        resources below to get started.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/study-materials">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-start gap-4">
              <BookOpen className="h-7 w-7 text-primary mt-1" />
              <div>
                <p className="font-semibold">Study Materials</p>
                <p className="text-sm text-muted-foreground">
                  Notes and videos organised by subject.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/mock-tests">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-start gap-4">
              <FlaskConical className="h-7 w-7 text-primary mt-1" />
              <div>
                <p className="font-semibold">Mock Tests</p>
                <p className="text-sm text-muted-foreground">
                  Practice questions with instant feedback.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-10 rounded-xl border bg-muted/40 p-6 text-center text-muted-foreground">
        <Layers className="h-8 w-8 mx-auto mb-2 text-primary" />
        A dedicated flashcards revision mode is on our roadmap. In the meantime,
        use the resources above to revise effectively.
      </div>
    </div>
  );
}
