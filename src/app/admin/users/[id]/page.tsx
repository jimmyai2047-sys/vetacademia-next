"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  RefreshCw,
  Crown,
  User,
  KeyRound,
  BarChart3,
  FileText,
  History,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

type Overview = {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    banned: boolean;
    programme: string | null;
    year: string | null;
    college: string | null;
    university: string | null;
    institution: string | null;
    address: string | null;
    createdAt: string;
  };
  access: {
    isAdmin: boolean;
    planSlugs: string[];
    programmeSlugs: string[];
    examKeys: string[];
    yearScopes: string[];
    subjectIds: string[];
    chips: string[];
  };
  entitlements: {
    id: string;
    planName: string;
    type: string;
    amount: number;
    method: string;
    test: boolean;
    active: boolean;
    expiresAt: string | null;
    createdAt: string;
  }[];
  payments: {
    id: string;
    amount: number;
    status: string;
    method: string;
    planName: string;
    expiresAt: string | null;
    active: boolean;
    createdAt: string;
  }[];
  progress: {
    subjects: number;
    average: number;
    lastAccessed: string | null;
    top: {
      subjectId: string;
      name: string;
      year: string | null;
      programme: string;
      progress: number;
      lastAccessed: string;
    }[];
  };
  reports: {
    id: string;
    title: string;
    animalType: string;
    status: string;
    amount: number;
    paymentId: string | null;
    hasFile: boolean;
    createdAt: string;
  }[];
  summary: {
    transactions: number;
    paid: number;
    paidLive: number;
    paidTest: number;
    liveTotal: number;
    testTotal: number;
    reports: number;
    reportsPaid: number;
  };
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function statusStyle(s: string): string {
  if (s === "PAID") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  if (s === "PENDING") return "bg-amber-100 text-amber-800 border border-amber-200";
  if (s === "FAILED") return "bg-red-100 text-red-700 border border-red-200";
  return "bg-gray-100 text-gray-700 border border-gray-200";
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm break-words font-medium">{value}</p>
    </div>
  );
}

export default function AdminUserSupportPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}/overview`);
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError((body as { error?: string } | null)?.error || "Failed to load user");
        return;
      }
      setData(body as Overview);
    } catch {
      setError("Failed to load user");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c4a6e] via-primary to-[#0284c7]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#d4a843]/15 blur-3xl" />
        <div className="relative px-6 py-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/users">
              <Button variant="ghost" size="icon" aria-label="Back to users" className="rounded-xl bg-white/15 backdrop-blur border border-white/20 text-white hover:bg-white/25 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur border border-white/20 shadow-sm">
              <User className="h-5 w-5" />
            </span>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase">
                <Crown className="h-3 w-3 text-[#d4a843]" /> Support View
              </div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                {data?.user.name || "Learner"}
                {data?.user.banned && (
                  <Badge className="rounded-full bg-red-500/20 border border-red-300/40 px-2.5 py-1 text-[10px] font-bold uppercase text-white">
                    Banned
                  </Badge>
                )}
              </h1>
              <p className="text-white/70 text-sm font-mono">{data?.user.email || id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => load()} disabled={loading} className="rounded-xl bg-white text-primary hover:bg-white/90 border-0 shadow-md gap-2 font-semibold">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <Card className="rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Loading learner…</p>
          </CardContent>
        </Card>
      ) : !data ? (
        <Card className="rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">User not found.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Profile */}
          <Card className="relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/5 border border-primary/10"><User className="h-4 w-4 text-primary" /></span>
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Name" value={data.user.name} />
              <Field label="Email" value={data.user.email} />
              <Field label="Mobile" value={data.user.phone || "—"} />
              <Field label="Role" value={data.user.role} />
              <Field label="Programme" value={data.user.programme || "—"} />
              <Field label="Year" value={data.user.year || "—"} />
              <Field label="College" value={data.user.college || "—"} />
              <Field label="Institution" value={data.user.institution || data.user.university || "—"} />
              <Field label="Member since" value={fmtDate(data.user.createdAt)} />
              <Field
                label="Account"
                value={data.user.banned ? "Banned — no access" : "Active"}
              />
            </CardContent>
          </Card>

          {/* Entitlements (what access is actually derived from payments) */}
          <Card className="relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-primary to-emerald-500" />
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 border border-violet-100"><KeyRound className="h-4 w-4 text-violet-700" /></span>
                Entitlement &amp; Access
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {data.summary.paid} paid • Rs.{data.summary.liveTotal.toLocaleString("en-IN")} live
                {data.summary.paidTest > 0 && <> • Rs.{data.summary.testTotal.toLocaleString("en-IN")} test</>}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {data.access.chips.length > 0 ? (
                  data.access.chips.map((c) => (
                    <span key={c} className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800">
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-dashed border-muted-foreground/30 px-3 py-1 text-xs font-medium text-muted-foreground">
                    No content scope — only free material is available
                  </span>
                )}
              </div>
              {data.access.isAdmin && (
                <p className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-medium text-amber-800">
                  <ShieldAlert className="h-4 w-4" /> ADMIN — full platform access regardless of payment state.
                </p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground border-b">
                      <th className="px-3 py-3">Purchased</th>
                      <th className="px-3 py-3">Amount</th>
                      <th className="px-3 py-3">Method</th>
                      <th className="px-3 py-3">Validity</th>
                      <th className="px-3 py-3">Grants access</th>
                      <th className="px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.entitlements.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground text-sm">
                          No paid entitlements — this account has never purchased.
                        </td>
                      </tr>
                    ) : (
                      data.entitlements.map((e) => (
                        <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-3 py-2.5">
                            <div className="font-medium">{e.planName}</div>
                            <div className="text-xs text-muted-foreground">{fmtDate(e.createdAt)}</div>
                          </td>
                          <td className="px-3 py-2.5 font-semibold whitespace-nowrap">Rs.{e.amount.toLocaleString("en-IN")}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <Badge className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${e.test ? "bg-orange-100 text-orange-700 border border-orange-200" : "bg-gray-100 text-gray-700 border border-gray-200"}`}>
                              {e.method}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-xs">
                            {e.expiresAt ? fmtDate(e.expiresAt) : "Lifetime"}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${e.active ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                              {e.active ? "Active" : "Expired"}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <Link href={`/admin/payments/${e.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                              Payment <ExternalLink className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card className="relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-[#d4a843] to-primary" />
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100"><BarChart3 className="h-4 w-4 text-emerald-700" /></span>
                Learning Progress
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {data.progress.subjects} subjects • {data.progress.average}% average • last seen {fmtDate(data.progress.lastAccessed)}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.progress.top.length === 0 ? (
                <p className="text-sm text-muted-foreground">No progress recorded yet.</p>
              ) : (
                data.progress.top.map((p) => (
                  <div key={p.subjectId} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium">{p.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{p.programme} • {p.progress}%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, p.progress)}%` }} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Reports */}
          <Card className="relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-primary to-purple-600" />
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 border border-blue-100"><FileText className="h-4 w-4 text-blue-700" /></span>
                Project Reports
              </CardTitle>
              <p className="text-xs text-muted-foreground">{data.summary.reports} orders • {data.summary.reportsPaid} paid</p>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {data.reports.length === 0 ? (
                <p className="px-4 pb-4 text-sm text-muted-foreground">No project report orders.</p>
              ) : (
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground border-b">
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Animal</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">File</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.reports.map((r) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2.5">{r.title}</td>
                        <td className="px-4 py-2.5">{r.animalType}</td>
                        <td className="px-4 py-2.5 font-semibold">Rs.{r.amount.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-2.5"><Badge className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusStyle(r.status)}`}>{r.status}</Badge></td>
                        <td className="px-4 py-2.5 text-xs">{r.hasFile ? "PDF ready" : "—"}</td>
                        <td className="px-4 py-2.5 text-right">
                          {r.paymentId && (
                            <Link href={`/admin/payments/${r.paymentId}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                              Payment <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* All transactions */}
          <Card className="relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#d4a843] to-primary" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 border border-amber-100"><History className="h-4 w-4 text-amber-700" /></span>
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground border-b">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Access</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">No transactions.</td>
                    </tr>
                  ) : (
                    data.payments.map((p) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <Link href={`/admin/payments/${p.id}`} className="underline decoration-primary/30 underline-offset-2 hover:text-primary">
                            {fmtDate(p.createdAt)}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 max-w-[220px] truncate">{p.planName}</td>
                        <td className="px-4 py-2.5 font-semibold whitespace-nowrap">Rs.{p.amount.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <Badge className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${p.method === "TEST" ? "bg-orange-100 text-orange-700 border border-orange-200" : "bg-gray-100 text-gray-700 border border-gray-200"}`}>
                            {p.method}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5"><Badge className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusStyle(p.status)}`}>{p.status}</Badge></td>
                        <td className="px-4 py-2.5">
                          <Badge className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${p.active ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                            {p.active ? "Active" : "None"}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
