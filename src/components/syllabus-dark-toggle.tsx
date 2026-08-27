"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export default function SyllabusDarkToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const v = localStorage.getItem("syllabus-dark") === "1";
    setDark(v);
    document.documentElement.classList.toggle("dark", v);
  }, []);
  function toggle() {
    const n = !dark;
    setDark(n);
    localStorage.setItem("syllabus-dark", n ? "1" : "0");
    document.documentElement.classList.toggle("dark", n);
  }
  return (
    <Button variant="outline" size="sm" onClick={toggle} className="rounded-full gap-1.5">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {dark ? "Light" : "Dark"}
    </Button>
  );
}
