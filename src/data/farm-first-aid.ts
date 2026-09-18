// First-aid reference (English source; UI auto-translates via FarmText).
// Keep strings short and field-tested. Disease/drug names stay in English
// even after translation (API prompt rule).

export type FirstAidRow = {
  condition: string;
  animals: string;
  symptoms: string;
  firstAid: string;
  callVet: string;
};

export const FIRST_AID_ROWS: FirstAidRow[] = [
  {
    condition: "FMD (Foot-and-Mouth Disease)",
    animals: "Cattle, Buffalo, Goat, Sheep, Pig",
    symptoms: "Blisters on mouth and feet, drooling, lameness, sudden drop in milk",
    firstAid: "Isolate the animal, give soft green fodder and clean water, wash mouth/feet with potassium permanganate solution",
    callVet: "Immediately — FMD spreads fast and needs reporting",
  },
  {
    condition: "Mastitis (Thanela)",
    animals: "Milking cattle and buffalo",
    symptoms: "Hot, hard, painful udder; clots or blood in milk; fever",
    firstAid: "Strip infected milk 3–4 times a day, cold fomentation first 24 hrs then hot, keep shed dry",
    callVet: "Within 24 hours — delayed treatment causes permanent udder damage",
  },
  {
    condition: "Bloat (Aphara)",
    animals: "Cattle, Buffalo, Goat, Sheep",
    symptoms: "Left side of belly swells fast, restlessness, difficulty breathing",
    firstAid: "Keep animal standing and walking, give 100–200 ml mustard oil or bloat medicine, massage left flank",
    callVet: "Urgently if breathing is laboured — bloat can kill in hours",
  },
  {
    condition: "Calf Diarrhoea",
    animals: "Calves under 3 months",
    symptoms: "Watery white/yellow dung, weakness, sunken eyes, stops suckling",
    firstAid: "Continue milk in small feeds + give ORS/electrolyte water 3–4 times daily, keep calf warm and dry",
    callVet: "Same day if blood in dung or calf cannot stand",
  },
  {
    condition: "HS (Galghotu)",
    animals: "Cattle, Buffalo (rainy season)",
    symptoms: "High fever, painful throat swelling, noisy breathing, sudden death",
    firstAid: "Isolate, cold water sponging for fever, do not force-feed; vaccinate healthy animals nearby",
    callVet: "Immediately — HS kills within 24–48 hours",
  },
  {
    condition: "PPR (Goat Plague)",
    animals: "Goat, Sheep",
    symptoms: "Fever, eye-nose discharge, mouth sores, foul-smelling diarrhoea",
    firstAid: "Isolate sick animals, give clean water + soft feed, clean eyes/nose with saline",
    callVet: "Immediately and vaccinate the whole flock yearly",
  },
  {
    condition: "Ranikhet Disease",
    animals: "Poultry",
    symptoms: "Twisted neck, green diarrhoea, gasping, sudden deaths",
    firstAid: "Remove dead birds safely (bury deep), disinfect drinkers, give vitamins in water",
    callVet: "Immediately — vaccinate healthy birds on schedule (F1, R2B, Lasota)",
  },
  {
    condition: "Lumpy Skin Disease (LSD)",
    animals: "Cattle, Buffalo",
    symptoms: "Round skin nodules all over body, fever, leg swelling, low milk",
    firstAid: "Isolate, control flies/mosquitoes, soft feed, clean nodules with antiseptic",
    callVet: "Same day — vaccinate healthy animals (goat-pox/LSD vaccine)",
  },
  {
    condition: "Wounds and Maggots",
    animals: "All animals",
    symptoms: "Open wound, foul smell, visible maggots, animal rubs the spot",
    firstAid: "Clean with clean water + antiseptic, apply maggot-killing spray/dressing daily",
    callVet: "If wound is deep, near eye/joint, or maggots return",
  },
  {
    condition: "Heat Stroke (Loo)",
    animals: "Buffalo, Poultry, all animals in May–June",
    symptoms: "Panting, drooling, body temp above 105°F, collapse",
    firstAid: "Move to shade, pour cold water on head/body, offer cool water with salt-jaggery, wallow buffalo",
    callVet: "Urgently if animal collapses or temperature stays high",
  },
];
