"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  FileText,
  TrendingUp,
  DollarSign,
  Activity,
} from "lucide-react";

const stats = [
  { title: "Total Users", value: "12,345", change: "+12%", icon: Users, color: "text-blue-600" },
  { title: "Programmes", value: "4", change: "+0", icon: BookOpen, color: "text-green-600" },
  { title: "Subjects", value: "100+", change: "+5", icon: FileText, color: "text-purple-600" },
  { title: "Revenue", value: "₹2,45,000", change: "+18%", icon: DollarSign, color: "text-orange-600" },
];

const recentUsers = [
  { name: "Rahul Kumar", email: "rahul@example.com", role: "STUDENT", date: "2 hours ago" },
  { name: "Priya Singh", email: "priya@example.com", role: "STUDENT", date: "5 hours ago" },
  { name: "Dr. Amit Verma", email: "amit@example.com", role: "EXPERT", date: "1 day ago" },
  { name: "Sneha Patel", email: "sneha@example.com", role: "STUDENT", date: "1 day ago" },
  { name: "Dr. Rajesh Gupta", email: "rajesh@example.com", role: "FACULTY", date: "2 days ago" },
];

const recentActivity = [
  { action: "New user registered", user: "Rahul Kumar", time: "2 hours ago" },
  { action: "Mock test completed", user: "Priya Singh", time: "5 hours ago" },
  { action: "Content uploaded", user: "Dr. Amit Verma", time: "1 day ago" },
  { action: "Payment received", user: "Sneha Patel", time: "1 day ago" },
  { action: "Consultation booked", user: "Dr. Rajesh Gupta", time: "2 days ago" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-green-600">{stat.change}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={user.role === "EXPERT" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{user.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Platform activity log</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.user}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <a href="/admin/users" className="p-4 border rounded-lg hover:bg-muted/50 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Manage Users</p>
            </a>
            <a href="/admin/content" className="p-4 border rounded-lg hover:bg-muted/50 text-center">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Manage Content</p>
            </a>
            <a href="/admin/analytics" className="p-4 border rounded-lg hover:bg-muted/50 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">View Analytics</p>
            </a>
            <a href="/admin/settings" className="p-4 border rounded-lg hover:bg-muted/50 text-center">
              <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Settings</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
