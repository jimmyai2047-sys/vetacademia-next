import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import PlanEditor from "@/components/admin/plan-editor";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  await requireAdmin();
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });

  const courses = plans.filter((p) => p.type === "COURSE");
  const exams = plans.filter((p) => p.type === "EXAM");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Pricing</h1>
        <p className="text-muted-foreground">
          Set the one-time price and description for each programme and exam
          preparation plan. Changes apply immediately on the public pricing page.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Programmes</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {courses.map((p) => (
            <PlanEditor
              key={p.slug}
              plan={{
                slug: p.slug,
                name: p.name,
                type: p.type,
                description: p.description,
                price: p.price,
              }}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Exam Preparation</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((p) => (
            <PlanEditor
              key={p.slug}
              plan={{
                slug: p.slug,
                name: p.name,
                type: p.type,
                description: p.description,
                price: p.price,
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
