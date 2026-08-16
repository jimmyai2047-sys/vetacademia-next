"use client";

import { useState, useMemo } from "react";
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
import { Search, Download, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  programme: string | null;
  year: string | null;
  createdAt: Date;
};

import {
  EXPERT_ROLES,
  ANIMAL_OWNER,
  GUEST,
  ADMIN,
  STUDENT,
  isExpertRole,
} from "@/lib/roles";

function roleColor(role: string): string {
  if (isExpertRole(role))
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  switch (role) {
    case ADMIN:
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case STUDENT:
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case ANIMAL_OWNER:
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case GUEST:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}

export default function UsersClient({ users }: { users: User[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

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

  function handleExport() {
    const headers = ["Name", "Email", "Role", "Programme", "Year", "Joined"];
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = users.map((u) => [
      u.name,
      u.email,
      u.role,
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
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="text-muted-foreground">Manage platform users</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
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
          <Card key={item.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-bold">{item.count}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? "ALL")}>
              <SelectTrigger className="w-[180px]">
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
            <Badge variant="secondary">{filteredUsers.length} users</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Programme</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        {user.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={roleColor(user.role)}>
                        {user.role}
                      </Badge>
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
