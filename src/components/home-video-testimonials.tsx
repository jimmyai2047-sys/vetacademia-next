"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Star } from "lucide-react";

const videos = [
  { id: "dQw4w9WgXcQ", name: "Aarav Sharma", exam: "B.V.Sc • 1st Year", thumb: "/images/bvsc.jpg", rating: 5 },
  { id: "dQw4w9WgXcQ", name: "Priya Nair", exam: "ICAR JRF", thumb: "/images/ahdp.jpg", rating: 5 },
];

export default function HomeVideoTestimonials() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {videos.map((v) => (
        <Card key={v.name} className="overflow-hidden rounded-[1.5rem] border-primary/5 bg-white shadow-sm group hover:shadow-xl transition-all">
          <div className="relative h-48 bg-black/5 overflow-hidden">
            <img src={v.thumb} alt={v.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <button className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg group-hover:bg-white group-hover:scale-105 transition-all">
              <Play className="h-5 w-5 fill-primary ml-0.5" />
            </button>
            <Badge className="absolute left-3 top-3 rounded-full bg-white/90 text-primary border-0 text-xs">Video</Badge>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">{v.name}</div>
                <div className="text-xs text-white/80">{v.exam}</div>
              </div>
              <div className="flex text-amber-400">
                {Array.from({ length: v.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                ))}
              </div>
            </div>
          </div>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground line-clamp-2">“VetAcademia ne meri preparation complete change kar di — bilingual notes aur mock tests top notch!”</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
