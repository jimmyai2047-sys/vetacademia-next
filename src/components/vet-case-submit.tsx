"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Upload, CheckCircle, Clock } from "lucide-react";

export default function VetCaseSubmit() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    }, 800);
  }

  if (submitted) {
    return (
      <Card className="rounded-[1.25rem] border-emerald-200 bg-emerald-50">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto" />
          <p className="font-semibold mt-2">Case submitted!</p>
          <p className="text-sm text-muted-foreground">Expert 24h me review karke aapko reply karega. Email pe notification aayega.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[1.25rem] border-primary/10 shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Send className="h-4 w-4 text-blue-600" /> Submit Case for Expert Review
          <Badge variant="outline" className="ml-auto rounded-full text-xs gap-1">
            <Clock className="h-3 w-3" /> 24h review
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">History, photos bhejo — 50+ verified vets me se koi review karega.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Species *</Label>
              <select className="flex h-9 w-full rounded-xl border border-input bg-background px-3 text-sm" required>
                <option>Cattle</option>
                <option>Buffalo</option>
                <option>Goat / Sheep</option>
                <option>Horse</option>
                <option>Dog / Cat</option>
                <option>Poultry</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Age</Label>
              <Input placeholder="3 years" className="h-9 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Contact (WhatsApp)</Label>
              <Input placeholder="+91..." className="h-9 rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Case History *</Label>
            <Textarea placeholder="Signs, duration, treatment tried, vitals..." rows={3} className="rounded-xl" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Upload className="h-3.5 w-3.5" /> Photos (optional)
            </Label>
            <Input type="file" accept="image/*" multiple className="rounded-xl" />
            <p className="text-[10px] text-muted-foreground">Max 3 photos, 5MB each</p>
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-xl gap-2">
            {loading ? "Submitting..." : "Submit Case"}
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
