import { Wrench } from "lucide-react";

export const metadata = {
  title: "VetAcademia | Maintenance",
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        <Wrench className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-3xl font-bold">Under Maintenance</h1>
        <p className="text-muted-foreground max-w-md">
          We&apos;re currently performing scheduled maintenance. Please check back
          shortly.
        </p>
        <p className="text-xs text-muted-foreground">
          If you are an admin, you can still access the{" "}
          <a href="/admin" className="text-primary hover:underline">
            admin panel
          </a>
          .
        </p>
      </div>
    </div>
  );
}
