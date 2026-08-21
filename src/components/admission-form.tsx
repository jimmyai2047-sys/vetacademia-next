"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { CheckCircle2, Loader2, Send } from "lucide-react";

const fieldBase =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30";

type FormState = {
  fullName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  email: string;
  studentMobile: string;
  parentMobile: string;
  address: string;
  programme: string;
  yearOrSemester: string;
  qualification: string;
  percentage: string;
  passingYear: string;
  category: string;
  tsp: string;
  message: string;
};

const initial: FormState = {
  fullName: "",
  fatherName: "",
  motherName: "",
  dob: "",
  gender: "",
  email: "",
  studentMobile: "",
  parentMobile: "",
  address: "",
  programme: "",
  yearOrSemester: "",
  qualification: "",
  percentage: "",
  passingYear: "",
  category: "",
  tsp: "",
  message: "",
};

export default function AdmissionForm() {
  const [form, setForm] = useState<FormState>(initial);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  function update(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Submission failed.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:bg-emerald-950/30">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h3 className="mt-4 text-xl font-bold">Enquiry Submitted!</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you, {form.fullName.split(" ")[0] || "student"}. Our admissions team
          will contact you on <span className="font-medium">{form.studentMobile || form.email}</span> within 24–48 hours with the next steps.
        </p>
        <button
          type="button"
          onClick={() => {
            setForm(initial);
            setStatus("idle");
          }}
          className={`mt-6 ${buttonVariants({ variant: "outline" })}`}
        >
          Submit another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {status === "error" && error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
          Personal Details
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              required
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="As per academic records"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fatherName">Father&apos;s Name</Label>
            <Input
              id="fatherName"
              value={form.fatherName}
              onChange={(e) => update("fatherName", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="motherName">Mother&apos;s Name</Label>
            <Input
              id="motherName"
              value={form.motherName}
              onChange={(e) => update("motherName", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={form.dob}
              onChange={(e) => update("dob", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              className={fieldBase}
              value={form.gender}
              onChange={(e) => update("gender", e.target.value)}
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
          Contact Details
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="studentMobile">Student Mobile *</Label>
            <Input
              id="studentMobile"
              type="tel"
              required
              value={form.studentMobile}
              onChange={(e) => update("studentMobile", e.target.value)}
              placeholder="+91 9XXXXXXXXX"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="parentMobile">Parent&apos;s Mobile</Label>
            <Input
              id="parentMobile"
              type="tel"
              value={form.parentMobile}
              onChange={(e) => update("parentMobile", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">Permanent Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="House / Street, City, State, PIN"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
          Academic Details
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="programme">Programme of Interest</Label>
            <select
              id="programme"
              className={fieldBase}
              value={form.programme}
              onChange={(e) => update("programme", e.target.value)}
            >
              <option value="">Select</option>
              <option value="AHDP">A.H.D.P.</option>
              <option value="B.V.Sc & A.H.">B.V.Sc &amp; A.H.</option>
              <option value="M.V.Sc">M.V.Sc</option>
              <option value="Ph.D">Ph.D</option>
              <option value="Other">Other / Not sure</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="yearOrSemester">Year / Semester</Label>
            <Input
              id="yearOrSemester"
              value={form.yearOrSemester}
              onChange={(e) => update("yearOrSemester", e.target.value)}
              placeholder="e.g. 1st Year / Sem 3"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qualification">Current Qualification</Label>
            <Input
              id="qualification"
              value={form.qualification}
              onChange={(e) => update("qualification", e.target.value)}
              placeholder="10th / 12th (Science) / Diploma / Graduate"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="percentage">Percentage / Result</Label>
            <Input
              id="percentage"
              value={form.percentage}
              onChange={(e) => update("percentage", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="passingYear">Passing Year</Label>
            <Input
              id="passingYear"
              value={form.passingYear}
              onChange={(e) => update("passingYear", e.target.value)}
              placeholder="e.g. 2025"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
          Category Details
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className={fieldBase}
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="">Select</option>
              <option value="GEN">GEN</option>
              <option value="EWS">EWS</option>
              <option value="OBC">OBC</option>
              <option value="MBC">MBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tsp">TSP / Non-TSP</Label>
            <select
              id="tsp"
              className={fieldBase}
              value={form.tsp}
              onChange={(e) => update("tsp", e.target.value)}
            >
              <option value="">Select</option>
              <option value="TSP">TSP</option>
              <option value="Non-TSP">Non-TSP</option>
            </select>
          </div>
        </div>
      </section>

      <div className="space-y-1.5">
        <Label htmlFor="message">Message / Remarks</Label>
        <Textarea
          id="message"
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="Any questions about the course, fees or admission process?"
          className="min-h-[100px]"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className={`${buttonVariants()} w-full sm:w-auto`}
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Submit Admission Enquiry
          </>
        )}
      </button>
    </form>
  );
}
