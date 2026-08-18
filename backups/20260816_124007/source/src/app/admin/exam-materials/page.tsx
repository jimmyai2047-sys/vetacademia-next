import { requireAdmin } from "@/lib/admin";
import ExamMaterialManager from "@/components/admin/exam-material-manager";

export const metadata = { title: "Exam Study Materials | Admin" };

export default async function AdminExamMaterialsPage() {
  await requireAdmin();
  return <ExamMaterialManager />;
}
