// Seed: DVP — Diploma in Veterinary Pharmacy (Uttar Pradesh, DUVASU Mathura).
// Source: D.V.P folder — "Diploma-in-Veterinary-Pharmacy-Complete-Syllabus.docx"
// (Table 0 = semester summary, Tables 1–24 = Theory/Practical topic lists).
//
// SKELETON seed: Programme + 24 Subjects (semester-wise) + Theory/Practical
// topic chapters (titles + topic lists; detailed content added later).
// Idempotent: scoped to Programme name "DVP" only — rerunning wipes and
// recreates DVP subjects/chapters, nothing else.
//
// Run: npx tsx prisma/seeds/add-dvp-up.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

type Course = {
  code: string;
  name: string;
  semester: string;
  year: string;
  creditHours: string;
  hours: string;
  outcomes: string[];
  theory?: string[];
  practical?: string[];
};

const SEM1 = "1st Semester";
const SEM2 = "2nd Semester";
const SEM3 = "3rd Semester";
const SEM4 = "4th Semester";
const YR1 = "1st Year";
const YR2 = "2nd Year";

const courses: Course[] = [
  {
    code: "DVP-111",
    name: "Anatomy of Livestock and Poultry",
    semester: SEM1, year: YR1, creditHours: "0+2", hours: "80 Hours",
    outcomes: [
      "Identify external body parts and major organ systems of livestock and poultry",
      "Describe the structure of skeletal, digestive, respiratory, circulatory, urogenital and nervous systems",
      "Locate and recognize superficial lymph nodes and sense organs in different species",
      "Apply basic anatomical knowledge for handling and routine veterinary procedures",
    ],
    practical: [
      "Introduction to the structures of skeletal system",
      "Digestive system",
      "Respiratory system",
      "Uro-genital system",
      "Circulatory system and superficial lymph nodes",
      "Nervous system including the sense organs",
    ],
  },
  {
    code: "DVP-112",
    name: "Introduction to Livestock Management",
    semester: SEM1, year: YR1, creditHours: "1+2", hours: "100 Hours",
    outcomes: [
      "Explain principles of housing, feeding and routine management of farm animals",
      "Describe care of animals during parturition and calf rearing practices",
      "Identify signs of health and sickness in livestock and poultry",
      "Perform basic management practices including grooming, milking, restraint and biosecurity",
    ],
    theory: [
      "Terminology of cattle, buffalo, sheep, goat, equine, camel and pig management",
      "Classification based on utility; exotic and crossbred cattle",
      "Housing; parturition care; calf rearing; grooming, washing, dipping, casting, shearing; feeding",
      "Signs of health; care of sick animals",
      "Milking management; control of vices",
      "Poultry farming and backyard poultry; incubation and hatchery management; vaccination",
    ],
    practical: [
      "Handling and restraint of animals",
      "Milking; age determination",
      "Grooming and identification",
      "Debudding, drenching, casting",
      "Feeding practices",
      "Recording temperature, pulse and respiration",
      "Incubation, candling, brooding",
      "Litter management",
      "Biosecurity; cleaning and disinfection",
    ],
  },
  {
    code: "DVP-113",
    name: "Introduction to Livestock Breeds and Economic Traits",
    semester: SEM1, year: YR1, creditHours: "2+1", hours: "80 Hours",
    outcomes: [
      "Identify important breeds of livestock and poultry with their economic traits",
      "Explain principles of breeding and livestock improvement programmes",
      "Maintain and interpret basic livestock and breeding records",
      "Apply selection and culling principles for productive livestock management",
    ],
    theory: [
      "Breeds of cattle, buffalo, sheep, goat, horse, camel, pig and poultry",
      "Classification; economic traits; livestock records; culling",
      "Livestock improvement schemes; breeding concepts",
      "Inbreeding, line breeding, outbreeding and crossbreeding",
    ],
    practical: [
      "Breed identification",
      "Maintenance of breeding records",
      "Judging of animals",
      "Culling procedures",
      "Farm visits",
      "Analysis of breeding records",
      "Selection of dairy animals and breeding bulls",
    ],
  },
  {
    code: "DVP-114",
    name: "Basics of Animal Nutrition and Health",
    semester: SEM1, year: YR1, creditHours: "2+1", hours: "80 Hours",
    outcomes: [
      "Explain the role of nutrients in maintenance, growth and production",
      "Identify common feedstuffs, fodders and toxic plants",
      "Formulate simple rations for different classes of livestock",
      "Recognize nutritional deficiency diseases and suggest corrective measures",
    ],
    theory: [
      "Composition of animal body; carbohydrates, proteins, lipids",
      "Vitamins and minerals; feed additives; probiotics; toxic plants",
      "Nutrient requirements for maintenance, growth, reproduction and production",
      "Feeding principles; hay and silage",
      "Common feeds and fodders; nutritional deficiency diseases",
    ],
    practical: [
      "Ration computation",
      "Identification of feedstuffs and fodders",
      "Silage and hay making",
      "Identification of nutritional deficiency diseases",
    ],
  },
  {
    code: "DVP-115",
    name: "Basics of Animal Physiology",
    semester: SEM1, year: YR1, creditHours: "2+1", hours: "80 Hours",
    outcomes: [
      "Explain physiological functions of major organ systems",
      "Record and interpret basic physiological parameters",
      "Perform basic haematological and urine examination procedures",
      "Correlate physiological knowledge with health and disease conditions",
    ],
    theory: [
      "Physiological functions of organs",
      "Digestion in monogastric and ruminants; rumination",
      "Blood physiology",
      "Urinary and reproductive physiology; milk let-down",
    ],
    practical: [
      "Recording physiological parameters",
      "Haemoglobin estimation; RBC and WBC count",
      "ESR; blood collection and preservation",
      "Rumen motility; urine analysis",
    ],
  },
  {
    code: "DVP-116",
    name: "Elementary Microbiology",
    semester: SEM1, year: YR1, creditHours: "1+1", hours: "60 Hours",
    outcomes: [
      "Describe morphology, cultivation and classification of microorganisms",
      "Explain sources and modes of transmission of infections",
      "Perform basic microbiological techniques including staining and sterilization",
      "Apply principles of disinfection and antibiotic sensitivity in disease control",
    ],
    theory: [
      "Microscopy; morphology and cultivation of bacteria",
      "Sterilization and disinfection",
      "Fungi and viruses",
      "Sources and transmission of infection",
    ],
    practical: [
      "Slide preparation and staining",
      "Media preparation; sterilization",
      "Evaluation of disinfectants",
      "Antibiotic sensitivity test; sterility testing",
    ],
  },
  {
    code: "DVP-121",
    name: "Fundamentals of Computer and its Application",
    semester: SEM2, year: YR1, creditHours: "0+2", hours: "80 Hours",
    outcomes: [
      "Describe basic components and functioning of a computer",
      "Perform simple computer operations and data entry",
      "Apply computer applications in veterinary, farm and epidemiological data management",
      "Use basic software tools for data analysis and reporting",
    ],
    practical: [
      "Basics of computer including components; types of computers",
      "Hardware and software; types of memories, control units; inputs and outputs",
      "Execution of a programme; data types; simple programmes",
      "Use of computer in epidemiology, on farm and in veterinary hospital",
      "Graphics; keyboard basics — function keys, escape, control, shift, enter, cursor keys",
      "Simple operations and programmes; saving of data",
      "Entering biological data into computer",
      "Accessing data, analysis using database, retrieving data for printing, print controls",
      "ANOVA formulation; basics of networking",
    ],
  },
  {
    code: "DVP-122",
    name: "Basics of Clinical Pathology",
    semester: SEM2, year: YR1, creditHours: "1+2", hours: "100 Hours",
    outcomes: [
      "Define basic pathological terminology and disease processes",
      "Describe causes and mechanisms of cellular and circulatory disturbances",
      "Perform post-mortem examination and morbid sample collection techniques",
      "Conduct basic haematological and urine examinations",
    ],
    theory: [
      "Introduction to pathology — definitions and common terminologies (health, disease, etiology, pathogenesis, symptoms, lesions, diagnosis, incubation period, prognosis, morbidity, mortality, autopsy, biopsy)",
      "Causes of diseases; developmental disturbances, anomalies",
      "Disturbances of circulation; cell metabolism, necrosis, gangrene and post-mortem changes",
      "Disturbances in growth; inflammation — definition, etiology, classification and cardinal signs",
      "Immune reactions, hypersensitivity and autoimmunity",
    ],
    practical: [
      "Gross study of pathological specimens and recognition of gross lesions",
      "Post-mortem techniques; collection, preservation and dispatch of morbid materials",
      "Steps of post-mortem examination of large and small animals",
      "Post-mortem technique in medico-legal cases",
      "Diagnosis on the basis of post-mortem lesions",
      "Blood collection; smear making and staining; basic microscopy",
      "Complete blood count; urine examination",
    ],
  },
  {
    code: "DVP-123",
    name: "Elementary Parasitology",
    semester: SEM2, year: YR1, creditHours: "2+1", hours: "80 Hours",
    outcomes: [
      "Classify parasites and describe types of endo- and ecto-parasites",
      "Explain economic importance of parasitic diseases of livestock and poultry",
      "Identify parasites of zoonotic importance and describe their control measures",
      "Perform identification of parasites through basic laboratory techniques",
    ],
    theory: [
      "Introduction to parasitology; classification and types of parasites",
      "Introduction to endo- and ecto-parasites",
      "Economic importance of parasitic diseases of livestock and poultry",
      "Prevention, control and treatment of protozoan, trematode, cestode, nematode and arthropod diseases",
      "Parasites of zoonotic importance and their control",
      "Important insects, ticks and mites — life cycle, transmission and control",
    ],
    practical: [
      "Identification and demonstration of endo- and ecto-parasites",
      "Collection of samples; slide preparation from skin, faeces and blood",
      "Faecal examination and demonstration of eggs and oocysts",
      "Blood and skin scraping examination",
      "Blood smear preparation, staining and examination for haemoprotozoa",
      "Collection, fixation, preservation and mounting of protozoan parasites",
    ],
  },
  {
    code: "DVP-124",
    name: "Fundamentals of Pharmacology",
    semester: SEM2, year: YR1, creditHours: "1+2", hours: "100 Hours",
    outcomes: [
      "Define basic pharmacological terms and classify drugs and dosage forms",
      "Explain principles of drug compounding, dispensing and administration",
      "Interpret prescriptions using standard weights, measures and Latin abbreviations",
      "Identify, label and store common veterinary drugs",
    ],
    theory: [
      "Definitions — pharmacology, pharmacy, chemotherapy, therapeutics, toxicology, posology, metrology",
      "Sources and nature of drugs; routine pharmaceutical processes",
      "Dosage forms with suitable examples",
      "Principles of compounding and dispensing",
      "Routes of drug administration",
      "Pharmacy weights and measures — apothecary, metric and household systems",
      "Prescription reading — parts of prescription and Latin abbreviations",
      "Indigenous formulations, antiseptics and disinfectants in veterinary practice",
      "Antibacterial, antifungal, anthelmintic and antiprotozoal agents — classification and uses",
    ],
    practical: [
      "Identification of common drugs",
      "Labelling and storage of common drugs",
      "Compounding and dispensing of pharmacy preparations",
    ],
  },
  {
    code: "DVP-125",
    name: "Introduction to Clinical Biochemistry",
    semester: SEM2, year: YR1, creditHours: "2+1", hours: "80 Hours",
    outcomes: [
      "Describe biochemistry and metabolism of carbohydrates, lipids and proteins",
      "Explain biochemical processes under health and disease conditions",
      "Interpret diagnostic biochemical parameters used in disease diagnosis",
      "Perform basic biochemical laboratory tests",
    ],
    theory: [
      "Biochemistry of carbohydrates, lipids and proteins — classification, structure, function",
      "Metabolism in ruminants and non-ruminants",
      "Biochemical processes in health and disease — respiration, renal function, stress, shock, digestive disorders",
      "Diagnostic biochemistry — blood sugar, ketone bodies, BUN, uric acid, tissue enzymes",
    ],
    practical: [
      "Preparation and standardization of acids and alkalis",
      "pH determination; buffer preparation; colorimetric and electrometric pH",
      "Qualitative and quantitative tests for carbohydrates, fats and proteins",
      "Clinical sample tests — urine analysis, blood sugar, serum cholesterol, bilirubin, blood urea, glucose tolerance test",
    ],
  },
  {
    code: "DVP-126",
    name: "Introduction to Gynaecology and Obstetrics",
    semester: SEM2, year: YR1, creditHours: "2+1", hours: "80 Hours",
    outcomes: [
      "Describe structure and function of reproductive organs and estrous cycles",
      "Explain signs of heat, gestation and parturition in domestic animals",
      "Recognize infertility and common gynaecological and obstetrical conditions",
      "Perform pregnancy diagnosis and assist in basic obstetrical procedures",
    ],
    theory: [
      "Structure and function of reproductive organs of livestock and poultry",
      "Estrous cycles and reproductive patterns; signs of heat; gestation periods; signs of parturition",
      "Pregnancy diagnosis — principles and constraints; assistance in obstetrical cases",
      "Transport of abortion materials; nomenclature of gynaecological and obstetrical conditions",
      "Infertility — introduction and common causes",
      "Artificial insemination — semen collection, preservation and transport",
    ],
    practical: [
      "Rectal palpation of reproductive organs and pregnancy diagnosis",
      "Sterilization of glassware and wares for intrauterine medication",
      "Use of vaginoscope",
      "Preparation of obstetrical packs",
      "Assistance to parturient animals; care of newborn",
    ],
  },
  {
    code: "DVP-211",
    name: "Basics of Clinical Veterinary Medicine",
    semester: SEM3, year: YR2, creditHours: "2+1", hours: "80 Hours",
    outcomes: [
      "Identify diseased animals through gross physical examination",
      "Describe methods of drug, sera and vaccine administration and use of clinical instruments",
      "Explain general disease agents and principles of prevention and control",
      "Perform basic clinical diagnostic and sample collection procedures",
    ],
    theory: [
      "Identification of diseased animals by gross physical examination",
      "Examination methods and detection of abnormalities including physiological parameters",
      "Injection methods — drugs, sera, vaccines",
      "Clinical instruments — cannula, stomach tube, probang, teat syphon",
      "Disease agents — bacteria, viruses, fungi, parasites; systemic, metabolic and skin diseases",
      "Prevention and control principles; carcass utilization and disposal",
      "Elementary clinical diagnosis — history and general examination",
    ],
    practical: [
      "Identification of sick animals; handling and transport of diagnostic samples",
      "Cleaning of slides, glassware and laboratory equipment",
      "Staining techniques and blood smear preparation",
      "Care and use of microscopes",
      "Collection and processing of blood, urine, faeces, skin scrapings and milk",
      "Collection, preservation, fixation and dispatch of morbid material",
    ],
  },
  {
    code: "DVP-212",
    name: "Introduction to Andrology and Artificial Insemination",
    semester: SEM3, year: YR2, creditHours: "2+1", hours: "80 Hours",
    outcomes: [
      "Explain growth, puberty and factors affecting sexual maturity in male animals",
      "Describe causes, diagnosis and treatment of male infertility",
      "Explain principles, methods and techniques of artificial insemination",
      "Perform semen collection, evaluation and preservation techniques",
    ],
    theory: [
      "Growth, puberty, sexual maturity, libido; factors affecting maturity and sex drive in bulls; male sexual behaviour",
      "Male infertility — forms, factors, diagnosis and treatment",
      "Male genital diseases, abnormalities, malformations; coital injury and infections",
      "A.I. — history, development, advantages and limitations",
      "Semen collection methods in various species; A.I. technique",
      "Semen quality and quantity factors; evaluation tests",
      "Semen extension, preservation at different temperatures, storage and shipment",
      "Semen metabolism and biochemistry",
    ],
    practical: [
      "Artificial vagina preparation; semen collection, evaluation, dilution and preservation",
      "Semen freezing; insemination with liquid and frozen semen",
      "Planning and organization of an A.I. centre",
      "Selection, care, training and maintenance of breeding bulls; recording systems",
      "Care, sterilization, storage and upkeep of A.I. equipment",
    ],
  },
  {
    code: "DVP-213",
    name: "Introduction to Animal Husbandry Extension",
    semester: SEM3, year: YR2, creditHours: "1+1", hours: "60 Hours",
    outcomes: [
      "Explain principles and objectives of veterinary and animal husbandry extension",
      "Describe extension teaching methods and the communication process",
      "Identify qualities and roles of extension workers",
      "Apply audio-visual and demonstration techniques in extension programmes",
    ],
    theory: [
      "Animal husbandry extension and rural welfare; community development and rural sociology",
      "Principles and objectives of veterinary and animal husbandry extension",
      "Qualities of extension workers; extension teaching methods; extension programmes; motivation",
      "Scope of extension; dairying as an instrument of change in rural India",
      "Communication process — response, empathy, homophily, heterophily, fidelity, perception, system",
    ],
    practical: [
      "Uses and principles of audio-visual equipment",
      "Use of written literature",
      "Group discussion and demonstration of husbandry techniques to livestock owners",
      "Need analysis and awareness campaigns",
      "Identifying key communicators; motivating individuals for programmes",
      "LCD, projector and PPT preparation",
      "Organizing vaccination camps, farmers' meets and exhibitions; report writing",
    ],
  },
  {
    code: "DVP-214",
    name: "Preliminary Surgical Procedures and Care",
    semester: SEM3, year: YR2, creditHours: "1+2", hours: "100 Hours",
    outcomes: [
      "Describe general surgical principles and pre-/post-operative care",
      "Classify common superficial surgical ailments and wounds",
      "Explain first-aid management of fractures, bloat and haemorrhage",
      "Perform basic surgical instrument handling and wound dressing",
    ],
    theory: [
      "Classification and development of veterinary surgery; general surgical principles",
      "Pre-operative and post-operative care and management",
      "Sutures and suturing materials; common surgical terms",
      "Sterilization in surgical practice",
      "Superficial surgical ailments — abscess, fistula, sinus, wounds, gangrene, cyst, burn, haematoma, tumor, hernia",
      "Surgical affections of muscles and their treatment",
      "Wounds — classification, symptoms, diagnosis and treatment",
      "Fracture, dislocation and joint affections; dental care; hoof management",
      "First aid — fracture, bloat, haemorrhage and post-operative management",
      "Antiseptics, lotions, ointments and tinctures in surgical practice",
    ],
    practical: [
      "Identification of surgical instruments",
      "Physical restraint of animals for surgery",
      "Pack preparation for autoclaving and sterilization",
      "Suture materials and sutures; operation room discipline",
      "Wound dressing and bandaging",
      "Burdizzo castration, tattooing, dehorning; preparing animals for surgery",
      "Counter-irritants, heat and cold fomentation; bandage types and application",
    ],
  },
  {
    code: "DVP-215",
    name: "Community Veterinary Pharmacy",
    semester: SEM3, year: YR2, creditHours: "2+1", hours: "80 Hours",
    outcomes: [
      "Explain epidemiological concepts and patterns of disease distribution",
      "Describe zoonotic diseases and regulations related to biomaterials",
      "Explain environmental factors affecting animal and human health",
      "Perform sample collection and participate in disease control programmes",
    ],
    theory: [
      "Epidemiology and preventive medicine — definitions, applications, ecological concepts",
      "Disease process and spread; distribution patterns; epidemic investigation",
      "Livestock and poultry diseases — etiology, epidemiology, diagnosis, prevention, control and eradication",
      "Zoonotic diseases; biomaterial handling, import and export regulations",
      "Environment — components, animal ecology; global and Indian status",
      "Environmental pollution and pollutants; air, sewage and hazardous waste management",
      "Water supply sources, contamination and prevention",
    ],
    practical: [
      "Collection, preservation and dispatch of samples (blood, urine, faeces, skin, fluids)",
      "Culture and sensitivity; demonstration of fungi and pathogens",
      "Screening tests; mass diagnostic campaigns",
      "Vaccination and disease control programmes in the field",
      "Water purification, sewage disposal, carcass disposal demonstrations",
    ],
  },
  {
    code: "DVP-216",
    name: "Basic Concepts of Pharmacy and Toxicology",
    semester: SEM3, year: YR2, creditHours: "2+1", hours: "80 Hours",
    outcomes: [
      "Explain pharmacy fittings, apparatus and pharmaceutical calculations",
      "Describe indigenous drugs and their pharmacological and therapeutic uses",
      "Explain principles of toxicology and factors modifying toxicity",
      "Prepare common pharmacy preparations and identify toxic substances",
    ],
    theory: [
      "Pharmacy — fittings, apparatus, labelling, poison custody, drug weighing, compounding",
      "Metrology — weights and measures; pharmacy calculations, processes, incompatibilities",
      "Drug sources, composition and pharmaceutical preparations",
      "Indigenous drugs — alkaloids, glycosides, resins, gums, tannins, fixed and volatile oils",
      "Plant drugs with proven efficacy in livestock and poultry ailments",
      "Popular indigenous drugs — antiseptics, antifungals, anthelmintics, repellents",
      "Toxicology — definitions, poison sources, mode of action",
      "Toxicity modifiers and treatment of poisoning",
    ],
    practical: [
      "Pharmacy preparations — potassium permanganate, Lugol's iodine, trypan blue, gentian violet, tinctures, ointments, powders, mixtures, liniments",
      "Demonstration of toxic weeds and plants",
      "Detection of arsenic, antimony, lead, mercury, nitrates, nitrites, fluoride",
      "Detection of alkaloids, glycosides, tannins, resins",
      "Insecticidal and drug toxicity demonstrations with treatment",
    ],
  },
  {
    code: "DVP-221",
    name: "Veterinary Pharmacist Jurisprudence",
    semester: SEM4, year: YR2, creditHours: "1+0", hours: "20 Hours",
    outcomes: [
      "Explain origin and evolution of pharmaceutical legislation in India",
      "Describe key provisions of the Pharmacy Act 1948 and the Drugs and Cosmetics Act 1940",
      "Explain licensing, inspection and labelling requirements under the drug schedules",
      "Describe laws relating to animals, poisons and public health",
    ],
    theory: [
      "Origin and nature of pharmaceutical legislation in India — scope and objectives",
      "Evolution of the 'Concept of Pharmacy' in health care; professional ethics",
      "Pharmacy Act 1948; Drugs and Cosmetics Act 1940",
      "Inspector powers, sampling procedures and licensing formalities",
      "Pharmacy infrastructure requirements",
      "Drug schedules — C, C1, F, G, J, H, P, X; labelling and storage",
      "Poison Act 1919; IPC provisions relating to animals",
      "Glanders and Farcy Act 1899; Dourine Act 1910; Prevention of Cruelty to Animals Act 1960",
      "Public health offences; poisons and drug adulteration laws; Livestock Importation Act; evidence, liability and insurance",
    ],
  },
  {
    code: "DVP-222",
    name: "Practical Laboratory Diagnosis",
    semester: SEM4, year: YR2, creditHours: "0+3", hours: "120 Hours",
    outcomes: [
      "Collect, preserve and process biological samples for disease diagnosis",
      "Perform clinical examination of blood and urine of diseased animals",
      "Interpret haematological and urine examination results for disease confirmation",
      "Correlate laboratory findings with clinical findings for diagnosis",
    ],
    practical: [
      "Collection, preservation and processing of biological samples",
      "Clinical examination of blood and urine; interpretation principles",
      "Value of clinical pathology in disease confirmation and as legal evidence",
      "Diseases confirmed through haematological examination",
      "Diseases confirmed through urine and body fluid examination",
      "Clinico-laboratory correlation and result interpretation",
    ],
  },
  {
    code: "DVP-223",
    name: "Clinical Pharmacy",
    semester: SEM4, year: YR2, creditHours: "0+3", hours: "120 Hours",
    outcomes: [
      "Explain the scope and definitions of clinical pharmacy practice",
      "Describe drug interactions and bioavailability concepts",
      "Prepare pharmacy preparations for veterinary hospital application",
      "Write prescriptions using standard veterinary terminology",
    ],
    practical: [
      "Clinical pharmacy practices — definitions and scope",
      "Drug interactions; clinical toxicity; bioavailability",
      "Pharmacy preparations for veterinary hospital use",
      "Veterinary practice terminology; prescription writing for country medicines",
    ],
  },
  {
    code: "DVP-224",
    name: "Veterinary Hospital Pharmacy",
    semester: SEM4, year: YR2, creditHours: "0+3", hours: "120 Hours",
    outcomes: [
      "Maintain records and reports of veterinary hospital operations",
      "Manage instruments, medicines and drug distribution systems",
      "Handle sick animals and assist with medication and post-operative care",
      "Assist in vaccination, semen handling and pregnancy diagnosis procedures",
    ],
    practical: [
      "Hospital records maintenance; report preparation and compilation; data recording and analysis",
      "Instruments — acquaintance, management and utilization",
      "Medicines and preparations; drug distribution system",
      "Animal housing and sanitation; handling sick animals; medication",
      "Post-operative management; vaccination",
      "Semen handling; artificial insemination and pregnancy diagnosis",
    ],
  },
  {
    code: "DVP-225",
    name: "Farm Management Practices",
    semester: SEM4, year: YR2, creditHours: "0+3", hours: "120 Hours",
    outcomes: [
      "Maintain dairy farm records and routine documentation",
      "Compile and prepare farm performance reports",
      "Apply routine dairy farm management practices",
      "Analyze farm data for operational decision-making",
    ],
    practical: [
      "Preparation and maintenance of dairy records",
      "Routine dairy farm work and record keeping",
      "Preparation and compilation of reports and proforma",
    ],
  },
  {
    code: "DVP-226",
    name: "Exposure to Polyclinics",
    semester: SEM4, year: YR2, creditHours: "0+3", hours: "120 Hours",
    outcomes: [
      "Record physiological parameters and perform drug administration techniques",
      "Practice compounding and dispensing of veterinary drugs",
      "Assist with gynaecological, surgical and X-ray procedures",
      "Perform basic clinical procedures including castration and wound dressing",
    ],
    practical: [
      "TPR recording; drug administration methods; compounding and dispensing practice",
      "Trocar and cannula, stomach tube and probang; intra-mammary infusions",
      "Wound dressing; preparation of ointments, tinctures, lotions and solutions",
      "Gynaecological and surgical instruments — uses and sterilization",
      "Gynaecological and surgical demonstrations; surgical pack handling",
      "X-ray procedure introduction; clinical material collection",
      "Burdizzo castration of calf, sheep and goat",
    ],
  },
];

const bullets = (items: string[]) => items.map((t) => `• ${t}`).join("\n");

async function main() {
  console.log("Seeding DVP (Uttar Pradesh) skeleton...");

  let programme = await prisma.programme.findFirst({ where: { name: "DVP" } });
  if (!programme) {
    programme = await prisma.programme.create({
      data: {
        name: "DVP",
        fullName: "Diploma in Veterinary Pharmacy (Uttar Pradesh)",
        yearType: "semester",
      },
    });
  } else {
    programme = await prisma.programme.update({
      where: { id: programme.id },
      data: {
        fullName: "Diploma in Veterinary Pharmacy (Uttar Pradesh)",
        yearType: "semester",
      },
    });
  }

  // Idempotent: wipe DVP subjects/chapters only (cascade), then recreate.
  await prisma.subject.deleteMany({ where: { programmeId: programme.id } });

  let chapterCount = 0;
  for (const c of courses) {
    const description = [
      `Course: ${c.code} — ${c.name} (${c.semester}, ${c.hours}, Credits ${c.creditHours})`,
      "",
      "Course Outcomes:",
      ...c.outcomes.map((o, i) => `CO${i + 1}: ${o}`),
    ].join("\n");

    const subject = await prisma.subject.create({
      data: {
        code: c.code,
        name: c.name,
        year: c.year,
        semester: c.semester,
        creditHours: c.creditHours,
        description,
        programmeId: programme.id,
      },
    });

    let unit = 0;
    if (c.theory && c.theory.length > 0) {
      unit += 1;
      await prisma.chapter.create({
        data: {
          title: `${c.name} — Theory`,
          content: `Theory topics (${c.code}):\n${bullets(c.theory)}\n\n(Detailed content coming soon)`,
          unitNumber: unit,
          courseCode: c.code,
          creditHours: c.creditHours,
          type: "THEORY",
          subjectId: subject.id,
        },
      });
      chapterCount += 1;
    }
    if (c.practical && c.practical.length > 0) {
      unit += 1;
      await prisma.chapter.create({
        data: {
          title: `${c.name} — Practical`,
          content: `Practical topics (${c.code}):\n${bullets(c.practical)}\n\n(Detailed content coming soon)`,
          unitNumber: unit,
          courseCode: c.code,
          creditHours: c.creditHours,
          type: "PRACTICAL",
          subjectId: subject.id,
        },
      });
      chapterCount += 1;
    }
  }

  console.log(`Done: 1 programme, ${courses.length} subjects, ${chapterCount} chapters.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
