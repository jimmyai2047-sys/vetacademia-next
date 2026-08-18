import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Video, BookOpen, Download, Search } from "lucide-react";

const materials = [
  {
    id: 1,
    title: "Veterinary Anatomy Complete Notes",
    type: "PDF",
    subject: "Veterinary Anatomy",
    programme: "B.V.Sc & A.H.",
    size: "2.5 MB",
    downloads: 1234,
    icon: FileText,
  },
  {
    id: 2,
    title: "Cardiovascular System - Video Lesson",
    type: "VIDEO",
    subject: "Veterinary Physiology",
    programme: "B.V.Sc & A.H.",
    duration: "45 min",
    views: 5678,
    icon: Video,
  },
  {
    id: 3,
    title: "Pharmacology Drug List",
    type: "NOTES",
    subject: "Veterinary Pharmacology",
    programme: "B.V.Sc & A.H.",
    pages: 24,
    downloads: 890,
    icon: BookOpen,
  },
  {
    id: 4,
    title: "ICAR JRF Previous Year Papers",
    type: "PDF",
    subject: "General",
    programme: "All Programmes",
    size: "15 MB",
    downloads: 3456,
    icon: FileText,
  },
  {
    id: 5,
    title: "Pathology Lab Procedures",
    type: "VIDEO",
    subject: "Veterinary Pathology",
    programme: "B.V.Sc & A.H.",
    duration: "60 min",
    views: 2345,
    icon: Video,
  },
  {
    id: 6,
    title: "Surgery Instruments Guide",
    type: "PDF",
    subject: "Veterinary Surgery",
    programme: "B.V.Sc & A.H.",
    size: "8 MB",
    downloads: 678,
    icon: FileText,
  },
];

const typeColors: Record<string, string> = {
  PDF: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  VIDEO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  NOTES: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default function StudyMaterialsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Study Materials</h1>
        <p className="text-muted-foreground">
          Access comprehensive study materials, notes, and video lessons
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search materials..." className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="sm">All</Button>
          <Button variant="outline" size="sm">PDF</Button>
          <Button variant="outline" size="sm">Videos</Button>
          <Button variant="outline" size="sm">Notes</Button>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((material) => (
          <Card key={material.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <material.icon className="h-5 w-5 text-primary" />
                </div>
                <Badge className={typeColors[material.type]}>
                  {material.type}
                </Badge>
              </div>
              <CardTitle className="text-lg mt-4">{material.title}</CardTitle>
              <CardDescription>{material.subject}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{material.programme}</span>
                <span>
                  {material.size || material.duration || `${material.pages || 0} pages`}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Download className="h-4 w-4" />
                <span>{material.downloads?.toLocaleString() || material.views?.toLocaleString()} {material.type === "VIDEO" ? "views" : "downloads"}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline">
                {material.type === "VIDEO" ? "Watch Now" : "Download"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <Card className="bg-muted/50">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-2">Need more materials?</h3>
            <p className="text-muted-foreground mb-4">
              Upload your own notes or request specific study materials
            </p>
            <div className="flex gap-4 justify-center">
              <Button>Upload Material</Button>
              <Button variant="outline">Request Material</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
