import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BookOpen, Clock, FileText } from "lucide-react";

// Sample data - in production this would come from the database
const subjectsData: Record<string, Record<string, { name: string; description: string; units: { title: string; chapters: string[] }[] }>> = {
  ahdp: {
    anatomy: {
      name: "Veterinary Anatomy",
      description: "Study of the structure and organization of animal bodies",
      units: [
        {
          title: "Unit I: General Anatomy",
          chapters: [
            "Introduction to Veterinary Anatomy",
            "Cell and Tissues",
            "Skeletal System - Axial Skeleton",
            "Skeletal System - Appendicular Skeleton",
          ],
        },
        {
          title: "Unit II: Systemic Anatomy",
          chapters: [
            "Muscular System",
            "Cardiovascular System",
            "Respiratory System",
            "Digestive System",
          ],
        },
        {
          title: "Unit III: Special Anatomy",
          chapters: [
            "Nervous System",
            "Reproductive System",
            "Urogenital System",
            "Integumentary System",
          ],
        },
      ],
    },
    physiology: {
      name: "Veterinary Physiology",
      description: "Study of functions and mechanisms in animal bodies",
      units: [
        {
          title: "Unit I: General Physiology",
          chapters: [
            "Cell Physiology",
            "Nerve and Muscle Physiology",
            "Blood and Body Fluids",
            "Homeostasis",
          ],
        },
        {
          title: "Unit II: Systemic Physiology",
          chapters: [
            "Cardiovascular Physiology",
            "Respiratory Physiology",
            "Renal Physiology",
            "Digestive Physiology",
          ],
        },
        {
          title: "Unit III: Reproductive Physiology",
          chapters: [
            "Male Reproductive Physiology",
            "Female Reproductive Physiology",
            "Lactation Physiology",
            "Endocrinology",
          ],
        },
      ],
    },
  },
  bvsc: {
    anatomy: {
      name: "Veterinary Anatomy",
      description: "Comprehensive study of animal body structures",
      units: [
        {
          title: "Unit I: Histology",
          chapters: [
            "Cell Biology and Histological Techniques",
            "Epithelial Tissues",
            "Connective Tissues",
            "Muscle and Nervous Tissues",
          ],
        },
        {
          title: "Unit II: Gross Anatomy",
          chapters: [
            "Locomotor System",
            "Cardiovascular System",
            "Respiratory System",
            "Alimentary System",
          ],
        },
        {
          title: "Unit III: Regional Anatomy",
          chapters: [
            "Head and Neck",
            "Thorax",
            "Abdomen",
            "Pelvis and Perineum",
          ],
        },
      ],
    },
  },
};

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ programme: string; subject: string }>;
}) {
  const { programme, subject } = await params;

  const programmeData = subjectsData[programme];
  if (!programmeData) {
    notFound();
  }

  const subjectData = programmeData[subject];
  if (!subjectData) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/syllabus" className="hover:text-primary">
          Syllabus
        </Link>
        <span>/</span>
        <Link href={`/syllabus/${programme}`} className="hover:text-primary">
          {programme.toUpperCase()}
        </Link>
        <span>/</span>
        <span className="text-foreground">{subjectData.name}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/syllabus/${programme}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {programme.toUpperCase()}
        </Link>
        <h1 className="text-3xl font-bold mb-2">{subjectData.name}</h1>
        <p className="text-muted-foreground">{subjectData.description}</p>
        <div className="flex items-center gap-4 mt-4">
          <Badge variant="secondary" className="gap-1">
            <BookOpen className="h-3 w-3" />
            {subjectData.units.length} Units
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <FileText className="h-3 w-3" />
            {subjectData.units.reduce((acc, u) => acc + u.chapters.length, 0)} Chapters
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            40 Hours
          </Badge>
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="syllabus" className="space-y-6">
        <TabsList>
          <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
          <TabsTrigger value="materials">Study Materials</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="videos">Video Lessons</TabsTrigger>
        </TabsList>

        <TabsContent value="syllabus" className="space-y-6">
          {subjectData.units.map((unit, index) => (
            <div key={index} className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Badge variant="outline">Unit {index + 1}</Badge>
                {unit.title}
              </h3>
              <ul className="space-y-3">
                {unit.chapters.map((chapter, chapterIndex) => (
                  <li key={chapterIndex} className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {chapterIndex + 1}
                    </div>
                    <span className="flex-1">{chapter}</span>
                    <Button variant="ghost" size="sm">
                      Read More →
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="materials">
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Study materials will be available soon</p>
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Notes will be available soon</p>
          </div>
        </TabsContent>

        <TabsContent value="videos">
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Video lessons will be available soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
