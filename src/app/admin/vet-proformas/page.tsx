import VetProformaManager from "@/components/admin/vet-proforma-manager";
export const metadata = { title: "Admin | Vet Proformas" };
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Veterinarian Proformas</h1>
        <p className="text-sm text-muted-foreground">Upload Post Mortem and Health Certificate for Export — Word and PDF. Shown on /vets page under Proformas section.</p>
      </div>
      <VetProformaManager />
    </div>
  );
}
