import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, FlaskConical, Stethoscope, ArrowLeft } from "lucide-react";

const programmes = {
  ahdp: {
    name: "A.H.D.P.",
    fullName: "Animal Husbandry Diploma Programme",
    description: "Comprehensive diploma in animal husbandry practices covering all essential aspects of livestock management.",
    icon: BookOpen,
    color: "text-green-600",
    yearType: "semester",
    subjects: [
      { id: "anatomy", name: "Veterinary Anatomy", year: "1st Year", semester: "1st Semester" },
      { id: "physiology", name: "Veterinary Physiology", year: "1st Year", semester: "1st Semester" },
      { id: "management", name: "Introductory Animal Management", year: "1st Year", semester: "2nd Semester" },
      { id: "nutrition", name: "Introductory Animal Nutrition", year: "2nd Year", semester: "3rd Semester" },
      { id: "breeding", name: "Animal Breeding", year: "2nd Year", semester: "3rd Semester" },
      { id: "reproduction", name: "Animal Reproduction", year: "2nd Year", semester: "4th Semester" },
      { id: "pharmacology", name: "Veterinary Pharmacology", year: "2nd Year", semester: "4th Semester" },
      { id: "medicine", name: "Introductory Veterinary Medicine", year: "2nd Year", semester: "4th Semester" },
      { id: "surgery", name: "Minor Veterinary Surgery", year: "2nd Year", semester: "4th Semester" },
      { id: "preventive", name: "Preventive Medicine", year: "2nd Year", semester: "4th Semester" },
      { id: "extension", name: "Animal Husbandry Extension Education", year: "2nd Year", semester: "4th Semester" },
    ],
  },
  bvsc: {
    name: "B.V.Sc & A.H.",
    fullName: "Bachelor of Veterinary Science & Animal Husbandry",
    description: "Professional undergraduate degree in veterinary science and animal husbandry.",
    icon: GraduationCap,
    color: "text-blue-600",
    yearType: "year",
    subjects: [
      { id: "anatomy", name: "Veterinary Anatomy", year: "1st Year", paper: "1st Paper" },
      { id: "physiology", name: "Veterinary Physiology", year: "1st Year", paper: "1st Paper" },
      { id: "biochemistry", name: "Veterinary Biochemistry", year: "2nd Year", paper: "1st Paper" },
      { id: "pathology", name: "Veterinary Pathology", year: "2nd Year", paper: "2nd Paper" },
      { id: "microbiology", name: "Veterinary Microbiology", year: "2nd Year", paper: "2nd Paper" },
      { id: "parasitology", name: "Veterinary Parasitology", year: "3rd Year", paper: "1st Paper" },
      { id: "pharmacology", name: "Veterinary Pharmacology", year: "3rd Year", paper: "1st Paper" },
      { id: "public-health", name: "Veterinary Public Health", year: "3rd Year", paper: "2nd Paper" },
      { id: "medicine", name: "Veterinary Medicine", year: "4th Year", paper: "1st Paper" },
      { id: "surgery", name: "Veterinary Surgery", year: "4th Year", paper: "2nd Paper" },
      { id: "gynaecology", name: "Veterinary Gynaecology & Obstetrics", year: "4th Year", paper: "2nd Paper" },
      { id: "clinical-practices", name: "Veterinary Clinical Practices", year: "4th Year", paper: "3rd Paper" },
    ],
  },
  mvsc: {
    name: "M.V.Sc",
    fullName: "Master of Veterinary Science",
    description: "Advanced postgraduate specializations in various veterinary disciplines.",
    icon: FlaskConical,
    color: "text-purple-600",
    yearType: "department",
    departments: [
      { id: "animal-genetics-breeding", name: "Animal Genetics & Breeding" },
      { id: "animal-nutrition", name: "Animal Nutrition" },
      { id: "animal-reproduction", name: "Animal Reproduction, Gynaecology & Obstetrics" },
      { id: "livestock-production", name: "Livestock Production & Management" },
      { id: "livestock-products", name: "Livestock Products Technology" },
      { id: "poultry-science", name: "Poultry Science" },
      { id: "veterinary-anatomy", name: "Veterinary Anatomy" },
      { id: "veterinary-biochemistry", name: "Veterinary Biochemistry" },
      { id: "veterinary-biotechnology", name: "Veterinary Biotechnology" },
      { id: "veterinary-extension", name: "Veterinary Extension Education" },
      { id: "veterinary-medicine", name: "Veterinary Medicine" },
      { id: "veterinary-microbiology", name: "Veterinary Microbiology" },
      { id: "veterinary-parasitology", name: "Veterinary Parasitology" },
      { id: "veterinary-pathology", name: "Veterinary Pathology" },
      { id: "veterinary-pharmacology", name: "Veterinary Pharmacology & Toxicology" },
      { id: "veterinary-physiology", name: "Veterinary Physiology" },
      { id: "veterinary-public-health", name: "Veterinary Public Health & Epidemiology" },
      { id: "veterinary-surgery", name: "Veterinary Surgery & Radiology" },
    ],
  },
  phd: {
    name: "Ph.D",
    fullName: "Doctor of Philosophy in Veterinary Science",
    description: "Doctoral research programs in various veterinary specializations.",
    icon: Stethoscope,
    color: "text-orange-600",
    yearType: "department",
    departments: [
      { id: "animal-genetics-breeding", name: "Animal Genetics & Breeding" },
      { id: "animal-nutrition", name: "Animal Nutrition" },
      { id: "animal-reproduction", name: "Animal Reproduction, Gynaecology & Obstetrics" },
      { id: "livestock-production", name: "Livestock Production & Management" },
      { id: "livestock-products", name: "Livestock Products Technology" },
      { id: "poultry-science", name: "Poultry Science" },
      { id: "veterinary-anatomy", name: "Veterinary Anatomy" },
      { id: "veterinary-biochemistry", name: "Veterinary Biochemistry" },
      { id: "veterinary-biotechnology", name: "Veterinary Biotechnology" },
      { id: "veterinary-extension", name: "Veterinary Extension Education" },
      { id: "veterinary-medicine", name: "Veterinary Medicine" },
      { id: "veterinary-microbiology", name: "Veterinary Microbiology" },
      { id: "veterinary-parasitology", name: "Veterinary Parasitology" },
      { id: "veterinary-pathology", name: "Veterinary Pathology" },
      { id: "veterinary-pharmacology", name: "Veterinary Pharmacology & Toxicology" },
      { id: "veterinary-physiology", name: "Veterinary Physiology" },
      { id: "veterinary-surgery", name: "Veterinary Surgery & Radiology" },
    ],
  },
};

type ProgrammeKey = keyof typeof programmes;

export function generateStaticParams() {
  return Object.keys(programmes).map((programme) => ({
    programme,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ programme: ProgrammeKey }> }) {
  const { programme: p } = await params;
  const data = programmes[p];
  if (!data) return { title: "Not Found" };

  return {
    title: `${data.name} Syllabus | VetAcademia`,
    description: data.description,
  };
}

export default async function ProgrammePage({ params }: { params: Promise<{ programme: ProgrammeKey }> }) {
  const { programme: p } = await params;
  const data = programmes[p];

  if (!data) {
    notFound();
  }

  const Icon = data.icon;
  const items = "subjects" in data ? data.subjects : "departments" in data ? data.departments : [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/syllabus" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          All Programmes
        </Link>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-primary/10`}>
            <Icon className={`h-6 w-6 ${data.color}`} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{data.name}</h1>
            <p className="text-muted-foreground">{data.fullName}</p>
          </div>
        </div>
        <p className="mt-4 text-muted-foreground max-w-3xl">{data.description}</p>
      </div>

      {/* Items Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item: { id: string; name: string; year?: string; semester?: string; paper?: string }) => (
          <Link key={item.id} href={`/syllabus/${p}/${item.id}`}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {item.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {item.year && <Badge variant="secondary">{item.year}</Badge>}
                  {item.semester && <Badge variant="outline">{item.semester}</Badge>}
                  {item.paper && <Badge variant="outline">{item.paper}</Badge>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  View Syllabus →
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
