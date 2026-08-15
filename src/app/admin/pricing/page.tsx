import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import PlanEditor from "@/components/admin/plan-editor";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  await requireAdmin();
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });

  const fullCourses = plans.filter(
    (p) => p.type === "COURSE" && !p.year && !p.subjectId
  );
  const yearPlans = plans.filter((p) => p.type === "COURSE" && !!p.year);
  const subjectPlans = plans.filter((p) => p.type === "COURSE" && !!p.subjectId);
  const exams = plans.filter((p) => p.type === "EXAM");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Pricing</h1>
        <p className="text-muted-foreground">
          Set the one-time price and description for each programme, exam
          preparation plan, and granular year/subject plan. Changes apply
          immediately on the public pricing page.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Programmes (Full)</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {fullCourses.map((p) => (
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
        <h2 className="text-lg font-semibold mb-3">
          Year Plans (BVSc / AHDP)
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {yearPlans.map((p) => (
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
        <h2 className="text-lg font-semibold mb-3">
          Subject Plans (M.V.Sc / Ph.D)
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjectPlans.map((p) => (
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
