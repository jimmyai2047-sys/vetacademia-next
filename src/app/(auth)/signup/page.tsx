"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Image as ImageIcon,
  X,
  UserPlus,
  ArrowLeft,
  ArrowRight,
  CircleCheck,
} from "lucide-react";
import {
  EXPERT_ROLE_GROUPS,
  EXPERT_ROLE_LABELS,
} from "@/lib/roles";
import { startGuestSession } from "@/lib/guest";
import { signIn } from "next-auth/react";
import { csrfFetch, getCsrfToken } from "@/lib/csrf-client";
import { getSafeRedirect } from "@/lib/auth-redirect";
import { PASSWORD_MIN_LENGTH } from "@/lib/password";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";
import { GoogleButton } from "@/components/auth/google-button";
import { EmailOtpWidget } from "@/components/auth/email-otp-widget";
import { cn } from "@/lib/utils";

const PROGRAMMES = [
  { value: "AHDP", label: "A.H.D.P." },
  { value: "BVSC", label: "B.V.Sc & A.H." },
  { value: "MVSC", label: "M.V.Sc" },
  { value: "PHD", label: "Ph.D" },
];

const EXPERT_DEGREES = [
  "B.V.Sc & A.H.",
  "M.V.Sc",
  "Ph.D",
  "Diploma in Veterinary Science",
  "Post Doctorate",
  "Other",
];

const STEPS = ["Account", "Role & details", "Review"];

function SignupInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = getSafeRedirect(params, "/");

  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState("");

  // Account step (controlled for validation + OTP widget)
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  // P0 fix: avatar is selected locally and uploaded AFTER register+login.
  // (The old flow POSTed to /api/upload/avatar pre-auth and always got 401.)
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  // Role step
  const [roleCategory, setRoleCategory] = useState("student");
  const [expertRole, setExpertRole] = useState("");
  const [programme, setProgramme] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectDepartment, setSubjectDepartment] = useState("");
  const [highestDegree, setHighestDegree] = useState("");
  const [expertDesignation, setExpertDesignation] = useState("");
  const [college, setCollege] = useState("");
  const [university, setUniversity] = useState("");
  const [address, setAddress] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [expertPhone, setExpertPhone] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const finalRole =
    roleCategory === "expert"
      ? expertRole
      : roleCategory === "animal_owner"
        ? "ANIMAL_OWNER"
        : "STUDENT";

  const isStudent = roleCategory === "student";
  const isAnimalOwner = roleCategory === "animal_owner";
  const isExpert = roleCategory === "expert";
  const isMvscPhd = isStudent && (programme === "MVSC" || programme === "PHD");
  const phone = isExpert ? expertPhone : isAnimalOwner ? ownerPhone : studentPhone;

  useEffect(() => {
    if (!isStudent || (programme !== "MVSC" && programme !== "PHD")) return;
    let cancelled = false;
    fetch(`/api/subjects?programme=${programme}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setSubjects(d.subjects || []);
      })
      .catch(() => {
        if (!cancelled) setSubjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, [roleCategory, programme, isStudent]);

  function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG, PNG, GIF, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image too large (max 5MB).");
      return;
    }
    setError("");
    setAvatarFile(file);
    if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file));
    // Reset input so the same file can be re-picked.
    e.target.value = "";
  }

  function validateStep(s: number): string | null {
    if (s === 0) {
      if (firstName.trim().length < 2) return "First name must be at least 2 characters.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email address.";
      if (password.length < PASSWORD_MIN_LENGTH)
        return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
      if (password !== confirm) return "Passwords do not match.";
      return null;
    }
    if (s === 1) {
      if (isStudent && !programme) return "Programme is required.";
      if (isStudent && isMvscPhd && !subjectDepartment)
        return "Subject / Department is required.";
      if (isAnimalOwner && !address.trim()) return "Address is required.";
      if (isExpert) {
        if (!expertDesignation) return "Role is required.";
        if (!highestDegree) return "Highest Degree is required.";
        if (!specialization.trim()) return "Specialization is required.";
      }
      return null;
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep((s) => Math.min(2, s + 1));
  }

  async function uploadAvatarAfterSignin(): Promise<void> {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("file", avatarFile);
      const res = await csrfFetch("/api/upload/avatar", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) return;
      const csrf = await getCsrfToken();
      await fetch("/api/me/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ url: data.url }),
      }).catch(() => undefined);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const err0 = validateStep(0);
    if (err0) {
      setError(err0);
      setStep(0);
      return;
    }
    const err1 = validateStep(1);
    if (err1) {
      setError(err1);
      setStep(1);
      return;
    }
    if (!acceptedTerms) {
      setError("Please accept the Terms and Privacy Policy to continue.");
      return;
    }
    setIsLoading(true);
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    // P2 honeypot (bots fill it; the API silently accepts-but-ignores).
    const company = (
      new FormData(e.currentTarget).get("company") as string | null
    )?.trim() || undefined;
    const payload: Record<string, unknown> = {
      name: firstName.trim(),
      surname: surname.trim() || undefined,
      email: normalizedEmail,
      password,
      role: finalRole || "STUDENT",
      phone: phone.trim() || undefined,
      emailVerificationToken: verificationToken || undefined,
      company,
    };
    if (isStudent) {
      payload.programme = programme || undefined;
      payload.college = college.trim() || undefined;
      payload.university = university.trim() || undefined;
      if (isMvscPhd) payload.subjectDepartment = subjectDepartment || undefined;
    } else if (isAnimalOwner) {
      payload.address = address.trim() || undefined;
    } else if (isExpert) {
      payload.highestDegree = highestDegree || undefined;
      payload.specialization = specialization.trim() || undefined;
      payload.expertDesignation = expertDesignation || undefined;
    }

    try {
      const csrf = await getCsrfToken();
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // P1: auto sign-in for a seamless onboarding (fallback to login page).
      const login = await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
      });
      if (login?.error) {
        router.push(`/login?registered=true&redirect=${encodeURIComponent(redirect)}`);
        return;
      }
      await uploadAvatarAfterSignin();
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGuest() {
    setGuestLoading(true);
    setError("");
    try {
      const creds = await startGuestSession();
      const res = await signIn("credentials", {
        email: creds.email,
        password: creds.password,
        redirect: false,
      });
      if (res?.error) {
        setError("Guest login is unavailable right now.");
        return;
      }
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setGuestLoading(false);
    }
  }

  return (
    <AuthShell
      wide
      title="Create your account"
      subtitle="Join VetAcademia and start learning"
      hindiSubtitle="वेटएकाडेमिया से जुड़ें और सीखना शुरू करें"
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={`/login?redirect=${encodeURIComponent(redirect)}`}
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <div className="mb-5 text-center lg:text-left">
        <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Join VetAcademia and start learning
        </p>
      </div>

      {/* P1: stepper for the long expert form */}
      <ol className="mb-5 flex items-center gap-1.5" aria-label="Signup progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-1.5 last:flex-none">
            <button
              type="button"
              onClick={() => {
                if (i < step) {
                  setError("");
                  setStep(i);
                }
              }}
              disabled={i > step}
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                i < step
                  ? "bg-emerald-500 text-white"
                  : i === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              )}
              aria-current={i === step ? "step" : undefined}
              aria-label={`Step ${i + 1}: ${label}${i < step ? " (completed, go back)" : ""}`}
            >
              {i < step ? <CircleCheck className="h-4 w-4" aria-hidden="true" /> : i + 1}
            </button>
            <span
              className={cn(
                "hidden text-xs font-medium sm:inline",
                i === step ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 ? <span className="h-px flex-1 bg-border" aria-hidden="true" /> : null}
          </li>
        ))}
      </ol>

      <form onSubmit={onSubmit}>
        {/* P2: honeypot */}
        <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        {error ? (
          <div
            className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {step === 0 ? (
          <div className="space-y-4">
            {/* Profile Photo (local preview; uploaded after login) */}
            <div className="flex items-center gap-4">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="Profile preview"
                  className="h-16 w-16 rounded-full border object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <ImageIcon className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={pickAvatar}
                  aria-label="Choose profile photo"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={isLoading}
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" /> Choose Photo
                </Button>
                {avatarPreview ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAvatarFile(null);
                      if (avatarPreview.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
                      setAvatarPreview(null);
                    }}
                  >
                    <X className="h-4 w-4" aria-hidden="true" /> Remove
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">Optional. JPG/PNG/GIF/WEBP, max 5MB.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="signup-name">First Name *</Label>
                <Input
                  id="signup-name"
                  name="name"
                  placeholder="John"
                  required
                  autoFocus
                  autoComplete="given-name"
                  disabled={isLoading}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  aria-invalid={error ? true : undefined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-surname">Surname</Label>
                <Input
                  id="signup-surname"
                  name="surname"
                  placeholder="Doe"
                  autoComplete="family-name"
                  disabled={isLoading}
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">Email (Username) *</Label>
              <Input
                id="signup-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <EmailOtpWidget email={email} onVerified={setVerificationToken} disabled={isLoading} />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <PasswordField
                id="signup-password"
                name="password"
                label="Password *"
                autoComplete="new-password"
                showStrength
                disabled={isLoading}
                value={password}
                onChange={setPassword}
              />
              <PasswordField
                id="signup-confirm"
                name="confirmPassword"
                label="Confirm Password *"
                autoComplete="new-password"
                disabled={isLoading}
                value={confirm}
                onChange={setConfirm}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Use at least {PASSWORD_MIN_LENGTH} characters.
            </p>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-role">I am a *</Label>
              <Select
                value={roleCategory}
                onValueChange={(v) => {
                  setRoleCategory(v ?? "student");
                  setExpertRole("");
                  setSubjectDepartment("");
                  setSubjects([]);
                  setHighestDegree("");
                  setExpertDesignation("");
                }}
                disabled={isLoading}
              >
                <SelectTrigger id="signup-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="animal_owner">Animal Owner</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isStudent ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="signup-programme">Programme *</Label>
                  <Select
                    value={programme}
                    onValueChange={(v) => {
                      setProgramme(v ?? "");
                      setSubjectDepartment("");
                      setSubjects([]);
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="signup-programme">
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

                {isMvscPhd ? (
                  <div className="space-y-2">
                    <Label htmlFor="signup-subject">Subject / Department *</Label>
                    {subjects.length > 0 ? (
                      <Select
                        value={subjectDepartment}
                        onValueChange={(v) => setSubjectDepartment(v ?? "")}
                        disabled={isLoading}
                      >
                        <SelectTrigger id="signup-subject">
                          <SelectValue placeholder="Select subject / department" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      // Fallback: never block MVSC/PhD signup when the subject
                      // catalogue is empty or fails to load — accept free text.
                      <Input
                        id="signup-subject"
                        name="subjectDepartment"
                        placeholder="Type your subject / department"
                        required
                        disabled={isLoading}
                        value={subjectDepartment}
                        onChange={(e) => setSubjectDepartment(e.target.value)}
                      />
                    )}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="signup-college">College Name</Label>
                    <Input
                      id="signup-college"
                      name="college"
                      placeholder="College name"
                      autoComplete="organization"
                      disabled={isLoading}
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-university">University Name</Label>
                    <Input
                      id="signup-university"
                      name="university"
                      placeholder="University name"
                      autoComplete="organization"
                      disabled={isLoading}
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-student-phone">Phone (optional)</Label>
                  <Input
                    id="signup-student-phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 ..."
                    autoComplete="tel"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </>
            ) : null}

            {isAnimalOwner ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="signup-address">Address *</Label>
                  <textarea
                    id="signup-address"
                    name="address"
                    placeholder="Your full address"
                    required
                    disabled={isLoading}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-owner-phone">Phone (optional)</Label>
                  <Input
                    id="signup-owner-phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 ..."
                    autoComplete="tel"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </>
            ) : null}

            {isExpert ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="signup-degree">Highest Degree *</Label>
                  <Select
                    value={highestDegree}
                    onValueChange={(v) => setHighestDegree(v ?? "")}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="signup-degree">
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
                  <Label htmlFor="signup-specialization">Specialization *</Label>
                  <Input
                    id="signup-specialization"
                    name="specialization"
                    placeholder="e.g. Veterinary Surgery"
                    required
                    disabled={isLoading}
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-designation">Role *</Label>
                  <Select
                    // NOTE: value must be the role KEY (expertRole), not the
                    // display label — items are keyed by role key.
                    value={expertRole}
                    onValueChange={(v) => {
                      setExpertRole(v ?? "");
                      setExpertDesignation(v ? EXPERT_ROLE_LABELS[v] : "");
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="signup-designation">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERT_ROLE_GROUPS.map((group) => (
                        <SelectGroup key={group.label}>
                          <SelectLabel>{group.label}</SelectLabel>
                          {group.roles.map((r) => (
                            <SelectItem key={r} value={r}>
                              {EXPERT_ROLE_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-expert-phone">Phone (optional)</Label>
                  <Input
                    id="signup-expert-phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 ..."
                    autoComplete="tel"
                    value={expertPhone}
                    onChange={(e) => setExpertPhone(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/15 bg-muted/40 p-4 text-sm">
              <p className="font-medium">Review your details</p>
              <dl className="mt-2 space-y-1 text-muted-foreground">
                <div className="flex justify-between gap-4">
                  <dt>Name</dt>
                  <dd className="font-medium text-foreground">
                    {firstName} {surname}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Email</dt>
                  <dd className="font-medium text-foreground">{email.trim().toLowerCase()}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Role</dt>
                  <dd className="font-medium text-foreground">
                    {isExpert
                      ? EXPERT_ROLE_LABELS[expertRole] || expertDesignation || "Expert"
                      : isAnimalOwner
                        ? "Animal Owner"
                        : `Student${programme ? ` (${programme})` : ""}`}
                  </dd>
                </div>
                {verificationToken ? (
                  <div className="flex justify-between gap-4">
                    <dt>Email</dt>
                    <dd className="font-medium text-emerald-600">Verified ✓</dd>
                  </div>
                ) : null}
              </dl>
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
                required
              />
              <span className="text-muted-foreground">
                I agree to the{" "}
                <Link href="/terms" className="font-medium text-primary hover:underline" target="_blank">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-medium text-primary hover:underline" target="_blank">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {uploadingAvatar ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Uploading profile photo...
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3">
          <div className="flex gap-2">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={isLoading || guestLoading}
                onClick={() => {
                  setError("");
                  setStep((s) => s - 1);
                }}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
              </Button>
            ) : null}
            {step < 2 ? (
              <Button
                type="button"
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-[#005f48] shadow-md hover:shadow-lg"
                disabled={isLoading || guestLoading}
                onClick={next}
              >
                Continue <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-[#005f48] shadow-md hover:shadow-lg"
                disabled={isLoading || guestLoading || !acceptedTerms}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            )}
          </div>

          <GoogleButton redirect={redirect} disabled={isLoading || guestLoading} />

          <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-xl text-muted-foreground hover:text-foreground"
            disabled={isLoading || guestLoading}
            onClick={handleGuest}
          >
            {guestLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Entering as Guest...
              </>
            ) : (
              "Continue as Guest"
            )}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupInner />
    </Suspense>
  );
}
