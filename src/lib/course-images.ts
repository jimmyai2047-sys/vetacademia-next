// Cover pictures for course plates (MVSc / PhD / DVP course cards on the
// subject page, plus the course hero banner).
//
// Resolution order in getCourseImage():
//   1. exact course-code match (flagship plates, visually verified),
//   2. department prefix + title-keyword rules (covers all ~500 courses),
//   3. null → the plate keeps its gradient/Hash placeholder.
//
// SOURCES (all free for commercial use, visually verified for topic fit):
// - Unsplash License photos (hotlinked, same pattern as subject-images.ts)
// - Wikimedia Commons public-domain images (served from /public/images/courses)
// - Gram stain (W_gram): Y tambe, CC BY-SA 3.0 via Wikimedia Commons
// - Cattle vaccination (V_cattle): USAID/Davis via pixnio, CC0

const U = (id: string) => `https://images.unsplash.com/${id}?w=800&q=80`;

const IMG = {
  microscopist: U("photo-1579154204601-01588f351e67"), // scientist at microscope
  gramStain: "/images/courses/vmc-502-gram-stain.jpg", // Gram stain micrograph
  sarsCov: "/images/courses/vmc-503-sars-cov.jpg", // SARS-CoV electron micrograph (PD)
  fmdv: "/images/courses/vmc-504-fmdv.jpg", // FMD virus electron micrograph (PD)
  macrophage: U("photo-1707079917474-8b8169f89883"), // macrophage SEM (NIAID)
  fungus: U("photo-1767606924572-f25ec609eb22"), // coral fungus (mycology)
  cattleVax: "/images/courses/vmc-507-cattle-vaccination.jpg", // vet vaccinating cattle (CC0)
  pipette: U("photo-1532187863486-abf9dbad1b69"), // pipetting into microplate
  fluorCells: U("photo-1576086213369-97a306d36557"), // fluorescent stained cells
  assayPlate: U("photo-1624957485560-47747511b32f"), // immunoassay plate in gloved hands
  diagLab: U("photo-1582719471384-894fbb16e074"), // modern diagnostic laboratory
  circuit: U("photo-1641926489586-dd5dae881415"), // computing hardware
  pills: U("photo-1587854692152-cbe660dbde88"), // medicines
  flasks: U("photo-1532094349884-543bc11b234d"), // lab glassware
  clinic: U("photo-1576091160550-2173dba999ef"), // clinical examination
  gloves: U("photo-1584820927498-cfe5211fd8bf"), // gloved hands (hygiene)
  ribcage: U("photo-1503429888457-07726f9469ba"), // skeleton ribcage (anatomy)
  museumSkeleton: U("photo-1642611140114-9a46f5aaa735"), // museum skeletons
  xraySkeleton: U("photo-1517697382483-dfc60dfb913f"), // snake skeleton X-ray
  dnaLight: U("photo-1648792940059-3b782a7b8b20"), // DNA helix
  dnaDark: U("photo-1628595351029-c2bf17511435"), // DNA dark background
  cattlePasture: U("photo-1569858241634-5aee6e47091a"), // cows in pasture
  zebuField: U("photo-1657536011755-b6cbe9c4c522"), // zebu cattle in field
  cowCalf: U("photo-1506110061263-1de62e5aad6a"), // cow with calf (reproduction)
  sheepFlock: U("photo-1598618717478-81c4a532ea50"), // sheep flock
  sheepHills: U("photo-1573731281021-d1cc573b3310"), // sheep in hills
  surgeryTeam: U("photo-1579684385127-1ef15d508118"), // surgical team
  surgeryOp: U("photo-1551601651-2a8555f1a136"), // surgeons operating
  dogs: U("photo-1548199973-03cce0bbc87b"), // dogs running
  dairyCows: U("photo-1725409796872-8b41e8eca929"), // dairy cows
  milkBottles: U("photo-1523473827533-2a64d0d36748"), // milk bottles
  meatBoard: U("photo-1544025162-d76694265947"), // meat platter
  chickens: U("photo-1548550023-2bdb3c5beed7"), // chickens
  kittenVet: U("photo-1733783506192-653df6185a7d"), // vet examining kitten
  catHeld: U("photo-1727829735527-6e23ee65431c"), // vet holding cat
  library: U("photo-1427504494785-3a9ca7044f45"), // library shelves
  feedlot: U("photo-1559113386-9a07836a1b72"), // feedlot / feeding operation
};

// Exact flagship plates (course code → image, spaces ignored).
const exactImages: Record<string, string> = {
  VMC501: IMG.microscopist,
  VMC502: IMG.gramStain,
  VMC503: IMG.sarsCov,
  VMC504: IMG.fmdv,
  VMC505: IMG.macrophage,
  VMC506: IMG.fungus,
  VMC507: IMG.cattleVax,
  VMC508: IMG.pipette,
  VMC509: IMG.fluorCells,
  VMC510: IMG.assayPlate,
  VMC511: IMG.diagLab,
  VMC512: IMG.circuit,
};

type Rule = { match: RegExp; img: string };

// Department-prefix rules, evaluated in order. `t` is "CODE TITLE" uppercased.
const prefixRules: { prefix: RegExp; rules: Rule[]; fallback: string }[] = [
  {
    prefix: /^ANA/,
    fallback: IMG.ribcage,
    rules: [
      { match: /RADIO|IMAG|ELECTRONMICROSCOPY|ULTRASTRUCTURE/, img: IMG.xraySkeleton },
      { match: /HISTO|FORENSIC|CLINICAL/, img: IMG.microscopist },
    ],
  },
  {
    prefix: /^AGB/,
    fallback: IMG.cattlePasture,
    rules: [
      { match: /MOLECULAR|CYTOGEN|BIOMETR|GENOM|CYTOLOGY/, img: IMG.dnaLight },
      { match: /POULTRY/, img: IMG.chickens },
      { match: /SHEEP|GOAT/, img: IMG.sheepHills },
      { match: /DOG|CAT|PET/, img: IMG.dogs },
      { match: /LABORATORY|RABBIT/, img: IMG.diagLab },
      { match: /WILD|CAMEL|YAK|MITHUN|EQUINE|SWINE/, img: IMG.zebuField },
    ],
  },
  {
    prefix: /^ANN/,
    fallback: IMG.feedlot,
    rules: [
      { match: /RUMINANT|CATTLE|BUFFALO/, img: IMG.cattlePasture },
      { match: /POULTRY/, img: IMG.chickens },
      { match: /COMPANION|DOG|CAT/, img: IMG.dogs },
      { match: /CLINICAL/, img: IMG.clinic },
      { match: /BIOTECH|RUMEN.*BIOTECH/, img: IMG.dnaDark },
    ],
  },
  {
    prefix: /^BCT/,
    fallback: IMG.flasks,
    rules: [
      { match: /MOLECULAR|BIOINFORMAT|COMPUTATIONAL|SYSTEMS BIOLOGY/, img: IMG.dnaDark },
      { match: /CLINICAL|DIAGNOSTIC/, img: IMG.clinic },
      { match: /REPRODUC|ENDOCRIN/, img: IMG.cowCalf },
    ],
  },
  {
    prefix: /^BTY/,
    fallback: IMG.dnaDark,
    rules: [
      { match: /CELL CULTURE|DIAGNOSTIC|TECHNIQUES|PLATFORM/, img: IMG.pipette },
      { match: /BIOINFORMAT|GENOM|PROTEOM/, img: IMG.dnaLight },
      { match: /VACCIN/, img: IMG.cattleVax },
      { match: /REPRODUC/, img: IMG.cowCalf },
      { match: /IMMUNO/, img: IMG.macrophage },
    ],
  },
  {
    prefix: /^DVP/,
    fallback: IMG.cattlePasture,
    rules: [
      { match: /ANATOMY|SKELETAL|NERVOUS|CIRCULATORY/, img: IMG.ribcage },
      { match: /NUTRITION|FEED|HEALTH/, img: IMG.feedlot },
      { match: /PHYSIOLOGY|BIOCHEMISTRY|PATHOLOGY/, img: IMG.clinic },
      { match: /JURISPRUDENCE|ETHICS|LAW|LIBRARY|INTELLECTUAL PROPERTY/, img: IMG.library },
      { match: /PHARMAC|TOXICO|DRUG|MEDICINE.*PRACTICAL/, img: IMG.pills },
      { match: /MICROBIOLOGY/, img: IMG.pipette },
      { match: /PARASIT/, img: IMG.diagLab },
      { match: /SURGICAL|SURGERY/, img: IMG.surgeryTeam },
      { match: /MEDICINE|CLINICAL|POLYCLINIC|DIAGNOSIS/, img: IMG.kittenVet },
      { match: /EXTENSION/, img: IMG.zebuField },
      { match: /COMPUTER/, img: IMG.circuit },
      { match: /ANDROLOGY|INSEMINATION|GYNAE|OBSTET|PARTURITION|CALF/, img: IMG.cowCalf },
      { match: /BREEDS|CATTLE|BUFFALO/, img: IMG.cattlePasture },
      { match: /POULTRY|HATCHERY|INCUBATION/, img: IMG.chickens },
      { match: /MILK/, img: IMG.milkBottles },
      { match: /VACCINATION|BIOSECURITY/, img: IMG.cattleVax },
    ],
  },
  {
    prefix: /^EXT/,
    fallback: IMG.zebuField,
    rules: [
      { match: /COMMUNIC|JOURNAL|TRAINING|EDUCATION.*TECH|LIBRARY|RESEARCH.*TECH|METHODOLOGY/, img: IMG.library },
      { match: /ENTREPRENEUR|BUSINESS|LEADERSHIP|MANAGEMENT|POLICIES/, img: IMG.cattlePasture },
    ],
  },
  {
    prefix: /^LPM/,
    fallback: IMG.cattlePasture,
    rules: [
      { match: /SHEEP|GOAT/, img: IMG.sheepFlock },
      { match: /POULTRY|HATCHERY/, img: IMG.chickens },
      { match: /COMPANION|DOG|CAT/, img: IMG.dogs },
      { match: /WILD|ZOO/, img: IMG.zebuField },
      { match: /LABORATORY/, img: IMG.diagLab },
      { match: /WASTE|HYGIENE|MACHINERY|CLIMAT/, img: IMG.feedlot },
      { match: /BEHAVIOUR|WELFARE/, img: IMG.cowCalf },
    ],
  },
  {
    prefix: /^LPT/,
    fallback: IMG.meatBoard,
    rules: [
      { match: /MILK|DAIRY/, img: IMG.milkBottles },
      { match: /EGG|POULTRY/, img: IMG.chickens },
      { match: /WOOL/, img: IMG.sheepHills },
      { match: /FISH/, img: IMG.meatBoard },
      { match: /MICROBIOLOGY|QUALITY|BIOTECH/, img: IMG.pipette },
      { match: /PACKAGING|MARKETING/, img: IMG.milkBottles },
    ],
  },
  {
    prefix: /^(PGS|RPE|SSS)/,
    fallback: IMG.library,
    rules: [
      { match: /LIBRAR/, img: IMG.library },
      { match: /LABORATORY|TECHNIQUES/, img: IMG.pipette },
      { match: /COMPUTER|INFORMATION/, img: IMG.circuit },
    ],
  },
  {
    prefix: /^PSC/,
    fallback: IMG.chickens,
    rules: [
      { match: /NUTRITION|FEEDING/, img: IMG.feedlot },
      { match: /HEALTH|DISEASE|BIOSECURITY/, img: IMG.cattleVax },
      { match: /ECONOMICS|MARKETING/, img: IMG.library },
      { match: /WELFARE|WASTE/, img: IMG.chickens },
    ],
  },
  {
    prefix: /^VGO/,
    fallback: IMG.cowCalf,
    rules: [
      { match: /CANINE|FELINE|DOG|CAT/, img: IMG.dogs },
      { match: /CAPRINE|OVINE|SHEEP|GOAT/, img: IMG.sheepFlock },
      { match: /EQUINE|HORSE/, img: IMG.cattlePasture },
      { match: /CAMEL|ELEPHANT|WILD|ZOO|PORCINE|SWINE/, img: IMG.zebuField },
      { match: /ULTRASOUND|ULTRASONO/, img: IMG.diagLab },
      { match: /CLINICAL PRACTICE/, img: IMG.kittenVet },
    ],
  },
  {
    prefix: /^VMC/,
    fallback: IMG.pipette,
    rules: [
      { match: /MYCO|FUNG/, img: IMG.fungus },
      { match: /BACTERI/, img: IMG.gramStain },
      { match: /VIRUS|VIROLOGY|CORONA|INFLUENZA|RABIES|POX|HERPES|FOOT.*MOUTH/, img: IMG.fmdv },
      { match: /TOXIN|PATHOGENESIS/, img: IMG.macrophage },
      { match: /GENETICS|GENOM/, img: IMG.dnaLight },
      { match: /IMMUNO|VACCIN|CYTOKINE|MUCOSAL/, img: IMG.macrophage },
      { match: /BIOINFORMAT/, img: IMG.circuit },
      { match: /BIOTECH|MOLECULAR.*MICRO/, img: IMG.fluorCells },
      { match: /GRAM|STAIN|CULTURE|SYSTEMATIC.*BACTERI/, img: IMG.gramStain },
    ],
  },
  {
    prefix: /^VMD/,
    fallback: IMG.kittenVet,
    rules: [
      { match: /RUMINANT|CATTLE|BUFFALO/, img: IMG.cattlePasture },
      { match: /EQUINE|HORSE/, img: IMG.cattlePasture },
      { match: /CANINE|FELINE|DOG|CAT/, img: IMG.catHeld },
      { match: /AVIAN|POULTRY/, img: IMG.chickens },
      { match: /SWINE|PORCINE/, img: IMG.zebuField },
      { match: /ZOO|WILD/, img: IMG.zebuField },
      { match: /TOXICO|FORENSIC/, img: IMG.pills },
      { match: /DIAGNOSTIC|TECHNIQUES|INVESTIGATION/, img: IMG.diagLab },
      { match: /INFECTIOUS|BIOSECURITY/, img: IMG.cattleVax },
      { match: /ONCOLOGY/, img: IMG.fluorCells },
      { match: /METABOLIC|MAMMARY|DAIRY/, img: IMG.dairyCows },
      { match: /PAEDIATRIC|GERIATRIC/, img: IMG.cowCalf },
    ],
  },
  {
    prefix: /^VPA/,
    fallback: IMG.diagLab,
    rules: [
      { match: /IMMUNO/, img: IMG.macrophage },
      { match: /ZOONOSES/, img: IMG.gloves },
      { match: /WILDLIFE/, img: IMG.zebuField },
    ],
  },
  {
    prefix: /^VPE/,
    fallback: IMG.gloves,
    rules: [
      { match: /FOOD|MILK|DAIRY/, img: IMG.milkBottles },
      { match: /MEAT|ABATTOIR/, img: IMG.meatBoard },
      { match: /LABORATORY|TECHNIQUES/, img: IMG.diagLab },
      { match: /BIOSECURITY|BIOTERROR|VACCIN/, img: IMG.cattleVax },
      { match: /ENVIRONMENT|FIELD|FARM/, img: IMG.feedlot },
    ],
  },
  {
    prefix: /^VPL/,
    fallback: IMG.fluorCells,
    rules: [
      { match: /CLINICAL/, img: IMG.clinic },
      { match: /TOXICO/, img: IMG.pills },
      { match: /TECHNIQUES|NECROPSY/, img: IMG.diagLab },
      { match: /AVIAN/, img: IMG.chickens },
      { match: /WILD|ZOO|LABORATORY.*ANIMAL/, img: IMG.zebuField },
      { match: /INFECTIOUS/, img: IMG.macrophage },
    ],
  },
  {
    prefix: /^VPT/,
    fallback: IMG.pills,
    rules: [
      { match: /TECHNIQUES/, img: IMG.pipette },
      { match: /HERBAL|ETHNO/, img: IMG.feedlot },
      { match: /TOXINOLOGY/, img: IMG.xraySkeleton },
    ],
  },
  {
    prefix: /^VPY/,
    fallback: IMG.clinic,
    rules: [
      { match: /HAEMATO|BLOOD|BODY FLUID/, img: IMG.fluorCells },
      { match: /REPRODUC|ENDOCRIN|GROWTH/, img: IMG.cowCalf },
      { match: /RUMINANT|DIGEST/, img: IMG.cattlePasture },
      { match: /WILD/, img: IMG.zebuField },
      { match: /INSTRUMENT|TECHNIQUES/, img: IMG.diagLab },
    ],
  },
  {
    prefix: /^VSR/,
    fallback: IMG.surgeryTeam,
    rules: [
      { match: /ANAESTHESIA|ANALGESIA/, img: IMG.surgeryOp },
      { match: /IMAG|RADIO|X-RAY|XRAY/, img: IMG.xraySkeleton },
      { match: /ZOO|WILD|EXOTIC|LABORATORY/, img: IMG.zebuField },
      { match: /CAMEL|ELEPHANT/, img: IMG.zebuField },
      { match: /CLINICAL|CASE/, img: IMG.kittenVet },
    ],
  },
];

export function getCourseImage(
  courseCode: string | null | undefined,
  courseTitle?: string | null,
): string | null {
  if (!courseCode) return null;
  const code = courseCode.replace(/[\s*]+/g, "").toUpperCase();
  if (exactImages[code]) return exactImages[code];
  const t = `${code} ${courseTitle ?? ""}`.toUpperCase();
  for (const group of prefixRules) {
    if (group.prefix.test(code)) {
      for (const r of group.rules) {
        if (r.match.test(t)) return r.img;
      }
      return group.fallback;
    }
  }
  return null;
}

export default exactImages;
