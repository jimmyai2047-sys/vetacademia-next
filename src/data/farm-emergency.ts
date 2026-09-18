// Emergency contacts (names/notes auto-translate; numbers never translate).

export type EmergencyContact = {
  name: string;
  number: string;
  href: string;
  note: string;
};

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    name: "1962 — National Livestock Helpline",
    number: "1962",
    href: "tel:1962",
    note: "Toll-free, all states. Ambulance and vet advice for sick animals.",
  },
  {
    name: "VetAcademia Pashu Helpline",
    number: "+91 89499 29291",
    href: "tel:+918949929291",
    note: "Call or WhatsApp — guidance from veterinary experts.",
  },
  {
    name: "Nearest Govt. Veterinary Hospital",
    number: "Find Hospital",
    href: "/contact",
    note: "Keep your tehsil hospital's number saved in your phone today.",
  },
];
