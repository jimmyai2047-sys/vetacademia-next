"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Save, CheckCircle, Crown, Sparkles, Shield, Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function update(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function toggleBool(key: string) {
    update(key, settings[key] === "true" ? "false" : "true");
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Royal Gradient Header */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#003d2e] via-primary to-[#005f48]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-[#d4a843]/15 blur-3xl" />
        <div className="relative px-6 py-7 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-bold tracking-widest uppercase">
              <Crown className="h-3.5 w-3.5 text-[#d4a843]" /> Royal Control
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Settings</h1>
            <p className="mt-1 text-white/70 flex items-center gap-2 text-sm">
              <Shield className="h-3.5 w-3.5 text-[#d4a843]" /> Platform configuration • Secure &amp; live
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="rounded-full bg-white text-primary hover:bg-white/90 shadow-lg border border-white/20 font-semibold">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : saved ? (
              <CheckCircle className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="rounded-full bg-muted p-1">
          <TabsTrigger value="general" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">General</TabsTrigger>
          <TabsTrigger value="payment" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">Payment</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">Notifications</TabsTrigger>
          <TabsTrigger value="advanced" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#d4a843] to-primary opacity-60" />
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#005f48] text-white shadow-md">
                  <SettingsIcon className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Basic platform configuration</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName || ""}
                    onChange={(e) => update("siteName", e.target.value)}
                    className="rounded-xl border-primary/10 focus-visible:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input
                    id="siteUrl"
                    value={settings.siteUrl || ""}
                    onChange={(e) => update("siteUrl", e.target.value)}
                    className="rounded-xl border-primary/10 focus-visible:ring-primary/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription || ""}
                  onChange={(e) => update("siteDescription", e.target.value)}
                  rows={2}
                  className="rounded-xl border-primary/10 focus-visible:ring-primary/20"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    value={settings.contactEmail || ""}
                    onChange={(e) => update("contactEmail", e.target.value)}
                    className="rounded-xl border-primary/10 focus-visible:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={settings.contactPhone || ""}
                    onChange={(e) => update("contactPhone", e.target.value)}
                    className="rounded-xl border-primary/10 focus-visible:ring-primary/20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4 mt-4">
          <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-primary to-blue-600" />
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md">
                  <Crown className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle>Payment Settings</CardTitle>
                  <CardDescription>Configure payment gateway</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-[1rem] border border-primary/5">
                <p className="text-sm font-medium mb-2">Razorpay Integration</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Razorpay credentials are configured via environment variables
                  (<code className="font-mono">RAZORPAY_KEY_ID</code> and{" "}
                  <code className="font-mono">RAZORPAY_KEY_SECRET</code>).
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Razorpay Key ID</Label>
                    <Input
                      placeholder="Configured via env"
                      type="password"
                      disabled
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Razorpay Key Secret</Label>
                    <Input
                      placeholder="Configured via env"
                      type="password"
                      disabled
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={settings.currency || "INR"}
                    onChange={(e) => update("currency", e.target.value)}
                    className="rounded-xl border-primary/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    value={settings.taxRate || "18"}
                    type="number"
                    min="0"
                    max="100"
                    onChange={(e) => update("taxRate", e.target.value)}
                    className="rounded-xl border-primary/10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-primary to-purple-600" />
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Configure admin notifications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-primary/5 rounded-xl hover:border-primary/15 hover:bg-primary/[0.02] transition-colors">
                <div>
                  <p className="font-medium text-sm">New User Registration</p>
                  <p className="text-xs text-muted-foreground">
                    Get notified when a new user registers
                  </p>
                </div>
                <Switch
                  checked={settings.notifyNewUser === "true"}
                  onCheckedChange={() => toggleBool("notifyNewUser")}
                />
              </div>
              <div className="flex items-center justify-between p-3 border border-primary/5 rounded-xl hover:border-primary/15 hover:bg-primary/[0.02] transition-colors">
                <div>
                  <p className="font-medium text-sm">Payment Received</p>
                  <p className="text-xs text-muted-foreground">
                    Get notified for each payment
                  </p>
                </div>
                <Switch
                  checked={settings.notifyPayment === "true"}
                  onCheckedChange={() => toggleBool("notifyPayment")}
                />
              </div>
              <div className="flex items-center justify-between p-3 border border-primary/5 rounded-xl hover:border-primary/15 hover:bg-primary/[0.02] transition-colors">
                <div>
                  <p className="font-medium text-sm">Consultation Booking</p>
                  <p className="text-xs text-muted-foreground">
                    Get notified for new bookings
                  </p>
                </div>
                <Switch
                  checked={settings.notifyBooking === "true"}
                  onCheckedChange={() => toggleBool("notifyBooking")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 mt-4">
          <Card className="va-card-hover relative overflow-hidden rounded-[1.25rem] border border-primary/5 bg-white shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#d4a843] to-primary" />
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
                  <Shield className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle>Advanced Settings</CardTitle>
                  <CardDescription>Platform maintenance and advanced options</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-primary/5 rounded-xl hover:border-primary/15 hover:bg-primary/[0.02] transition-colors">
                <div>
                  <p className="font-medium text-sm">Maintenance Mode</p>
                  <p className="text-xs text-muted-foreground">
                    Temporarily disable the site for non-admin users
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceMode === "true"}
                  onCheckedChange={() => toggleBool("maintenanceMode")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
