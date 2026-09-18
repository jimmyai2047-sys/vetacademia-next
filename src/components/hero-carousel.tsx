"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  { src: "/images/hero-vet-v2.webp", alt: "Veterinarian caring for animals" },
  { src: "/images/hero-slide-2.webp", alt: "Veterinary education" },
  { src: "/images/hero-goat.webp", alt: "Goat in farm" },
  { src: "/images/hero-horse.webp", alt: "Horses in pasture" },
  { src: "/images/hero-cow.webp", alt: "Dairy cow in green field" },
  { src: "/images/hero-dog.webp", alt: "Pet dog" },
  { src: "/images/hero-slide-5.webp", alt: "Vet with cattle" },
  { src: "/images/hero-sheep.webp", alt: "Sheep in meadow" },
  { src: "/images/hero-slide-6.webp", alt: "Animal health checkup" },
  { src: "/images/hero-slide-7.webp", alt: "Veterinary clinic" },
  { src: "/images/hero-bird.webp", alt: "Colorful bird" },
  { src: "/images/hero-slide-8.webp", alt: "Livestock care" },
  { src: "/images/hero-cat.webp", alt: "Pet cat" },
];

export default function HeroCarousel() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative h-[260px] sm:h-[340px] md:h-[380px] lg:h-[400px] overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border bg-muted shadow-2xl">
      {slides.map((s, i) => (
        <Image
          key={s.src}
          src={s.src}
          alt={s.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 560px"
          className={`object-cover transition-opacity duration-700 ${i === idx ? "opacity-100" : "opacity-0"}`}
          priority={i === 0}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}
