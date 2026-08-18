import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Landmark,
  Syringe,
  FileBarChart,
  Wheat,
  Megaphone,
  Stethoscope,
  ChevronRight,
  ArrowRight,
  Shield,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  Phone,
} from "lucide-react";
import { getPublishedPosts } from "@/lib/posts";
import PostList from "@/components/post-list";

export const dynamic = "force-dynamic";

const schemes = [
  {
    name: "National Livestock Insurance Scheme",
    category: "Insurance",
    description: "Insurance coverage for livestock against death due to disease or accident.",
    status: "Active",
  },
  {
    name: "Rashtriya Gokul Mission",
    category: "Breeding",
    description: "Conservation and development of indigenous cattle breeds.",
    status: "Active",
  },
  {
    name: "National Animal Disease Control Programme",
    category: "Disease Control",
    description: "Foot and Mouth Disease (FMD) and Brucellosis control programme.",
    status: "Active",
  },
  {
    name: "Integrated Scheme on Agriculture Development",
    category: "Development",
    description: "Integrated approach for agriculture and allied sector development.",
    status: "Active",
  },
  {
    name: "Livestock Health and Disease Control Programme",
    category: "Health",
    description: "Prevention, control, and eradication of livestock diseases.",
    status: "Active",
  },
  {
    name: "Pradhan Mantri Matsya Sampada Yojana",
    category: "Fisheries",
    description: "Sustainable development of fisheries sector.",
    status: "Active",
  },
];

const vaccinationSchedule = [
  {
    disease: "Foot and Mouth Disease (FMD)",
    animals: "Cattle, Buffalo, Sheep, Goat",
    firstDose: "6 months",
    booster: "6 months after 1st dose",
    annual: "Every 6 months",
    vaccine: "FMD Vaccine",
  },
  {
    disease: "Brucellosis",
    animals: "Cattle, Buffalo",
    firstDose: "4-8 months (female calves)",
    booster: "Not required",
    annual: "Single dose",
    vaccine: "Brucella abortus S19",
  },
  {
    disease: "Haemorrhagic Septicemia",
    animals: "Cattle, Buffalo",
    firstDose: "6 months",
    booster: "6 months after 1st dose",
    annual: "Before monsoon",
    vaccine: "HS Vaccine",
  },
  {
    disease: "Black Quarter (BQ)",
    animals: "Cattle, Sheep, Goat",
    firstDose: "6 months",
    booster: "6 months after 1st dose",
    annual: "Every year",
    vaccine: "BQ Vaccine",
  },
  {
    disease: "Rabies",
    animals: "All Animals",
    firstDose: "3 months",
    booster: "Annual booster",
    annual: "Every year",
    vaccine: "Anti-rabies Vaccine",
  },
  {
    disease: "Peste des Petits Ruminants (PPR)",
    animals: "Sheep, Goat",
    firstDose: "3 months",
    booster: "6 months after 1st dose",
    annual: "Every year",
    vaccine: "PPR Vaccine",
  },
];

const dewormingSchedule = [
  { animal: "Cattle", firstDose: "3 months", frequency: "Every 3 months", bestTime: "Morning feed", products: "Albendazole, Ivermectin" },
  { animal: "Buffalo", firstDose: "3 months", frequency: "Every 3 months", bestTime: "Morning feed", products: "Albendazole, Ivermectin" },
  { animal: "Sheep", firstDose: "2 months", frequency: "Every 2-3 months", bestTime: "Morning feed", products: "Albendazole, Fenbendazole" },
  { animal: "Goat", firstDose: "2 months", frequency: "Every 2-3 months", bestTime: "Morning feed", products: "Albendazole, Fenbendazole" },
  { animal: "Horse", firstDose: "2 months", frequency: "Every 2 months", bestTime: "Morning feed", products: "Ivermectin, Moxidectin" },
  { animal: "Poultry", firstDose: "2 weeks", frequency: "Every 4 weeks", bestTime: "With water", products: "Levamisole, Albendazole" },
];

const feedFormulation = [
  {
    animal: "Cattle (Milking)",
    feedType: "Mixed Ration",
    ingredients: "Maize, Soybean meal, Wheat bran, Mineral mixture, Salt",
    protein: "16-18%",
    energy: "2.8-3.0 Mcal/kg",
    tips: "Provide 1 kg concentrate per 2.5 L milk produced",
  },
  {
    animal: "Cattle (Dry)",
    feedType: "Maintenance Ration",
    ingredients: "Rice straw, Wheat bran, Mineral mixture, Salt lick",
    protein: "10-12%",
    energy: "2.2-2.4 Mcal/kg",
    tips: "Reduce concentrate 2 months before calving",
  },
  {
    animal: "Buffalo",
    feedType: "Mixed Ration",
    ingredients: "Maize, Cottonseed cake, Rice bran, Mineral mixture",
    protein: "14-16%",
    energy: "2.6-2.8 Mcal/kg",
    tips: "Buffaloes need more energy in winter",
  },
  {
    animal: "Sheep/Goat",
    feedType: "Concentrate Mix",
    ingredients: "Maize, Groundnut cake, Wheat bran, Mineral block",
    protein: "14-16%",
    energy: "2.4-2.6 Mcal/kg",
    tips: "Provide green fodder daily for best results",
  },
  {
    animal: "Poultry (Layers)",
    feedType: "Layer Mash",
    ingredients: "Maize, Soybean meal, Fish meal, Limestone, Dicalcium phosphate",
    protein: "16-18%",
    energy: "2.8-3.0 Mcal/kg",
    tips: "Provide oyster shell for strong eggshells",
  },
  {
    animal: "Poultry (Broilers)",
    feedType: "Broiler Starter",
    ingredients: "Maize, Soybean meal, Fish meal, Oil, Vitamin premix",
    protein: "20-22%",
    energy: "3.0-3.2 Mcal/kg",
    tips: "Phase feeding: Starter → Grower → Finisher",
  },
];

export default async function FarmersPage() {
  const farmerPosts = await getPublishedPosts("FARMERS");
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Farmers Corner</h1>
        </div>
        <p className="text-white/90 max-w-2xl">
          Your one-stop destination for livestock management. Access government schemes, vaccination schedules,
          feed formulations, and expert advisory services.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Landmark className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">12+</div>
                <div className="text-xs text-muted-foreground">Govt Schemes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Syringe className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">8+</div>
                <div className="text-xs text-muted-foreground">Vaccines Covered</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <Wheat className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">10+</div>
                <div className="text-xs text-muted-foreground">Feed Recipes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Phone className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-xs text-muted-foreground">Expert Support</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 6 Main Sections */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">

        {/* 1. Government Schemes */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Landmark className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Government Schemes</CardTitle>
                <CardDescription>Live stock related schemes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schemes.map((scheme, i) => (
                <div key={i} className="p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-medium text-sm">{scheme.name}</div>
                    <Badge variant="default" className="text-xs shrink-0">{scheme.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{scheme.description}</div>
                  <Badge variant="outline" className="mt-2 text-xs">{scheme.category}</Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Schemes <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* 2. Vaccination Schedule */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Syringe className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <CardTitle>Vaccination Schedule</CardTitle>
                <CardDescription>Complete vaccination calendar</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vaccinationSchedule.map((vaccine, i) => (
                <div key={i} className="p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                  <div className="font-medium text-sm mb-1">{vaccine.disease}</div>
                  <div className="text-xs text-muted-foreground mb-2">{vaccine.animals}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">1st Dose:</span> {vaccine.firstDose}</div>
                    <div><span className="text-muted-foreground">Booster:</span> {vaccine.booster}</div>
                  </div>
                  <Badge variant="secondary" className="mt-2 text-xs">{vaccine.vaccine}</Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Full Vaccination Calendar <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* 3. Project Report */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                <FileBarChart className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <CardTitle>Project Report</CardTitle>
                <CardDescription>Dairy & livestock project reports</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: "Dairy Farming (10 Cattle)", investment: "Rs. 5-8 Lakh", returns: "Rs. 3-4 Lakh/year", duration: "2-3 years" },
                { title: "Goat Farming (50 Goats)", investment: "Rs. 2-3 Lakh", returns: "Rs. 1.5-2 Lakh/year", duration: "1-2 years" },
                { title: "Poultry Farming (500 Birds)", investment: "Rs. 3-4 Lakh", returns: "Rs. 2-3 Lakh/year", duration: "1 year" },
                { title: "Pig Farming (20 Pigs)", investment: "Rs. 2-3 Lakh", returns: "Rs. 1.5-2 Lakh/year", duration: "1-1.5 years" },
                { title: "Sheep Farming (100 Sheep)", investment: "Rs. 3-4 Lakh", returns: "Rs. 2-2.5 Lakh/year", duration: "1-2 years" },
              ].map((project, i) => (
                <div key={i} className="p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                  <div className="font-medium text-sm mb-1">{project.title}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Investment:</span> {project.investment}</div>
                    <div><span className="text-muted-foreground">Returns:</span> {project.returns}</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3 inline mr-1" /> Payback: {project.duration}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Generate Custom Report <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* 4. Feed Formulation */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <Wheat className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle>Feed Formulation</CardTitle>
                <CardDescription>Customized feed recipes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feedFormulation.map((feed, i) => (
                <div key={i} className="p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                  <div className="font-medium text-sm mb-1">{feed.animal}</div>
                  <div className="text-xs text-muted-foreground mb-2">{feed.feedType}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div><span className="text-muted-foreground">Protein:</span> {feed.protein}</div>
                    <div><span className="text-muted-foreground">Energy:</span> {feed.energy}</div>
                  </div>
                  <div className="text-xs text-green-600 italic">{feed.tips}</div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Calculate Custom Feed <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* 5. Advisory */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Megaphone className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <CardTitle>Advisory</CardTitle>
                <CardDescription>Expert guidance & alerts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: "Monsoon Management for Livestock", type: "Seasonal", date: "Updated: July 2026", icon: "🌧️" },
                { title: "Heat Stress Prevention Tips", type: "Health", date: "Updated: May 2026", icon: "🌡️" },
                { title: "FMD Alert - Vaccination Drive", type: "Alert", date: "Updated: Aug 2026", icon: "⚠️" },
                { title: "Best Practices for Feed Storage", type: "Management", date: "Updated: June 2026", icon: "🌾" },
                { title: "Disease Outbreak Prevention", type: "Health", date: "Updated: Aug 2026", icon: "🛡️" },
              ].map((advisory, i) => (
                <div key={i} className="p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{advisory.icon}</span>
                    <div className="font-medium text-sm">{advisory.title}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{advisory.type}</Badge>
                    <span className="text-xs text-muted-foreground">{advisory.date}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Advisories <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* 6. Consultation */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <CardTitle>Consultation</CardTitle>
                <CardDescription>Talk to veterinary experts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Dr. Rajesh Kumar", specialty: "Veterinary Surgery", experience: "15 years exp", available: true },
                { name: "Dr. Priya Sharma", specialty: "Animal Nutrition", experience: "12 years exp", available: true },
                { name: "Dr. Amit Singh", specialty: "Veterinary Medicine", experience: "10 years exp", available: false },
                { name: "Dr. Neha Gupta", specialty: "Dairy Management", experience: "8 years exp", available: true },
              ].map((expert, i) => (
                <div key={i} className="p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-sm">{expert.name}</div>
                    <Badge variant={expert.available ? "default" : "secondary"} className="text-xs">
                      {expert.available ? "Available" : "Busy"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{expert.specialty}</div>
                  <div className="text-xs text-muted-foreground">{expert.experience}</div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Book Consultation <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Deworming Schedule Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Deworming Schedule</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Animal</th>
                    <th className="text-left p-4 font-medium">1st Dose</th>
                    <th className="text-left p-4 font-medium">Frequency</th>
                    <th className="text-left p-4 font-medium">Best Time</th>
                    <th className="text-left p-4 font-medium">Products</th>
                  </tr>
                </thead>
                <tbody>
                  {dewormingSchedule.map((item, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-accent transition-colors">
                      <td className="p-4 font-medium">{item.animal}</td>
                      <td className="p-4 text-muted-foreground">{item.firstDose}</td>
                      <td className="p-4 text-muted-foreground">{item.frequency}</td>
                      <td className="p-4 text-muted-foreground">{item.bestTime}</td>
                      <td className="p-4 text-muted-foreground">{item.products}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin-managed Updates & Resources */}
      {farmerPosts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Updates &amp; Resources</h2>
          <PostList posts={farmerPosts} />
        </div>
      )}

      {/* Helpline Banner */}
      <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Need Immediate Help?</h3>
          <p className="opacity-90 mb-4">
            Call our toll-free veterinary helpline or book an online consultation with experts
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="secondary" size="lg">
              <Phone className="h-4 w-4 mr-2" /> Call Helpline
            </Button>
            <Link href="/experts">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                <Stethoscope className="h-4 w-4 mr-2" /> Book Consultation
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
