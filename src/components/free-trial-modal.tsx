"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, ShieldCheck, Clock, BookOpen, Brain, Users, Sparkles, X } from "lucide-react";

interface FreeTrialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: "homepage" | "pricing" | "demo" | "general";
}

const TRIAL_FEATURES = [
  { icon: BookOpen, title: "Sample Chapters", desc: "Full access to 3 complete chapters per programme" },
  { icon: Brain, title: "Mock Test Preview", desc: "Try 5 adaptive mock tests with rank analytics" },
  { icon: Sparkles, title: "Flashcards Access", desc: "Spaced-repetition flashcards for key subjects" },
  { icon: Users, title: "Expert Doubt Session", desc: "One free 15-min consultation with verified faculty" },
  { icon: ShieldCheck, title: "No Credit Card", desc: "Start instantly — no payment details required" },
  { icon: Clock, title: "14-Day Access", desc: "Two weeks to explore the full platform" },
];

export function FreeTrialModal({ open, onOpenChange, trigger = "general" }: FreeTrialModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              Start Your Free Trial
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-muted-foreground">
            Explore the complete platform for 14 days — no credit card required.
            {trigger === "pricing" && " See what's included before you choose a plan."}
            {trigger === "demo" && " Goes beyond the demo with full chapter access and mock tests."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Trust badges */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 text-xs font-semibold">
              <ShieldCheck className="h-3 w-3" /> Secure checkout
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 text-xs font-semibold">
              <Clock className="h-3 w-3" /> 14-day access
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 text-purple-700 border-purple-200 px-3 py-1 text-xs font-semibold">
              <X className="h-3 w-3" /> No credit card
            </span>
          </div>

          {/* Features grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            {TRIAL_FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className="relative rounded-xl border border-primary/10 bg-white p-4 hover:border-primary/20 transition-colors"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h4 className="font-semibold text-sm">{feature.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* What happens after trial */}
          <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              After your trial ends
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                Your progress, notes & bookmarks are saved
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                Upgrade to any plan to continue seamlessly
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                No auto-charge — you decide when to enroll
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                Downgrade to free tier with limited access anytime
              </li>
            </ul>
          </div>

          {/* Comparison note */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-800 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <strong>Free Trial vs Free Demo:</strong> Trial = 14 days full access • Demo = sample chapters only
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-3">
          <Button
            size="lg"
            className="w-full gap-2 shadow-md"
            onClick={() => {
              onOpenChange(false);
              window.location.href = "/signup?trial=1";
            }}
          >
            Start Free Trial
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              window.location.href = "/demo";
            }}
          >
            Try Free Demo First
          </Button>
          <p className="text-center text-xs text-muted-foreground w-full">
            By starting your trial, you agree to our{" "}
            <a href="/terms" className="underline hover:text-primary">Terms of Service</a>{" "}
            and{" "}
            <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a>.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easy usage across components
export function useFreeTrial() {
  const [open, setOpen] = useState(false);
  return {
    open,
    setOpen,
    FreeTrialModal: () => <FreeTrialModal open={open} onOpenChange={setOpen} />,
  };
}