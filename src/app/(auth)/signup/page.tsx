"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Image as ImageIcon,
  X,
  UserPlus,
  Eye,
  EyeOff,
} from "lucide-react";

const PROGRAMMES = [
  { value: "AHDP", label: "A.H.D.P." },
  { value: "BVSC", label: "B.V.Sc & A.H." },
  { value: "MVSC", label: "M.V.Sc" },
  { value: "PHD", label: "Ph.D" },
];

const EXPERT_ROLES = [
  "Veterinary Officer",
  "Senior Veterinary Officer",
  "Scientist",
  "Senior Scientist",
  "Principal Scientist",
  "Assistant Professor",
  "Associate Professor",
  "Professor",
];

const EXPERT_DEGREES = [
  "B.V.Sc & A.H.",
  "M.V.Sc",
  "Ph.D",
  "Diploma in Veterinary Science",
  "Post Doctorate",
  "Other",
];

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [role, setRole] = useState("student");
  const [programme, setProgramme] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectDepartment, setSubjectDepartment] = useState("");
  const [highestDegree, setHighestDegree] = useState("");
  const [expertDesignation, setExpertDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isMvscPhd = role === "student" && (programme === "MVSC" || programme === "PHD");

  useEffect(() => {
    if (role === "student" && (programme === "MVSC" || programme === "PHD")) {
      fetch(`/api/subjects?programme=${programme}`)
        .then((r) => r.json())
        .then((d) => setSubjects(d.subjects || []))
        .catch(() => setSubjects([]));
    } else {
      setSubjects([]);
    }
  }, [role, programme]);

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setAvatarUrl(data.url);
        setAvatarPreview(data.downloadUrl);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const isStudent = role === "student";

    // Client-side validation. Native inputs are read via FormData; custom
    // Select components are read from React state (they do NOT submit a form field).
    const missing: string[] = [];
    if (isStudent && !programme) missing.push("Programme");
    if (isStudent && isMvscPhd && !subjectDepartment) missing.push("Subject / Department");
    if (role === "farmer" && !fd.get("address")) missing.push("Address");
    if (role === "expert") {
      if (!highestDegree) missing.push("Highest Degree");
      if (!fd.get("specialization")) missing.push("Specialization");
      if (!expertDesignation) missing.push("Role");
    }

    const password = (fd.get("password") as string) || "";
    const confirm = (fd.get("confirmPassword") as string) || "";
    if (password && confirm && password !== confirm) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (missing.length > 0) {
      setError(`${missing.join(", ")} ${missing.length > 1 ? "are" : "is"} required.`);
      setIsLoading(false);
      return;
    }

    const payload: Record<string, unknown> = {
      name: fd.get("name"),
      surname: fd.get("surname"),
      email: fd.get("email"),
      password,
      role,
      avatar: avatarUrl || undefined,
      phone: phone || undefined,
    };

    if (isStudent) {
      payload.programme = programme || undefined;
      payload.college = fd.get("college") || undefined;
      payload.university = fd.get("university") || undefined;
      if (isMvscPhd) {
        payload.subjectDepartment = subjectDepartment || undefined;
      }
    } else if (role === "farmer") {
      payload.address = fd.get("address") || undefined;
    } else if (role === "expert") {
      payload.highestDegree = highestDegree || undefined;
      payload.specialization = fd.get("specialization") || undefined;
      payload.expertDesignation = expertDesignation || undefined;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-lg bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-2">
            VA
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Join VetAcademia and start learning
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            {/* Profile Photo */}
            <div className="flex items-center gap-4">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="profile"
                  className="h-16 w-16 rounded-full object-cover border"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <ImageIcon className="h-7 w-7 text-muted-foreground" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatar}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" /> Upload Photo
                    </>
                  )}
                </Button>
                {avatarPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAvatarUrl(null);
                      setAvatarPreview(null);
                    }}
                  >
                    <X className="h-4 w-4" /> Remove
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="name">First Name *</Label>
                <Input id="name" name="name" placeholder="John" required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">Surname</Label>
                <Input id="surname" name="surname" placeholder="Doe" disabled={isLoading} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Username) *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    disabled={isLoading}
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  disabled={isLoading}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              Use at least 8 characters.
            </p>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">I am a *</Label>
              <Select
                value={role}
                onValueChange={(v) => {
                  setRole(v ?? "student");
                  setSubjectDepartment("");
                  setHighestDegree("");
                  setExpertDesignation("");
                }}
                disabled={isLoading}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="farmer">Farmer</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Student fields */}
            {role === "student" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="programme">Programme *</Label>
                  <Select
                    value={programme}
                    onValueChange={(v) => {
                      setProgramme(v ?? "");
                      setSubjectDepartment("");
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="programme">
                      <SelectValue placeholder="Select programme" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROGRAMMES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isMvscPhd && (
                  <div className="space-y-2">
                    <Label htmlFor="subjectDepartment">Subject / Department *</Label>
                    <Select
                      value={subjectDepartment}
                      onValueChange={(v) => setSubjectDepartment(v ?? "")}
                      disabled={isLoading || subjects.length === 0}
                    >
                      <SelectTrigger id="subjectDepartment">
                        <SelectValue
                          placeholder={
                            subjects.length === 0
                              ? "No subjects found"
                              : "Select subject / department"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="college">College Name</Label>
                    <Input
                      id="college"
                      name="college"
                      placeholder="College name"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="university">University Name</Label>
                    <Input
                      id="university"
                      name="university"
                      placeholder="University name"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 ..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </>
            )}

            {/* Farmer fields */}
            {role === "farmer" && (
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <textarea
                  id="address"
                  name="address"
                  placeholder="Your full address"
                  required
                  disabled={isLoading}
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            {/* Expert fields */}
            {role === "expert" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="highestDegree">Highest Degree *</Label>
                  <Select
                    value={highestDegree}
                    onValueChange={(v) => setHighestDegree(v ?? "")}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="highestDegree">
                      <SelectValue placeholder="Select highest degree" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERT_DEGREES.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization *</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    placeholder="e.g. Veterinary Surgery"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expertDesignation">Role *</Label>
                  <Select
                    value={expertDesignation}
                    onValueChange={(v) => setExpertDesignation(v ?? "")}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="expertDesignation">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERT_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 ..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
