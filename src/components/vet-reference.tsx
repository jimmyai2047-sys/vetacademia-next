"use client";

import { useState } from "react";
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

interface AnimalParams {
  name: string;
  hindiName: string;
  scientificName: string;
  icon: string;
  bodyWeight: string;
  lifespan: string;
  gestationPeriod: string;
  vitalSigns: {
    temperature: string;
    heartRate: string;
    respiratoryRate: string;
    rumenMotility: string;
    capillaryRefillTime: string;
  };
  bloodProfile: {
    rbc: string;
    wbc: string;
    platelets: string;
    hemoglobin: string;
    pcv: string;
    mcv: string;
    mch: string;
    mchc: string;
    lymphocytes: string;
    neutrophils: string;
    eosinophils: string;
    monocytes: string;
    basophils: string;
    bloodGlucose: string;
    totalProtein: string;
    albumin: string;
    globulin: string;
    bun: string;
    creatinine: string;
    alt: string;
    ast: string;
  };
}

const animalsData: AnimalParams[] = [
  {
    name: "Cattle",
    hindiName: "गाय",
    scientificName: "Bos taurus / Bos indicus",
    icon: "🐄",
    bodyWeight: "250-600 kg",
    lifespan: "18-22 years",
    gestationPeriod: "283 days",
    vitalSigns: {
      temperature: "101.0-102.5°F (38.3-39.2°C)",
      heartRate: "60-80 bpm",
      respiratoryRate: "15-30 breaths/min",
      rumenMotility: "2-3 contractions/min",
      capillaryRefillTime: "2 seconds",
    },
    bloodProfile: {
      rbc: "5.0-10.0 million/µL",
      wbc: "4,000-12,000/µL",
      platelets: "100,000-400,000/µL",
      hemoglobin: "8.0-15.0 g/dL",
      pcv: "24-46%",
      mcv: "40-60 fL",
      mch: "11-17 pg",
      mchc: "30-36 g/dL",
      lymphocytes: "45-75%",
      neutrophils: "15-45%",
      eosinophils: "0.5-6%",
      monocytes: "0-8%",
      basophils: "0-2%",
      bloodGlucose: "40-70 mg/dL",
      totalProtein: "6.5-8.5 g/dL",
      albumin: "2.5-3.5 g/dL",
      globulin: "3.0-5.0 g/dL",
      bun: "10-30 mg/dL",
      creatinine: "0.6-1.2 mg/dL",
      alt: "10-40 U/L",
      ast: "20-80 U/L",
    },
  },
  {
    name: "Buffalo",
    hindiName: "भैंस",
    scientificName: "Bubalus bubalis",
    icon: "🐃",
    bodyWeight: "300-800 kg",
    lifespan: "18-25 years",
    gestationPeriod: "305 days",
    vitalSigns: {
      temperature: "100.5-102.0°F (38.1-38.9°C)",
      heartRate: "40-70 bpm",
      respiratoryRate: "10-30 breaths/min",
      rumenMotility: "2-3 contractions/min",
      capillaryRefillTime: "2 seconds",
    },
    bloodProfile: {
      rbc: "5.5-12.0 million/µL",
      wbc: "3,500-11,000/µL",
      platelets: "100,000-400,000/µL",
      hemoglobin: "8.0-16.0 g/dL",
      pcv: "26-48%",
      mcv: "38-58 fL",
      mch: "10-16 pg",
      mchc: "30-36 g/dL",
      lymphocytes: "40-72%",
      neutrophils: "15-45%",
      eosinophils: "0-8%",
      monocytes: "0-8%",
      basophils: "0-2%",
      bloodGlucose: "45-75 mg/dL",
      totalProtein: "6.0-8.5 g/dL",
      albumin: "2.2-3.5 g/dL",
      globulin: "3.0-5.0 g/dL",
      bun: "10-30 mg/dL",
      creatinine: "0.6-1.4 mg/dL",
      alt: "10-40 U/L",
      ast: "20-80 U/L",
    },
  },
  {
    name: "Sheep",
    hindiName: "भेड़",
    scientificName: "Ovis aries",
    icon: "🐑",
    bodyWeight: "35-90 kg",
    lifespan: "10-12 years",
    gestationPeriod: "147 days",
    vitalSigns: {
      temperature: "101.5-103.5°F (38.6-39.7°C)",
      heartRate: "70-90 bpm",
      respiratoryRate: "15-30 breaths/min",
      rumenMotility: "1.5-2.5 contractions/min",
      capillaryRefillTime: "2 seconds",
    },
    bloodProfile: {
      rbc: "8.0-18.0 million/µL",
      wbc: "4,000-12,000/µL",
      platelets: "250,000-750,000/µL",
      hemoglobin: "9.0-15.0 g/dL",
      pcv: "27-45%",
      mcv: "28-42 fL",
      mch: "8-12 pg",
      mchc: "31-38 g/dL",
      lymphocytes: "50-70%",
      neutrophils: "15-45%",
      eosinophils: "0-8%",
      monocytes: "0-6%",
      basophils: "0-1%",
      bloodGlucose: "50-80 mg/dL",
      totalProtein: "6.0-8.0 g/dL",
      albumin: "2.5-3.5 g/dL",
      globulin: "2.5-4.5 g/dL",
      bun: "12-25 mg/dL",
      creatinine: "0.6-1.2 mg/dL",
      alt: "10-40 U/L",
      ast: "20-80 U/L",
    },
  },
  {
    name: "Goat",
    hindiName: "बकरी",
    scientificName: "Capra aegagrus hircus",
    icon: "🐐",
    bodyWeight: "20-80 kg",
    lifespan: "12-15 years",
    gestationPeriod: "150 days",
    vitalSigns: {
      temperature: "101.5-103.5°F (38.6-39.7°C)",
      heartRate: "70-90 bpm",
      respiratoryRate: "15-30 breaths/min",
      rumenMotility: "1.5-2.5 contractions/min",
      capillaryRefillTime: "2 seconds",
    },
    bloodProfile: {
      rbc: "8.0-18.0 million/µL",
      wbc: "4,000-13,000/µL",
      platelets: "250,000-600,000/µL",
      hemoglobin: "8.0-16.0 g/dL",
      pcv: "22-44%",
      mcv: "16-36 fL",
      mch: "5-11 pg",
      mchc: "30-36 g/dL",
      lymphocytes: "50-70%",
      neutrophils: "15-45%",
      eosinophils: "0-8%",
      monocytes: "0-6%",
      basophils: "0-1%",
      bloodGlucose: "50-80 mg/dL",
      totalProtein: "6.0-8.0 g/dL",
      albumin: "2.5-3.5 g/dL",
      globulin: "2.5-4.5 g/dL",
      bun: "12-25 mg/dL",
      creatinine: "0.6-1.2 mg/dL",
      alt: "10-40 U/L",
      ast: "20-80 U/L",
    },
  },
  {
    name: "Horse",
    hindiName: "घोड़ा",
    scientificName: "Equus ferus caballus",
    icon: "🐴",
    bodyWeight: "350-1000 kg",
    lifespan: "25-30 years",
    gestationPeriod: "330 days",
    vitalSigns: {
      temperature: "99.0-101.5°F (37.2-38.6°C)",
      heartRate: "28-44 bpm",
      respiratoryRate: "8-16 breaths/min",
      rumenMotility: "N/A (Hindgut fermenter)",
      capillaryRefillTime: "2 seconds",
    },
    bloodProfile: {
      rbc: "6.0-12.0 million/µL",
      wbc: "5,000-12,000/µL",
      platelets: "100,000-350,000/µL",
      hemoglobin: "8.0-15.0 g/dL",
      pcv: "30-50%",
      mcv: "34-52 fL",
      mch: "12-18 pg",
      mchc: "33-39 g/dL",
      lymphocytes: "30-50%",
      neutrophils: "40-60%",
      eosinophils: "0-5%",
      monocytes: "0-6%",
      basophils: "0-1%",
      bloodGlucose: "65-130 mg/dL",
      totalProtein: "5.5-8.0 g/dL",
      albumin: "2.5-4.0 g/dL",
      globulin: "2.5-4.5 g/dL",
      bun: "10-25 mg/dL",
      creatinine: "0.8-1.4 mg/dL",
      alt: "10-40 U/L",
      ast: "100-400 U/L",
    },
  },
  {
    name: "Camel",
    hindiName: "ऊँट",
    scientificName: "Camelus dromedarius",
    icon: "🐪",
    bodyWeight: "300-700 kg",
    lifespan: "40-50 years",
    gestationPeriod: "390 days",
    vitalSigns: {
      temperature: "93.0-101.0°F (33.9-38.3°C)",
      heartRate: "30-50 bpm",
      respiratoryRate: "6-14 breaths/min",
      rumenMotility: "N/A (Ruminant)",
      capillaryRefillTime: "2-3 seconds",
    },
    bloodProfile: {
      rbc: "5.0-14.0 million/µL",
      wbc: "5,000-12,000/µL",
      platelets: "100,000-300,000/µL",
      hemoglobin: "8.0-20.0 g/dL",
      pcv: "25-45%",
      mcv: "30-50 fL",
      mch: "12-20 pg",
      mchc: "30-38 g/dL",
      lymphocytes: "30-60%",
      neutrophils: "20-50%",
      eosinophils: "0-10%",
      monocytes: "0-8%",
      basophils: "0-2%",
      bloodGlucose: "45-75 mg/dL",
      totalProtein: "5.5-8.0 g/dL",
      albumin: "2.5-3.5 g/dL",
      globulin: "2.5-4.5 g/dL",
      bun: "10-30 mg/dL",
      creatinine: "0.5-1.5 mg/dL",
      alt: "10-40 U/L",
      ast: "20-80 U/L",
    },
  },
  {
    name: "Pig",
    hindiName: "सूअर",
    scientificName: "Sus scrofa domesticus",
    icon: "🐷",
    bodyWeight: "50-350 kg",
    lifespan: "15-20 years",
    gestationPeriod: "114 days",
    vitalSigns: {
      temperature: "101.5-103.5°F (38.6-39.7°C)",
      heartRate: "60-100 bpm",
      respiratoryRate: "8-18 breaths/min",
      rumenMotility: "N/A (Monogastric)",
      capillaryRefillTime: "2 seconds",
    },
    bloodProfile: {
      rbc: "5.0-10.0 million/µL",
      wbc: "6,000-18,000/µL",
      platelets: "200,000-500,000/µL",
      hemoglobin: "8.0-16.0 g/dL",
      pcv: "30-45%",
      mcv: "40-60 fL",
      mch: "12-18 pg",
      mchc: "30-36 g/dL",
      lymphocytes: "40-70%",
      neutrophils: "20-50%",
      eosinophils: "0-5%",
      monocytes: "0-8%",
      basophils: "0-2%",
      bloodGlucose: "65-120 mg/dL",
      totalProtein: "6.0-8.5 g/dL",
      albumin: "2.0-4.0 g/dL",
      globulin: "2.5-5.0 g/dL",
      bun: "10-30 mg/dL",
      creatinine: "0.8-1.5 mg/dL",
      alt: "20-70 U/L",
      ast: "20-100 U/L",
    },
  },
  {
    name: "Poultry",
    hindiName: "मुर्गी",
    scientificName: "Gallus gallus domesticus",
    icon: "🐔",
    bodyWeight: "1.5-4 kg",
    lifespan: "5-10 years",
    gestationPeriod: "21 days (incubation)",
    vitalSigns: {
      temperature: "104.0-107.5°F (40.0-41.9°C)",
      heartRate: "300-500 bpm",
      respiratoryRate: "15-30 breaths/min",
      rumenMotility: "N/A (Monogastric)",
      capillaryRefillTime: "N/A",
    },
    bloodProfile: {
      rbc: "2.0-4.5 million/µL",
      wbc: "5,000-20,000/µL",
      platelets: "N/A (Nucleated RBCs)",
      hemoglobin: "8.0-15.0 g/dL",
      pcv: "30-50%",
      mcv: "100-140 fL",
      mch: "25-45 pg",
      mchc: "25-35 g/dL",
      lymphocytes: "40-70%",
      neutrophils: "20-50%",
      eosinophils: "1-5%",
      monocytes: "0-10%",
      basophils: "0-2%",
      bloodGlucose: "130-350 mg/dL",
      totalProtein: "3.0-6.0 g/dL",
      albumin: "1.0-2.5 g/dL",
      globulin: "1.5-3.5 g/dL",
      bun: "5-25 mg/dL",
      creatinine: "0.2-0.6 mg/dL",
      alt: "10-40 U/L",
      ast: "100-300 U/L",
    },
  },
  {
    name: "Wild Animals",
    hindiName: "वन्यजीव",
    scientificName: "Various Species",
    icon: "🦌",
    bodyWeight: "Varies by species",
    lifespan: "Varies by species",
    gestationPeriod: "Varies by species",
    vitalSigns: {
      temperature: "99.0-103.0°F (37.2-39.4°C)",
      heartRate: "40-120 bpm",
      respiratoryRate: "10-30 breaths/min",
      rumenMotility: "Varies",
      capillaryRefillTime: "2 seconds",
    },
    bloodProfile: {
      rbc: "5.0-15.0 million/µL",
      wbc: "4,000-15,000/µL",
      platelets: "100,000-500,000/µL",
      hemoglobin: "8.0-16.0 g/dL",
      pcv: "25-50%",
      mcv: "30-60 fL",
      mch: "10-18 pg",
      mchc: "30-36 g/dL",
      lymphocytes: "30-70%",
      neutrophils: "20-55%",
      eosinophils: "0-8%",
      monocytes: "0-8%",
      basophils: "0-2%",
      bloodGlucose: "50-150 mg/dL",
      totalProtein: "5.0-8.5 g/dL",
      albumin: "2.0-4.0 g/dL",
      globulin: "2.5-5.0 g/dL",
      bun: "10-35 mg/dL",
      creatinine: "0.5-1.8 mg/dL",
      alt: "10-50 U/L",
      ast: "20-120 U/L",
    },
  },
];

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
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Stethoscope className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Veterinary Reference Guide</h1>
        </div>
        <p className="text-white/90 max-w-2xl">
          Quick reference for normal physiological parameters and blood profiles of domestic animals.
          Essential for clinical diagnosis and health assessment.
        </p>
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
