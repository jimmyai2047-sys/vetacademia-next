import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  { name: "Ramesh Jat", farm: "Dairy, Nagaur", text: "Feed calculator se roz ₹40 bacha raha hoon — 10L wali gaay ka sahi ration mil gaya.", initials: "RJ" },
  { name: "Sunita Devi", farm: "Goat Farm, Sikar", text: "PPR vaccine reminder se sab bakriyan time pe lag gayi, mortality zero.", initials: "SD" },
];

export default function FarmTestimonials() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {testimonials.map((t) => (
        <Card key={t.name} className="rounded-[1.25rem] border-primary/5 bg-emerald-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white text-xs font-bold">
                {t.initials}
              </div>
              <div>
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.farm}</div>
              </div>
              <div className="ml-auto flex text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
            <div className="mt-3 flex gap-2 text-sm text-muted-foreground">
              <Quote className="h-4 w-4 shrink-0 text-primary/30" />
              <p>&ldquo;{t.text}&rdquo;</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
