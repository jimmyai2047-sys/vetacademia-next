"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  RefreshCw,
  Crown,
  IndianRupee,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

type Buyer = {
  name: string;
  email: string;
  phone: string;
  address: string;
  college: string;
  programme: string;
  year: string;
};

type PaymentRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  orderId: string;
  paymentId: string;
  product: string;
  expiresAt: string | null;
  expired: boolean;
  createdAt: string;
  buyer: Buyer;
};

type Summary = { collected: number; paid: number; pending: number; failed: number };

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

function csvCell(v: string | number): string {
  const s = String(v ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

export default function AdminPaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [summary, setSummary] = useState<Summary>({ collected: 0, paid: 0, pending: 0, failed: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const q = new URLSearchParams({
          page: String(p),
          pageSize: "20",
          status,
          search,
          from,
          to,
        });
        const res = await fetch(`/api/admin/payments?${q.toString()}`);
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setError((data as { error?: string } | null)?.error || "Failed to load payments");
          return;
        }
        setRows(
          ((data.payments || []) as PaymentRow[]).map((r) => ({
            ...r,
            expired: !!r.expiresAt && new Date(r.expiresAt).getTime() <= Date.now(),
          }))
        );
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
        setSummary(data.summary || { collected: 0, paid: 0, pending: 0, failed: 0 });
      } catch {
        setError("Failed to load payments");
      } finally {
        setLoading(false);
      }
    },
    [status, search, from, to]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilters() {
    load(1);
  }

  function exportCsv() {
    const header = [
      "DateTime",
      "DB_ID",
      "RazorpayPaymentID",
      "OrderID",
      "BuyerName",
      "Email",
      "Phone",
      "Address",
      "College",
      "Product",
      "Amount",
      "ValidityExpiresAt",
      "Currency",
      "Method",
      "Status",
    ];
    const lines = rows.map((r) =>
      [
        fmtDate(r.createdAt),
        r.id,
        r.paymentId,
        r.orderId,
        r.buyer.name,
        r.buyer.email,
        r.buyer.phone,
        r.buyer.address,
        r.buyer.college,
        r.product,
        r.amount,
        r.expiresAt ? fmtDate(r.expiresAt) : "Lifetime",
        r.currency,
        r.method,
        r.status,
      ]
        .map(csvCell)
        .join(",")
    );
    const blob = new Blob([[header.map(csvCell).join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `vetacademia-payments-page${page}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      {/* Royal Header */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c4a6e] via-primary to-[#0284c7]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
        <div className="relative px-6 py-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" aria-label="Back to dashboard" className="rounded-xl bg-white/15 backdrop-blur border border-white/20 text-white hover:bg-white/25 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur border border-white/20 shadow-sm">
              <IndianRupee className="h-5 w-5" />
            </span>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase">
                <Crown className="h-3 w-3 text-[#d4a843]" /> Royal Payments
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Payments Received</h1>
              <p className="text-white/70 text-sm">{total} transactions • Rs.{summary.collected.toLocaleString("en-IN")} collected (PAID)</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => load(page)} disabled={loading} className="rounded-xl bg-white text-primary hover:bg-white/90 border-0 shadow-md gap-2 font-semibold">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0} className="rounded-xl bg-white text-primary hover:bg-white/90 border-0 shadow-md gap-2 font-semibold">
              <Download className="h-4 w-4" /> CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Collected (PAID)", value: `Rs.${summary.collected.toLocaleString("en-IN")}` },
          { label: "Paid", value: String(summary.paid) },
          { label: "Pending", value: String(summary.pending) },
          { label: "Failed", value: String(summary.failed) },
        ].map((c) => (
          <Card key={c.label} className="rounded-[1rem] border border-primary/5 bg-white shadow-sm">
            <CardContent className="p-4">
              <p className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">{c.label}</p>
              <p className="text-xl font-bold mt-1">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-2 md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder="Search name, email, phone, payment / order ID…"
              className="pl-9 rounded-xl"
            />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2 text-sm" aria-label="Status filter">
            <option value="ALL">All status</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl md:w-40" aria-label="From date" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl md:w-40" aria-label="To date" />
          <Button onClick={applyFilters} disabled={loading} className="rounded-xl">Apply</Button>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      <Card className="relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-[#d4a843] to-primary" />
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Loading payments…</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No payments found for these filters.</p>
          ) : (
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground border-b">
                  <th className="px-4 py-3">Date / Time</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Product / Service</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Validity</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Detail</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 align-top hover:bg-muted/30">
                    <td className="px-4 py-3 whitespace-nowrap text-xs">{fmtDate(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{r.buyer.name}</p>
                      <p className="text-xs text-muted-foreground">{r.buyer.email}</p>
                      <p className="text-xs text-muted-foreground">{r.buyer.phone}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 max-w-[220px] truncate" title={`${r.buyer.address} • ${r.buyer.college}`}>
                        {r.buyer.address} • {r.buyer.college}
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground/70 mt-1">pay_id: {r.paymentId} • order: {r.orderId}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">{r.product}</td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap">Rs.{r.amount.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      {!r.expiresAt ? (
                        <span className="font-semibold text-emerald-700">Lifetime</span>
                      ) : !r.expired ? (
                        <span> till {fmtDate(r.expiresAt)}</span>
                      ) : (
                        <span className="font-semibold text-red-600">Expired {fmtDate(r.expiresAt)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.method}</td>
                    <td className="px-4 py-3"><Badge className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase ${statusStyle(r.status)}`}>{r.status}</Badge></td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/payments/${r.id}`}>
                        <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8">
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>Page {page} of {totalPages} • {total} total</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => load(page - 1)} className="rounded-xl gap-1">
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => load(page + 1)} className="rounded-xl gap-1">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Source: <span className="font-mono">Payment</span> table + buyer <span className="font-mono">User</span> profile (name, email, phone, address, college) + <span className="font-mono">Plan / GeneratedReport</span> name. Fine-grained instrument (UPI vs Card) lives in Razorpay Dashboard — click the payment ID there. CSV exports the current page.
      </p>
    </div>
  );
}
