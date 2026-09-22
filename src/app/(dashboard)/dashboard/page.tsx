export const metadata = {
  title: "VetAcademia | Dashboard",
  description: "Your VetAcademia dashboard.",
};

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { isExpertRole, roleLabel } from "@/lib/roles";
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
  BookOpen,
  Brain,
  Target,
  ArrowRight,
  GraduationCap,
  FileText,
  Tractor,
  HeartPulse,
  Stethoscope,
  Users,
  LayoutDashboard,
  NotebookPen,
  CalendarCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, programme: true, year: true, role: true, createdAt: true },
  });

  if (!currentUser) {
    redirect("/login");
  }

  const role = currentUser.role;
  const isStudent = role === "STUDENT";
  const isAnimalOwner = role === "ANIMAL_OWNER";
  const isExpert = isExpertRole(role);
  const isAdmin = role === "ADMIN";
  const isGuest = role === "GUEST";

  const expertProfile = isExpert
    ? await prisma.expert.findUnique({
        where: { userId: session.user.id },
        select: {
          id: true,
          isAvailable: true,
          hourlyRate: true,
          _count: { select: { consultations: true } },
        },
      })
    : null;

  const joinedYear = new Date(currentUser.createdAt).getFullYear().toString();

  const [testAttempts, subjectCount, recentAttempts, allTests] = isStudent
    ? await Promise.all([
        prisma.mockTestAttempt.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 200,
          include: {
            mockTest: {
              select: { title: true, totalMarks: true, subject: { select: { name: true } } },
            },
          },
        }),
        currentUser.programme
          ? prisma.subject.count({ where: { programme: { name: currentUser.programme } } })
          : Promise.resolve(0),
        prisma.mockTestAttempt.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            mockTest: {
              select: { title: true, totalMarks: true, subject: { select: { name: true } } },
            },
          },
        }),
        prisma.mockTest.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            subject: { select: { name: true, programme: { select: { name: true } } } },
          },
        }),
      ])
    : [[] as never[], 0, [] as never[], [] as never[]];

  const testsTaken = testAttempts.length;
  const safePct = (a: { score: number; totalMarks: number | null }) =>
    a.totalMarks ? Math.round((a.score / a.totalMarks) * 100) : 0;
  const avgScore =
    testsTaken > 0
      ? Math.round(testAttempts.reduce((sum, a) => sum + safePct(a), 0) / testsTaken)
      : 0;

  const subtitle = isStudent
    ? currentUser.programme
      ? `Continue your journey in ${currentUser.programme}`
      : "Track your progress and continue learning"
    : isAnimalOwner
    ? "Access advisory, helpline and expert consultation for your livestock"
    : isExpert
    ? "Manage your expert profile and consultations"
    : isGuest
    ? "You are browsing as a guest — sign up to unlock full access"
    : "Administer VetAcademia from the admin panel";

  const stats = isStudent
    ? [
        { label: "Programme", value: currentUser.programme || "N/A", icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
        { label: "Subjects", value: subjectCount.toString(), icon: BookOpen, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
        { label: "Tests Taken", value: testsTaken.toString(), icon: Brain, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
        { label: "Avg Score", value: `${avgScore}%`, icon: Target, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30" },
      ]
    : isExpert
    ? [
        { label: "Role", value: roleLabel(role), icon: Stethoscope, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
        { label: "Sessions", value: (expertProfile?._count.consultations ?? 0).toString(), icon: CalendarCheck, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
        { label: "Rate", value: expertProfile ? `Rs.${expertProfile.hourlyRate}` : "—", icon: Target, color: "text-orange-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
        { label: "Joined", value: joinedYear, icon: Users, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
      ]
    : isAnimalOwner
    ? [
        { label: "Role", value: "Animal Owner", icon: Tractor, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
        { label: "Joined", value: joinedYear, icon: Users, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
        { label: "Advisory", value: "Open", icon: HeartPulse, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" },
        { label: "Helpline", value: "24x7", icon: Stethoscope, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
      ]
    : isGuest
    ? [
        { label: "Role", value: "Guest", icon: Users, color: "text-muted-foreground", bg: "bg-muted" },
        { label: "Joined", value: joinedYear, icon: CalendarCheck, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
      ]
    : [{ label: "Role", value: "Admin", icon: LayoutDashboard, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" }];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/10 shadow-xl mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#005f48] to-[#003d2e]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-[#d4a843]/15 blur-3xl" />
        <div className="relative px-6 py-8 md:px-8 text-white">
          <Badge className="rounded-full bg-white/15 backdrop-blur-md border-white/20 text-white gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5 text-[#d4a843]" /> Dashboard
          </Badge>
          <h1 className="mt-3 text-3xl font-bold mb-2 tracking-tight">Welcome back, {currentUser.name}!</h1>
          <div className="h-1 w-16 rounded-full bg-gradient-to-r from-white to-[#d4a843]" />
          <p className="text-white/80 mt-2">{subtitle}</p>
          {isExpert && expertProfile && (
            <Badge
              variant={expertProfile.isAvailable ? "default" : "secondary"}
              className="mt-3"
            >
              {expertProfile.isAvailable ? "Available for consultation" : "Not available"}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="va-card-hover group relative overflow-hidden rounded-[1.5rem] border-primary/5 shadow-sm hover:shadow-xl bg-white">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </div>
              <div className="mt-3 h-0.5 w-6 rounded-full bg-primary/20 group-hover:w-10 group-hover:bg-primary transition-all" />
            </CardContent>
          </Card>
        ))}
      </div>

      {isAdmin ? (
        <Card className="va-card-hover relative overflow-hidden rounded-[1.5rem] border-primary/10 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
          <CardHeader>
            <CardTitle className="tracking-tight">Admin Panel</CardTitle>
            <CardDescription>Manage content, users, pricing and more</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin">
              <Button className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-primary to-[#005f48] shadow-sm">Go to Admin Panel</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Quick Links — role specific */}
          <Card className="va-card-hover rounded-[1.5rem] border-primary/10 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-70" />
            <CardHeader>
              <CardTitle className="tracking-tight">Quick Links</CardTitle>
              <CardDescription>Jump to key sections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(isStudent
                ? [
                    { href: "/syllabus", label: "Browse Syllabus", desc: "Subjects and chapters", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
                    { href: "/mock-tests", label: "Mock Tests", desc: "Practice with mock exams", icon: Brain, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
                    { href: "/flashcards", label: "Flashcards", desc: "Quick revision cards", icon: NotebookPen, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30" },
                    { href: "/study-materials", label: "Study Materials", desc: "Notes, videos and more", icon: FileText, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
                  ]
                : isAnimalOwner
                ? [
                    { href: "/farmers", label: "Animal Owner Corner", desc: "Guides, schemes, advisory & helpline", icon: HeartPulse, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" },
                    { href: "/consultations/book", label: "Book Consultation", desc: "Talk to a veterinary expert", icon: Stethoscope, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
                    { href: "/vets", label: "Vets Resources", desc: "Tools for practicing vets", icon: Tractor, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
                    { href: "/community", label: "Community", desc: "Animal owner groups & discussions", icon: Users, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
                  ]
                : isGuest
                ? [
                    { href: "/syllabus", label: "Browse Syllabus", desc: "Subjects and chapters", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
                    { href: "/mock-tests", label: "Mock Tests", desc: "Practice with mock exams", icon: Brain, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
                    { href: "/experts", label: "Experts", desc: "Browse veterinary experts", icon: Stethoscope, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
                    { href: "/community", label: "Community", desc: "Community groups & discussions", icon: Users, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
                  ]
                : [
                    { href: "/experts", label: "My Expert Profile", desc: "Public profile & sessions", icon: Stethoscope, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
                    { href: "/consultations", label: "My Consultations", desc: "Manage your bookings", icon: CalendarCheck, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
                    { href: "/community", label: "Community", desc: "Expert groups & discussions", icon: Users, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
                    { href: "/vets", label: "Vets Resources", desc: "Practice tools & references", icon: Tractor, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30" },
                  ]
              ).map((link) => (
                <Link key={link.href} href={link.href}>
                  <div className="flex items-center justify-between p-3 border border-primary/10 rounded-xl hover:border-primary/20 hover:shadow-sm hover:bg-gradient-to-r hover:from-primary/[0.04] hover:to-transparent transition-all cursor-pointer bg-white">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl ${link.bg} flex items-center justify-center shadow-sm`}>
                        <link.icon className={`h-4 w-4 ${link.color}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{link.label}</p>
                        <p className="text-xs text-muted-foreground">{link.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Secondary panel */}
          {isStudent ? (
            <Card className="va-card-hover rounded-[1.5rem] border-primary/10 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-[#d4a843] to-primary opacity-70" />
              <CardHeader>
                <CardTitle className="tracking-tight">Recommended Tests</CardTitle>
                <CardDescription>Available mock tests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {allTests.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No tests available yet</p>
                ) : (
                  allTests.map((test) => (
                    <Link key={test.id} href={`/mock-tests/${test.id}`}>
                      <div className="flex items-center justify-between p-3 border border-primary/10 rounded-xl hover:border-primary/20 hover:shadow-sm hover:bg-gradient-to-r hover:from-primary/[0.04] hover:to-transparent transition-all cursor-pointer bg-white">
                        <div>
                          <h4 className="font-medium text-sm">{test.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {test.subject?.name || "General"} &middot; {test.duration}min &middot; {test.totalMarks} marks
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </Link>
                  ))
                )}
                <Link href="/mock-tests">
                  <Button variant="outline" className="w-full">View All Tests</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="va-card-hover rounded-[1.5rem] border-primary/10 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-70" />
              <CardHeader>
                <CardTitle className="tracking-tight">{isAnimalOwner ? "Get Started" : isGuest ? "Explore VetAcademia" : "Expert Tools"}</CardTitle>
                <CardDescription>
                  {isAnimalOwner
                    ? "Reach Animal Owner Corner, helpline and experts"
                    : isGuest
                    ? "Browse the platform as a guest"
                    : "Manage your consultations and profile"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isAnimalOwner ? (
                  <>
                    <Link href="/farmers">
                      <Button className="w-full">Open Animal Owner Corner</Button>
                    </Link>
                    <Link href="/consultations/book">
                      <Button variant="outline" className="w-full">Book a Consultation</Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/experts">
                      <Button className="w-full">View My Profile</Button>
                    </Link>
                    <Link href="/consultations">
                      <Button variant="outline" className="w-full">My Consultations</Button>
                    </Link>
                  </>
                )}
                <Link href="/community">
                  <Button variant="ghost" className="w-full">Browse Community</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {isStudent && (
        <Card className="va-card-hover rounded-[1.5rem] border-primary/10 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-primary to-[#d4a843] opacity-70" />
          <CardHeader>
            <CardTitle className="tracking-tight">Recent Activity</CardTitle>
            <CardDescription>Your latest test attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAttempts.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No test attempts yet. Start practicing!</p>
                  <Link href="/mock-tests">
                    <Button className="mt-4" size="sm">Browse Mock Tests</Button>
                  </Link>
                </div>
              ) : (
                recentAttempts.map((attempt) => {
                  const percentage = attempt.totalMarks
                    ? Math.round((attempt.score / attempt.totalMarks) * 100)
                    : 0;
                  return (
                    <div key={attempt.id} className="flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-primary/10 hover:bg-gradient-to-r hover:from-primary/[0.04] hover:to-transparent hover:shadow-sm transition-all">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{attempt.mockTest.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {attempt.mockTest.subject?.name || "General"} &middot; {timeAgo(attempt.createdAt)}
                        </p>
                      </div>
                      <Badge variant={percentage >= 70 ? "default" : percentage >= 50 ? "secondary" : "destructive"}>
                        {percentage}%
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
