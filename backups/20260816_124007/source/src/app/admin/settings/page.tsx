"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Platform configuration</p>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/50 text-sm">
        <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-muted-foreground">
          Site settings (including Razorpay keys) are configured via environment
          variables on the server (<code className="font-mono">RAZORPAY_KEY_ID</code>{" "}
          and <code className="font-mono">RAZORPAY_KEY_SECRET</code>). They cannot
          be changed from this screen, so the fields below are read-only.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic platform configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input id="siteName" defaultValue="VetAcademia" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input id="siteUrl" defaultValue="https://vetacademia.com" disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Site Description</Label>
                <Input id="description" defaultValue="India's comprehensive veterinary education platform" disabled />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input id="contactEmail" defaultValue="contact@vetacademia.com" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input id="contactPhone" defaultValue="+91 98765 43210" disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Configure payment gateway</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Razorpay Integration</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Razorpay credentials are read from server environment variables
                  and are not editable here.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="razorpayKey">Razorpay Key ID</Label>
                    <Input id="razorpayKey" placeholder="rzp_test_XXXXXXXXXXXXXXX" type="password" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="razorpaySecret">Razorpay Key Secret</Label>
                    <Input id="razorpaySecret" placeholder="XXXXXXXXXXXXXXXXXXXXXXXX" type="password" disabled />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" defaultValue="INR" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input id="taxRate" defaultValue="18" type="number" disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure email and push notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">New User Registration</p>
                  <p className="text-xs text-muted-foreground">Get notified when a new user registers</p>
                </div>
                <Input type="checkbox" className="w-4 h-4" defaultChecked disabled />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Payment Received</p>
                  <p className="text-xs text-muted-foreground">Get notified for each payment</p>
                </div>
                <Input type="checkbox" className="w-4 h-4" defaultChecked disabled />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Consultation Booking</p>
                  <p className="text-xs text-muted-foreground">Get notified for new bookings</p>
                </div>
                <Input type="checkbox" className="w-4 h-4" defaultChecked disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
