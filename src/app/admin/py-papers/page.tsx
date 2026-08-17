import MockTestManager from "@/components/admin/mock-test-manager";

export default function AdminPYPapersPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Previous Year Papers</h1>
        <p className="text-muted-foreground">
          Add, edit and organise previous year question papers. Tag each with its
          exam year so students can browse them on the /papers page.
        </p>
      </div>
      <MockTestManager scope="PREVIOUS_YEAR" />
    </div>
  );
}
