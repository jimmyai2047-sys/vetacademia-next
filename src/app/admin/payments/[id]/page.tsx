"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Printer,
  RefreshCw,
  Crown,
  User,
  IndianRupee,
  Package,
  History,
} from "lucide-react";

type Buyer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  college: string;
  university: string;
  institution: string;
  programme: string;
  year: string;
  role: string;
  memberSince: string;
};

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  orderId: string;
  paymentId: string;
  product: string;
  plan: { slug: string; name: string; type: string; price: number; description: string | null } | null;
  report: { id: string; title: string; animalType: string; amount: number; status: string } | null;
  createdAt: string;
  updatedAt: string;
};

type HistoryRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  orderId: string;
  paymentId: string;
  product: string;
  createdAt: string;
};

function statusStyle(s: string): string {
  if (s === "PAID") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  if (s === "PENDING") return "bg-amber-100 text-amber-800 border border-amber-200";
  if (s === "FAILED") return "bg-red-100 text-red-700 border border-red-200";
  return "bg-gray-100 text-gray-700 border border-gray-200";
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm break-words ${mono ? "font-mono text-xs" : "font-medium"}`}>{value}</p>
    </div>
  );
}

export default function AdminPaymentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [payment, setPayment] = useState<Payment | null>(null);
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [totals, setTotals] = useState({ transactions: 0, paid: 0, lifetimePaid: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/payments/${id}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError((data as { error?: string } | null)?.error || "Failed to load payment");
        return;
      }
      setPayment(data.payment);
      setBuyer(data.buyer);
      setHistory(data.history || []);
      setTotals(data.totals || { transactions: 0, paid: 0, lifetimePaid: 0 });
    } catch {
      setError("Failed to load payment");
    } finally {
      setLoading(false);
    }
  }

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
        <div className="relative px-6 py-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/payments">
              <Button variant="ghost" size="icon" aria-label="Back to payments" className="rounded-xl bg-white/15 backdrop-blur border border-white/20 text-white hover:bg-white/25 hover:text-white print:hidden">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase">
                <Crown className="h-3 w-3 text-[#d4a843]" /> Receipt
              </div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                Payment Detail
                {payment && (
                  <Badge className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase ${statusStyle(payment.status)}`}>
                    {payment.status}
                  </Badge>
                )}
              </h1>
              <p className="text-white/70 text-sm font-mono">{id}</p>
            </div>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={() => load()} disabled={loading} className="rounded-xl bg-white text-primary hover:bg-white/90 border-0 shadow-md gap-2 font-semibold">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-xl bg-white text-primary hover:bg-white/90 border-0 shadow-md gap-2 font-semibold">
              <Printer className="h-4 w-4" /> Print
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
            <p className="text-sm text-muted-foreground flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Loading payment…</p>
          </CardContent>
        </Card>
      ) : !payment ? (
        <Card className="rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Payment not found.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Invoice / receipt */}
          <Card className="relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-[#d4a843] to-primary" />
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100"><IndianRupee className="h-4 w-4 text-emerald-700" /></span>
                Receipt
              </CardTitle>
              <p className="text-2xl font-bold">Rs.{payment.amount.toLocaleString("en-IN")}</p>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Product / Service" value={payment.product} />
              <Field label="Date / Time" value={fmtDate(payment.createdAt)} />
              <Field label="Payment Method" value={payment.method} />
              <Field label="Currency" value={payment.currency} />
              <Field label="Razorpay Payment ID" value={payment.paymentId} mono />
              <Field label="Razorpay Order ID" value={payment.orderId} mono />
              <Field label="Database ID" value={payment.id} mono />
              <Field label="Last Updated" value={fmtDate(payment.updatedAt)} />
            </CardContent>
          </Card>

          {/* Buyer */}
          <Card className="relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/5 border border-primary/10"><User className="h-4 w-4 text-primary" /></span>
                Billed To — Buyer Detail
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Name" value={buyer?.name || "—"} />
              <Field label="Email" value={buyer?.email || "—"} />
              <Field label="Mobile" value={buyer?.phone || "—"} />
              <Field label="Address" value={buyer?.address || "—"} />
              <Field label="College" value={buyer?.college || "—"} />
              <Field label="University / Institution" value={[buyer?.university, buyer?.institution].filter((v) => v && v !== "—").join(" • ") || "—"} />
              <Field label="Programme" value={buyer?.programme || "—"} />
              <Field label="Year" value={buyer?.year || "—"} />
              <Field label="Role" value={buyer?.role || "—"} />
            </CardContent>
          </Card>

          {/* Product detail */}
          {(payment.plan || payment.report) && (
            <Card className="relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-primary to-purple-600" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 border border-blue-100"><Package className="h-4 w-4 text-blue-700" /></span>
                  Item Detail
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {payment.plan ? (
                  <>
                    <Field label="Plan Name" value={payment.plan.name} />
                    <Field label="Type" value={payment.plan.type} />
                    <Field label="Price" value={`Rs.${payment.plan.price.toLocaleString("en-IN")}`} />
                    <Field label="Slug" value={payment.plan.slug} mono />
                  </>
                ) : (
                  payment.report && (
                    <>
                      <Field label="Report Title" value={payment.report.title} />
                      <Field label="Animal" value={payment.report.animalType} />
                      <Field label="Price" value={`Rs.${payment.report.amount.toLocaleString("en-IN")}`} />
                      <Field label="Report Status" value={payment.report.status} />
                    </>
                  )
                )}
              </CardContent>
            </Card>
          )}

          {/* Buyer history */}
          <Card className="relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#d4a843] to-primary" />
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 border border-amber-100"><History className="h-4 w-4 text-amber-700" /></span>
                All Purchases by this Buyer
              </CardTitle>
              <p className="text-xs text-muted-foreground">{totals.transactions} transactions • {totals.paid} paid • Rs.{totals.lifetimePaid.toLocaleString("en-IN")} lifetime</p>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground border-b">
                    <th className="px-4 py-3">Date / Time</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className={`border-b last:border-0 hover:bg-muted/30 ${h.id === payment.id ? "bg-primary/[0.04]" : ""}`}>
                      <td className="px-4 py-2.5 whitespace-nowrap text-xs">
                        <Link href={`/admin/payments/${h.id}`} className="underline decoration-primary/30 underline-offset-2 hover:text-primary">
                          {fmtDate(h.createdAt)}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 max-w-[240px]">{h.product}</td>
                      <td className="px-4 py-2.5 font-semibold whitespace-nowrap">Rs.{h.amount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{h.method}</td>
                      <td className="px-4 py-2.5"><Badge className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase ${statusStyle(h.status)}`}>{h.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
