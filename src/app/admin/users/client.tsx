"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Download, Users, ArrowLeft, Ban, Trash2, ChevronLeft, ChevronRight, Crown, Sparkles } from "lucide-react";
import Link from "next/link";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import { useToast } from "@/components/admin/toast-provider";
import { adminFetch } from "@/lib/admin-fetch";
import { roleColor } from "@/lib/role-color";

import {
  EXPERT_ROLES,
  ANIMAL_OWNER,
  GUEST,
  ADMIN,
  STUDENT,
} from "@/lib/roles";

const ALL_ROLES = [
  STUDENT,
  ANIMAL_OWNER,
  GUEST,
  ADMIN,
  ...EXPERT_ROLES,
];

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  programme: string | null;
  year: string | null;
  banned?: boolean;
  createdAt: Date;
};

export default function UsersClient({
  users,
  currentUserId,
  page,
  totalPages,
  totalCount,
}: {
  users: User[];
  currentUserId: string;
  page: number;
  totalPages: number;
  totalCount: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDesc, setConfirmDesc] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);

  function showConfirm(title: string, desc: string, action: () => void) {
    setConfirmTitle(title);
    setConfirmDesc(desc);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  }

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: users.length };
    users.forEach((u) => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    return counts;
  }, [users]);

  const expertCount = EXPERT_ROLES.reduce(
    (sum, r) => sum + (roleCounts[r] || 0),
    0
  );
  const animalOwnerCount = roleCounts[ANIMAL_OWNER] || 0;
  const guestCount = roleCounts[GUEST] || 0;

  async function changeRole(id: string, role: string, userName: string) {
    showConfirm(
      "Change User Role?",
      `Are you sure you want to change ${userName}'s role to ${role}?`,
      async () => {
        setConfirmLoading(true);
        try {
          const res = await adminFetch(`/api/admin/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role }),
          });
          if (res.ok) {
            toast("Role updated successfully", "success");
            router.refresh();
          } else {
            const d = await res.json().catch(() => ({}));
            toast(d.error || "Failed to update role", "error");
          }
        } catch {
          toast("Network error", "error");
        } finally {
          setConfirmLoading(false);
          setConfirmOpen(false);
        }
      }
    );
  }

  async function toggleBan(id: string, userName: string, isBanned: boolean) {
    showConfirm(
      isBanned ? "Unban User?" : "Ban User?",
      `Are you sure you want to ${isBanned ? "unban" : "ban"} ${userName}?`,
      async () => {
        setConfirmLoading(true);
        try {
          const res = await adminFetch(`/api/admin/users/${id}/ban`, {
            method: "POST",
          });
          if (res.ok) {
            toast(isBanned ? "User unbanned" : "User banned", "success");
            router.refresh();
          } else {
            const d = await res.json().catch(() => ({}));
            toast(d.error || "Failed to update ban status", "error");
          }
        } catch {
          toast("Network error", "error");
        } finally {
          setConfirmLoading(false);
          setConfirmOpen(false);
        }
      }
    );
  }

  async function removeUser(id: string, userName: string) {
    showConfirm(
      "Delete User?",
      `Are you sure you want to delete ${userName}? This cannot be undone.`,
      async () => {
        setConfirmLoading(true);
        try {
          const res = await adminFetch(`/api/admin/users/${id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            toast("User deleted", "success");
            router.refresh();
          } else {
            const d = await res.json().catch(() => ({}));
            toast(d.error || "Failed to delete user", "error");
          }
        } catch {
          toast("Network error", "error");
        } finally {
          setConfirmLoading(false);
          setConfirmOpen(false);
        }
      }
    );
  }

  function handleExport() {
    const headers = ["Name", "Email", "Role", "Banned", "Programme", "Year", "Joined"];
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = users.map((u) => [
      u.name,
      u.email,
      u.role,
      u.banned ? "YES" : "no",
      u.programme ?? "",
      u.year ?? "",
      new Date(u.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => escape(String(cell))).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast("Users exported successfully", "success");
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmTitle}
        description={confirmDesc}
        onConfirm={confirmAction}
        loading={confirmLoading}
      />

      {/* Royal Header */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#003d2e] via-primary to-[#005f48]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#d4a843]/15 blur-3xl" />
        <div className="relative px-6 py-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" aria-label="Back to dashboard" className="rounded-xl bg-white/15 backdrop-blur border border-white/20 text-white hover:bg-white/25 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur border border-white/20 shadow-sm">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase">
                <Crown className="h-3 w-3 text-[#d4a843]" /> Royal Control
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Users</h1>
              <p className="text-white/70 text-sm flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#d4a843]" /> Manage platform users • {totalCount} total
              </p>
            </div>
          </div>
          <Button onClick={handleExport} size="sm" className="rounded-xl bg-white text-primary hover:bg-white/90 shadow-md gap-2 font-semibold">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", count: roleCounts.ALL, icon: Users, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
          { label: "Students", count: roleCounts.STUDENT || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
          { label: "Animal Owners", count: animalOwnerCount, icon: Users, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
          { label: "Experts", count: expertCount, icon: Users, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
          { label: "Guests", count: guestCount, icon: Users, color: "text-gray-600", bg: "bg-gray-100 dark:bg-gray-800" },
          { label: "Admins", count: roleCounts.ADMIN || 0, icon: Users, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" },
        ].map((item) => (
          <Card key={item.label} className="va-card-hover group relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white p-0 shadow-sm hover:shadow-md">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground/70">{item.label}</p>
                  <p className="text-2xl font-extrabold tracking-tight mt-1">{item.count}</p>
                  <div className="mt-2 h-1 w-6 rounded-full bg-primary/20 group-hover:w-10 group-hover:bg-primary transition-all" />
                </div>
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center border shadow-sm group-hover:scale-105 transition-transform`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 shadow-sm bg-white">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary" />
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl"
                aria-label="Search users by name or email"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? "ALL")}>
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles ({roleCounts.ALL})</SelectItem>
                <SelectItem value="ADMIN">Admin ({roleCounts.ADMIN || 0})</SelectItem>
                <SelectItem value="STUDENT">Student ({roleCounts.STUDENT || 0})</SelectItem>
                <SelectItem value="ANIMAL_OWNER">Animal Owner ({animalOwnerCount})</SelectItem>
                <SelectItem value="GUEST">Guest ({guestCount})</SelectItem>
                {EXPERT_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="rounded-full px-3">{filteredUsers.length} users</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-primary/5 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Programme</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-primary/[0.04]">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-[#005f48] flex items-center justify-center text-xs font-bold text-white shadow-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          {user.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(v) => {
                            if (v) changeRole(user.id, v, user.name);
                          }}
                        >
                          <SelectTrigger className="w-[160px] h-8 rounded-xl">
                            <SelectValue>
                              <Badge className={roleColor(user.role)}>{user.role}</Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{user.programme || "-"}</TableCell>
                      <TableCell>{user.year || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        {user.banned ? (
                          <Badge variant="destructive" className="rounded-full">Banned</Badge>
                        ) : (
                          <Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-xl"
                            aria-label={user.banned ? "Unban user" : "Ban user"}
                            disabled={user.id === currentUserId}
                            onClick={() => toggleBan(user.id, user.name, !!user.banned)}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                            aria-label="Delete user"
                            disabled={user.id === currentUserId}
                            onClick={() => removeUser(user.id, user.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({totalCount} users total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={page <= 1}
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set("page", String(page - 1));
                    window.location.href = url.toString();
                  }}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={page >= totalPages}
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set("page", String(page + 1));
                    window.location.href = url.toString();
                  }}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
