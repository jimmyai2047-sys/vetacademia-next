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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Clock, IndianRupee } from "lucide-react";

const experts = [
  {
    id: 1,
    name: "Dr. Priya Verma",
    specialization: "Veterinary Anatomy",
    bio: "Professor with 15+ years of experience in veterinary anatomy and histology.",
    hourlyRate: 1500,
    rating: 4.9,
    reviews: 124,
    consultations: 456,
    available: true,
  },
  {
    id: 2,
    name: "Dr. Rajesh Kumar",
    specialization: "Veterinary Surgery",
    bio: "Senior veterinary surgeon specializing in orthopedic and soft tissue surgeries.",
    hourlyRate: 2000,
    rating: 4.8,
    reviews: 98,
    consultations: 321,
    available: true,
  },
  {
    id: 3,
    name: "Dr. Anita Singh",
    specialization: "Animal Nutrition",
    bio: "Expert in livestock nutrition and feed formulation with research background.",
    hourlyRate: 1200,
    rating: 4.7,
    reviews: 87,
    consultations: 234,
    available: true,
  },
  {
    id: 4,
    name: "Dr. Mohan Patel",
    specialization: "Veterinary Medicine",
    bio: "Clinical veterinarian with expertise in large animal medicine.",
    hourlyRate: 1800,
    rating: 4.9,
    reviews: 156,
    consultations: 567,
    available: false,
  },
  {
    id: 5,
    name: "Dr. Sunita Reddy",
    specialization: "Animal Reproduction",
    bio: "Specialist in animal reproduction, gynaecology and obstetrics.",
    hourlyRate: 1500,
    rating: 4.6,
    reviews: 76,
    consultations: 189,
    available: true,
  },
  {
    id: 6,
    name: "Dr. Amit Sharma",
    specialization: "Veterinary Pharmacology",
    bio: "Expert in veterinary pharmacology and toxicology with pharmaceutical industry experience.",
    hourlyRate: 1400,
    rating: 4.8,
    reviews: 112,
    consultations: 298,
    available: true,
  },
];

export default function ExpertsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Expert Consultations</h1>
        <p className="text-muted-foreground">
          Book one-on-one sessions with veterinary experts and professionals
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button variant="default" size="sm">All Experts</Button>
        <Button variant="outline" size="sm">Anatomy</Button>
        <Button variant="outline" size="sm">Surgery</Button>
        <Button variant="outline" size="sm">Medicine</Button>
        <Button variant="outline" size="sm">Nutrition</Button>
        <Button variant="outline" size="sm">Pharmacology</Button>
        <Button variant="outline" size="sm">Reproduction</Button>
      </div>

      {/* Experts Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {experts.map((expert) => (
          <Card key={expert.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {expert.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{expert.name}</CardTitle>
                  <CardDescription>{expert.specialization}</CardDescription>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{expert.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({expert.reviews} reviews)
                    </span>
                  </div>
                </div>
                {expert.available ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Available
                  </Badge>
                ) : (
                  <Badge variant="secondary">Busy</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{expert.bio}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <span>₹{expert.hourlyRate}/hour</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{expert.consultations} sessions</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" disabled={!expert.available}>
                {expert.available ? "Book Consultation" : "Not Available"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-2">Become an Expert</h3>
            <p className="opacity-90 mb-4">
              Share your knowledge and help veterinary students succeed
            </p>
            <Button variant="secondary" size="lg">
              Apply as Expert
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
