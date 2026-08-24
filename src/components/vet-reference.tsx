"use client";

import { useState } from "react";
import Image from "next/image";
import { getVetHeroImage } from "@/lib/page-images";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Stethoscope,
  Thermometer,
  Heart,
  Wind,
  Droplets,
  Activity,
  Search,
  ChevronDown,
  Shield,
  CircleDot,
  Ruler,
  Weight,
  Circle,
  FlaskConical,
  Percent,
} from "lucide-react";

import { animalsData, type AnimalParams } from "@/lib/vet-reference-data";

export default function VetReference() {
  const [selectedAnimal, setSelectedAnimal] = useState<string>("cattle");
  const [searchTerm, setSearchTerm] = useState("");

  const animal = animalsData.find((a) => a.name.toLowerCase() === selectedAnimal) || animalsData[0];

  const filteredAnimals = animalsData.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.hindiName.includes(searchTerm)
  );

  return (
    <div id="reference" className="container mx-auto px-4 py-8">
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-2xl">
        <Image
          src={getVetHeroImage()}
          alt="Veterinary clinical reference"
          fill
          sizes="(max-width: 768px) 100vw, 1200px"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-indigo-600/70 to-transparent" />
        <div className="relative p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Stethoscope className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Veterinary Reference Guide</h1>
          </div>
          <p className="text-white/90 max-w-2xl">
            Quick reference for normal physiological parameters and blood profiles of domestic animals.
            Essential for clinical diagnosis and health assessment.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search animal (English or Hindi)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Search animals by name"
        />
      </div>

      {/* Animal Selector */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 mb-8">
        {filteredAnimals.map((a) => (
          <button
            key={a.name}
            onClick={() => setSelectedAnimal(a.name.toLowerCase())}
            className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
              selectedAnimal === a.name.toLowerCase()
                ? "border-primary bg-primary/5 shadow-md"
                : "border-transparent bg-muted/50 hover:bg-accent"
            }`}
          >
            <span className="text-2xl mb-1">{a.icon}</span>
            <span className="text-xs font-medium text-center">{a.name}</span>
          </button>
        ))}
      </div>

      {/* Animal Info Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{animal.icon}</span>
            <div>
              <h2 className="text-2xl font-bold">{animal.name}</h2>
              <p className="text-muted-foreground">{animal.hindiName} | {animal.scientificName}</p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm">
                <Badge variant="outline">Body Weight: {animal.bodyWeight}</Badge>
                <Badge variant="outline">Lifespan: {animal.lifespan}</Badge>
                <Badge variant="outline">Gestation: {animal.gestationPeriod}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vital Signs */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Vital Signs
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <Thermometer className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Temperature</div>
                  <div className="font-semibold text-sm">{animal.vitalSigns.temperature}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Heart Rate</div>
                  <div className="font-semibold text-sm">{animal.vitalSigns.heartRate}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Wind className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Respiratory Rate</div>
                  <div className="font-semibold text-sm">{animal.vitalSigns.respiratoryRate}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Rumen Motility</div>
                  <div className="font-semibold text-sm">{animal.vitalSigns.rumenMotility}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Droplets className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">CRT</div>
                  <div className="font-semibold text-sm">{animal.vitalSigns.capillaryRefillTime}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Blood Profile */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Droplets className="h-5 w-5 text-primary" />
          Blood Profile - Normal Values
        </h3>

        {/* Hematology */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Hematology Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Parameter</th>
                    <th className="text-left p-3 font-medium">Normal Range</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "RBC (Red Blood Cells)", value: animal.bloodProfile.rbc },
                    { label: "WBC (White Blood Cells)", value: animal.bloodProfile.wbc },
                    { label: "Platelets", value: animal.bloodProfile.platelets },
                    { label: "Hemoglobin", value: animal.bloodProfile.hemoglobin },
                    { label: "PCV (Packed Cell Volume)", value: animal.bloodProfile.pcv },
                    { label: "MCV", value: animal.bloodProfile.mcv },
                    { label: "MCH", value: animal.bloodProfile.mch },
                    { label: "MCHC", value: animal.bloodProfile.mchc },
                  ].map((param, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-accent transition-colors">
                      <td className="p-3 font-medium">{param.label}</td>
                      <td className="p-3 text-muted-foreground">{param.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Differential Count */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Differential Leukocyte Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Cell Type</th>
                    <th className="text-left p-3 font-medium">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Lymphocytes", value: animal.bloodProfile.lymphocytes },
                    { label: "Neutrophils", value: animal.bloodProfile.neutrophils },
                    { label: "Eosinophils", value: animal.bloodProfile.eosinophils },
                    { label: "Monocytes", value: animal.bloodProfile.monocytes },
                    { label: "Basophils", value: animal.bloodProfile.basophils },
                  ].map((param, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-accent transition-colors">
                      <td className="p-3 font-medium">{param.label}</td>
                      <td className="p-3 text-muted-foreground">{param.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Biochemistry */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Biochemistry Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Parameter</th>
                    <th className="text-left p-3 font-medium">Normal Range</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Blood Glucose", value: animal.bloodProfile.bloodGlucose },
                    { label: "Total Protein", value: animal.bloodProfile.totalProtein },
                    { label: "Albumin", value: animal.bloodProfile.albumin },
                    { label: "Globulin", value: animal.bloodProfile.globulin },
                    { label: "BUN", value: animal.bloodProfile.bun },
                    { label: "Creatinine", value: animal.bloodProfile.creatinine },
                    { label: "ALT (SGPT)", value: animal.bloodProfile.alt },
                    { label: "AST (SGOT)", value: animal.bloodProfile.ast },
                  ].map((param, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-accent transition-colors">
                      <td className="p-3 font-medium">{param.label}</td>
                      <td className="p-3 text-muted-foreground">{param.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> These are general reference values. Normal ranges may vary based on breed, age, sex,
            diet, and environmental conditions. Always consider individual variation when interpreting lab results.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
