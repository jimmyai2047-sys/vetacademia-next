"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Building2 } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Get started with basic features",
    icon: Zap,
    features: [
      "Access to all syllabus",
      "Limited mock tests (5/month)",
      "Basic study materials",
      "Community support",
    ],
    cta: "Get Started",
    href: "/signup",
    popular: false,
  },
  {
    name: "Premium",
    price: "₹999",
    period: "/year",
    description: "Everything you need to excel",
    icon: Crown,
    features: [
      "Unlimited mock tests",
      "Detailed analytics",
      "All study materials",
      "Expert consultations (2/month)",
      "Priority support",
      "Download resources",
    ],
    cta: "Upgrade to Premium",
    href: "/checkout?plan=premium",
    popular: true,
    amount: 999,
  },
  {
    name: "Institution",
    price: "₹4,999",
    period: "/year",
    description: "For colleges and universities",
    icon: Building2,
    features: [
      "Everything in Premium",
      "Unlimited expert consultations",
      "Custom branding",
      "Bulk user management",
      "API access",
      "Dedicated support",
      "Analytics dashboard",
    ],
    cta: "Contact Sales",
    href: "/contact",
    popular: false,
    amount: 4999,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePayment = async (plan: typeof plans[0]) => {
    if (!plan.amount) return;
    
    setLoading(plan.name);

    try {
      // Create order
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: plan.amount,
          currency: "INR",
          receipt: `receipt_${plan.name.toLowerCase()}_${Date.now()}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Failed to create order. Please try again.");
        setLoading(null);
        return;
      }

      // Open Razorpay checkout
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "VetAcademia",
        description: `${plan.name} Subscription`,
        order_id: data.orderId,
        handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
          // Verify payment
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: plan.amount,
            }),
          });

          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            alert("Payment successful! Welcome to " + plan.name + "!");
            window.location.href = "/dashboard";
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#005f48",
        },
      };

      const razorpay = new (window as unknown as { Razorpay: new (options: object) => { open: () => void } }).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Choose the plan that fits your needs. Start free and upgrade anytime.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative ${plan.popular ? "border-primary shadow-lg" : ""}`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <plan.icon className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>{plan.name}</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {plan.amount ? (
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handlePayment(plan)}
                  disabled={loading === plan.name}
                >
                  {loading === plan.name ? "Processing..." : plan.cta}
                </Button>
              ) : (
                <Link href={plan.href} className="w-full">
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </Link>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="text-muted-foreground">
          All plans include SSL encryption and secure payments via Razorpay.
        </p>
      </div>
    </div>
  );
}
