// Breeding reference (English source; UI auto-translates via FarmText).

export type GestationRow = {
  animal: string;
  days: string;
  heatSigns: string;
};

export const GESTATION_ROWS: GestationRow[] = [
  {
    animal: "Cow",
    days: "280–285",
    heatSigns: "Bellowing, mounting others, clear mucus discharge, stands to be mounted (standing heat = right AI time)",
  },
  {
    animal: "Buffalo",
    days: "305–310",
    heatSigns: "Silent heat is common — watch for frequent urination, restlessness, mucus; evening heat signs are strongest",
  },
  {
    animal: "Goat",
    days: "145–155",
    heatSigns: "Tail wagging, bleating, swollen red vulva, stands for the buck",
  },
  {
    animal: "Sheep",
    days: "145–155",
    heatSigns: "Restlessness, seeks the ram, stands still when mounted",
  },
  {
    animal: "Pig (Sow)",
    days: "112–116 (3 months, 3 weeks, 3 days)",
    heatSigns: "Stands rigid with pressure on back (standing reflex), swollen vulva, reduced appetite",
  },
];

export const AI_TIPS: string[] = [
  "Do AI 12–18 hours after standing heat starts — morning heat → evening AI gives best conception.",
  "Use only certified frozen semen and confirm the AI worker deposits it in the uterus, not the vagina.",
  "Confirm pregnancy after 60–90 days by a vet (PD test) — do not wait for the full term.",
  "Give extra 1–1.5 kg concentrate daily in the last 2 months of pregnancy plus mineral mixture.",
  "Prepare a clean, dry calving corner 15 days before due date; keep the vet's number ready.",
  "Feed colostrum (khees) within 2 hours of birth — it is the calf's first and most important vaccine.",
];
