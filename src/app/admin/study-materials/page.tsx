import StudyMaterialManager from "@/components/admin/study-material-manager";

export const metadata = {
  title: "VetAcademia | Admin · Study Materials",
};

export default function AdminStudyMaterialsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Study Materials (UG / PG)</h1>
        <p className="text-muted-foreground">
          Manage syllabus study notes and resources. Mark items as Demo so they
          appear free on the public /demo showcase.
        </p>
      </div>
      <StudyMaterialManager />
    </div>
  );
}
