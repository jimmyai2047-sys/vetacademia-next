"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  BookOpen,
  GraduationCap,
  FlaskConical,
  Stethoscope,
  Edit,
  Trash2,
} from "lucide-react";

const programmes = [
  { id: "1", name: "AHDP", fullName: "Animal Husbandry Diploma Programme", subjects: 11, icon: BookOpen, color: "text-green-600" },
  { id: "2", name: "BVSC", fullName: "Bachelor of Veterinary Science & A.H.", subjects: 12, icon: GraduationCap, color: "text-blue-600" },
  { id: "3", name: "MVSC", fullName: "Master of Veterinary Science", departments: 18, icon: FlaskConical, color: "text-purple-600" },
  { id: "4", name: "PHD", fullName: "Doctor of Philosophy", departments: 18, icon: Stethoscope, color: "text-orange-600" },
];

const subjects = [
  { id: "1", code: "VAN-101", name: "Veterinary Anatomy", programme: "AHDP", year: "1st Year", chapters: 12 },
  { id: "2", code: "VPH-101", name: "Veterinary Physiology", programme: "AHDP", year: "1st Year", chapters: 10 },
  { id: "3", code: "VAN-301", name: "Veterinary Anatomy", programme: "BVSC", year: "1st Year", chapters: 15 },
  { id: "4", code: "VPH-301", name: "Veterinary Physiology", programme: "BVSC", year: "1st Year", chapters: 12 },
  { id: "5", code: "VPA-401", name: "Veterinary Pathology", programme: "BVSC", year: "2nd Year", chapters: 14 },
];

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-muted-foreground">Manage curriculum and study materials</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Content
        </Button>
      </div>

      <Tabs defaultValue="programmes">
        <TabsList>
          <TabsTrigger value="programmes">Programmes</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="materials">Study Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="programmes" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {programmes.map((prog) => (
              <Card key={prog.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <prog.icon className={`h-5 w-5 ${prog.color}`} />
                      <CardTitle className="text-lg">{prog.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="text-xs">{prog.fullName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {prog.subjects || prog.departments} {prog.subjects ? "Subjects" : "Departments"}
                    </Badge>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Subjects</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subject
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Programme</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Chapters</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-mono">{subject.code}</TableCell>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{subject.programme}</Badge>
                      </TableCell>
                      <TableCell>{subject.year}</TableCell>
                      <TableCell>{subject.chapters}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Study materials management coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
