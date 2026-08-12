import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// ─── Helpers ────────────────────────────────────────────────────────────────

function chapters(unitNumber: number, items: { title: string; content: string }[]) {
  return items.map((c) => ({ ...c, unitNumber }));
}

// ─── AHDP Subject Data ──────────────────────────────────────────────────────

const AHDP_SUBJECTS = [
  // ═══════════════════════════════════════════════════════════════════════════
  // FIRST YEAR (Semester I & II)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    code: "AHDP-VAN-101",
    name: "Introductory Veterinary Anatomy",
    year: "1st Year",
    semester: "1st Semester",
    chapters: [
      ...chapters(1, [
        { title: "Introduction to Veterinary Anatomy", content: "Definition, scope, history and branches of anatomy. Comparative anatomy across domestic species. Anatomical terminology, planes, directions and body cavities used in veterinary science." },
        { title: "General Histology and Tissue Types", content: "Epithelial, connective, muscular and nervous tissue types. Microscopic structure of tissues, staining techniques and tissue identification methods." },
        { title: "Cell Biology and Ultrastructure", content: "Cell structure, organelles, cell division and cell cycle. Membrane transport, intracellular signalling and cellular specialisation in veterinary species." },
      ]),
      ...chapters(2, [
        { title: "Skeletal System – Axial Skeleton", content: "Bones of the skull, vertebral column, ribs and sternum across domestic animals. Osteology, bone development and species-specific skeletal features." },
        { title: "Skeletal System – Appendicular Skeleton", content: "Bones of the fore limb and hind limb. Joint types, arthrology and synovial joint structures. Comparative limb anatomy in quadrupeds." },
        { title: "Myology – Muscles of the Body", content: "Major skeletal muscles, their origins, insertions and actions. Muscular compartments and fascial planes. Muscle fibre types and functional anatomy." },
        { title: "Integumentary System", content: "Skin, hair, horns, hooves, claws and glands. Integumentary structures in different species and their functional significance." },
      ]),
      ...chapters(3, [
        { title: "Digestive System Anatomy", content: "Comparative anatomy of the gastrointestinal tract in monogastric and ruminant animals. Mouth, pharynx, oesophagus, stomach, intestines and associated glands." },
        { title: "Respiratory System Anatomy", content: "Nasal cavity, larynx, trachea, bronchi and lungs. Comparative respiratory anatomy across species, including avian air sac system." },
        { title: "Splanchnology – Associated Organs", content: "Liver, spleen, pancreas and mesentery. Peritoneal cavity, omentum and peritoneal reflections." },
      ]),
      ...chapters(4, [
        { title: "Reproductive System Anatomy", content: "Male and female reproductive organs across domestic species. Testes, epididymis, vas deferens, penis, ovaries, oviducts, uterus, vagina and external genitalia." },
        { title: "Nervous System – Central Nervous System", content: "Brain and spinal cord anatomy. Cerebrum, cerebellum, brainstem, meninges, ventricles and spinal cord segments." },
        { title: "Nervous System – Peripheral Nervous System", content: "Cranial nerves, spinal nerves and autonomic nervous system. Ganglia, nerve plexuses and peripheral nerve distribution." },
        { title: "Cardiovascular System", content: "Heart anatomy, chambers, valves and conduction system. Great vessels, arterial and venous systems across species." },
      ]),
    ],
  },
  {
    code: "AHDP-VPH-101",
    name: "Introductory Veterinary Physiology & Biochemistry",
    year: "1st Year",
    semester: "1st Semester",
    chapters: [
      ...chapters(1, [
        { title: "Introduction to Physiology and Cell Physiology", content: "Principles of homeostasis, cell membrane potentials, ion channels and nerve impulse generation. Resting membrane potential and action potential in excitable tissues." },
        { title: "Body Fluids and Composition", content: "Body water distribution, intracellular and extracellular fluid compartments. Osmolality, tonicity, electrolyte balance and acid-base physiology." },
        { title: "Haematology – Blood and its Components", content: "Plasma composition, erythrocytes, leucocytes and platelets. Haemoglobin, haematocrit, erythropoiesis and blood typing in domestic animals." },
      ]),
      ...chapters(2, [
        { title: "Digestive Physiology", content: "Ingestion, motility, secretion, digestion and absorption across the gastrointestinal tract. Ruminant fermentation, monogastric digestion and species variations." },
        { title: "Respiratory Physiology", content: "Ventilation, gas exchange, oxygen and carbon dioxide transport. Respiratory regulation, pulmonary function tests and adaptation to altitude." },
        { title: "Metabolism of Nutrients", content: "Carbohydrate, lipid and protein metabolism. Energy balance, gluconeogenesis, lipogenesis and amino acid metabolism in domestic animals." },
      ]),
      ...chapters(3, [
        { title: "Cardiovascular Physiology", content: "Cardiac cycle, heart rate regulation, cardiac output, blood pressure and haemodynamics. Coronary circulation and cardiac electrophysiology." },
        { title: "Renal Physiology", content: "Glomerular filtration, tubular reabsorption and secretion. Counter-current mechanism, urine formation and concentration. Renal regulation of acid-base balance." },
        { title: "Urinary System Function", content: "Bladder function, micturition reflex, clearance tests and renal physiology across species." },
      ]),
      ...chapters(4, [
        { title: "Reproductive Physiology – Male", content: "Spermatogenesis, testicular function, hormonal regulation and semen characteristics. Puberty, sexual behaviour and seasonal breeding patterns." },
        { title: "Reproductive Physiology – Female", content: "Oogenesis, oestrus cycle, hormonal regulation and follicular dynamics. Pregnancy recognition, placental function and parturition." },
        { title: "Lactation Physiology", content: "Mammary gland development, lactogenesis, milk composition and ejection reflex. Hormonal control of lactation and milking physiology." },
        { title: "Endocrine Physiology", content: "Hypothalamic-pituitary axis, thyroid, adrenal and pancreatic hormones. Hormonal regulation of metabolism, growth and reproduction." },
      ]),
      ...chapters(5, [
        { title: "Biomolecules – Structure and Function", content: "Carbohydrates, lipids, proteins and nucleic acids. Structure-function relationships, conformational changes and biochemical classification." },
        { title: "Enzymes and Enzyme Kinetics", content: "Enzyme classification, mechanisms of catalysis, Michaelis-Menten kinetics. Enzyme regulation, allosteric control and clinical enzymology." },
        { title: "Biochemical Techniques", content: "Spectrophotometry, chromatography, electrophoresis and centrifugation. Clinical biochemistry laboratory methods and quality control." },
      ]),
      ...chapters(6, [
        { title: "Carbohydrate Metabolism", content: "Glycolysis, TCA cycle, oxidative phosphorylation and pentose phosphate pathway. Gluconeogenesis, glycogen metabolism and blood glucose regulation." },
        { title: "Lipid Metabolism", content: "Beta-oxidation, ketogenesis, lipogenesis and cholesterol metabolism. Fatty acid synthesis, phospholipid metabolism and lipoproteins." },
        { title: "Protein and Amino Acid Metabolism", content: "Protein synthesis, transamination, deamination and urea cycle. Nitrogen balance and amino acid catabolism." },
      ]),
    ],
  },
  {
    code: "AHDP-VAM-101",
    name: "Introductory Animal Management",
    year: "1st Year",
    semester: "2nd Semester",
    chapters: [
      ...chapters(1, [
        { title: "Livestock Breeds – Cattle", content: "Indigenous and exotic cattle breeds, their characteristics and adaptability. Bos indicus vs Bos taurus breeds and crossbreeding programs." },
        { title: "Livestock Breeds – Buffalo, Sheep and Goat", content: "Major buffalo breeds, sheep breeds for wool and meat, goat breeds for dairy and fibre. Breed identification and selection criteria." },
        { title: "General Management Practices", content: "Daily care routines, feeding schedules, health monitoring and record keeping. Basic principles of livestock husbandry." },
      ]),
      ...chapters(2, [
        { title: "Housing and Shelter Design", content: "Types of animal housing, layout planning, ventilation, lighting and temperature control. Space requirements for different species." },
        { title: "Animal Handling and Restraint", content: "Safe handling techniques, physical restraint methods, use of squeeze chutes and tilt tables. Low-stress handling and animal welfare." },
        { title: "Farm Infrastructure", content: "Feed storage, water supply, waste management and fencing. Farm planning and infrastructure development for different livestock operations." },
      ]),
      ...chapters(3, [
        { title: "Cattle Management", content: "Feeding management, milking routines, breeding management and record keeping for dairy and beef cattle. Seasonal management practices." },
        { title: "Buffalo Management", content: "Buffalo-specific husbandry practices, wallowing, heat stress management and dairy buffalo production systems." },
        { title: "Health Management in Cattle", content: "Vaccination schedules, common disease prevention, biosecurity measures and quarantine protocols for cattle operations." },
      ]),
      ...chapters(4, [
        { title: "Sheep and Goat Management", content: "Feeding, housing, breeding and health care for small ruminants. Flock management, shearing and kid/lamb rearing practices." },
        { title: "Poultry Management", content: "Broiler and layer management, housing systems, feeding programs and environmental control in poultry production." },
        { title: "Swine Management", content: "Pig production systems, feeding, breeding and farrowing management. Environmental requirements and health programs for swine." },
      ]),
    ],
  },
  {
    code: "AHDP-AHE-101",
    name: "Animal Husbandry Extension",
    year: "1st Year",
    semester: "2nd Semester",
    chapters: [
      ...chapters(1, [
        { title: "Fundamentals of Extension Education", content: "Definition, objectives and philosophy of extension education. History of agricultural extension, extension principles and teaching-learning process." },
        { title: "Rural Sociology and Development", content: "Rural social structure, social groups, community development and leadership. Role of extension in rural livelihood improvement." },
        { title: "Extension Philosophy and Approaches", content: "Farmers first approach, participatory rural appraisal and community-driven development. Adult education principles and extension methodologies." },
      ]),
      ...chapters(2, [
        { title: "Extension Programme Planning", content: "Needs assessment, programme development, implementation and evaluation. Logical framework approach and result-based management in extension." },
        { title: "Extension Teaching Methods", content: "Individual, group and mass methods of extension teaching. Farm demonstrations, training, exhibitions, farm visits and field days." },
        { title: "Training and Capacity Building", content: "Training need assessment, training design, delivery and evaluation. Capacity building of farmers, extension workers and rural youth." },
      ]),
      ...chapters(3, [
        { title: "Communication in Extension", content: "Communication models, barriers and strategies. Verbal, non-verbal and visual communication in extension. Interpersonal communication skills." },
        { title: "Mass Media and ICT in Extension", content: "Role of radio, television, print media and social media in extension. ICT-based extension – mobile apps, e-learning and digital platforms." },
        { title: "Audio-Visual Aids and Presentation", content: "Use of charts, models, posters, video and multimedia in extension. Effective presentation and public speaking skills for extension professionals." },
      ]),
      ...chapters(4, [
        { title: "Livestock Entrepreneurship", content: "Entrepreneurship development, business planning and feasibility studies. Value chain analysis and market linkages for livestock products." },
        { title: "Self-Help Groups and Cooperatives", content: "Formation and management of self-help groups, cooperatives and farmer producer organisations. Microfinance and credit access for livestock farmers." },
        { title: "Extension Programme Evaluation", content: "Impact assessment, monitoring and evaluation methods. Cost-benefit analysis of extension programmes and outcome measurement." },
      ]),
    ],
  },
  {
    code: "AHDP-ABG-101",
    name: "Introductory Animal Genetics",
    year: "1st Year",
    semester: "2nd Semester",
    chapters: [
      ...chapters(1, [
        { title: "Introduction to Genetics", content: "Mendelian laws of inheritance, gene concept, multiple alleles and gene interactions. Chromosomal basis of inheritance and chromosomal aberrations." },
        { title: "Quantitative Genetics", content: "Polygenic inheritance, additive and non-additive genetic variance. Heritability, repeatability and genetic correlation concepts." },
        { title: "Population Genetics", content: "Hardy-Weinberg equilibrium, gene and genotypic frequencies. Factors changing gene frequencies – selection, drift, mutation and migration." },
      ]),
      ...chapters(2, [
        { title: "Principles of Animal Breeding", content: "Selection methods – mass, progeny, sib and combined selection. Selection intensity, genetic progress and breeding value estimation." },
        { title: "Mating Systems", content: "Inbreeding, linebreeding, outcrossing and crossbreeding. Heterosis and its exploitation in livestock improvement programs." },
        { title: "Breeding Programmes", content: "Centralized recording, genetic evaluation and national breeding programmes. Sire selection, dam selection and breeding value prediction." },
      ]),
      ...chapters(3, [
        { title: "Reproductive Technologies in Breeding", content: "Artificial insemination, embryo transfer, multiple ovulation and embryo transfer (MOET). In-vitro fertilisation and embryo biotechnology." },
        { title: "Molecular Genetics and Markers", content: "DNA markers, RFLP, microsatellites, SNP and QTL mapping. Marker-assisted selection and genomic selection in livestock." },
        { title: "Genomic Selection", content: "Genome-wide association studies, genomic estimated breeding values. Reference populations, SNP chips and implementation of genomic selection." },
      ]),
      ...chapters(4, [
        { title: "Breeding for Production Traits", content: "Selection for milk production, growth rate, wool production and reproductive efficiency. Index selection and multi-trait selection." },
        { title: "Breeding for Disease Resistance", content: "Genetic resistance to diseases, breeding for immune competence. Genetic disorders and their control in livestock populations." },
        { title: "Conservation of Animal Genetic Resources", content: "Breed conservation strategies, in-situ and ex-situ conservation. Genetic diversity assessment and management of endangered breeds." },
      ]),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECOND YEAR (Semester III & IV)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    code: "AHDP-VPH-201",
    name: "Introductory Veterinary Pharmacology",
    year: "2nd Year",
    semester: "3rd Semester",
    chapters: [
      ...chapters(1, [
        { title: "Introduction to Pharmacology", content: "Drug nomenclature, pharmacokinetics – absorption, distribution, metabolism and excretion. Pharmacodynamics – drug-receptor interactions, dose-response relationships." },
        { title: "Drug Administration and Dosage", content: "Routes of drug administration, bioavailability, first-pass effect. Dosage calculations for different species and routes of administration." },
        { title: "Autonomic Pharmacology", content: "Cholinergic and adrenergic drugs, autonomic ganglia and neuromuscular junction pharmacology. Parasympathomimetics, sympathomimetics and their antagonists." },
      ]),
      ...chapters(2, [
        { title: "Drugs Acting on CNS", content: "Sedatives, tranquillisers, general anaesthetics, analgesics and anticonvulsants. NSAIDs and their use in veterinary practice." },
        { title: "Drugs Acting on CVS and Kidney", content: "Cardiac glycosides, antiarrhythmics, vasodilators and diuretics. Cardiovascular drugs used in veterinary emergencies." },
        { title: "Drugs Acting on Blood and GI Tract", content: "Haematinics, anticoagulants, antiemetics, prokinetics and purgatives. Gastrointestinal pharmacology in domestic animals." },
      ]),
      ...chapters(3, [
        { title: "Antimicrobial Agents", content: "Antibiotics – classification, mechanisms of action and resistance. Sulfonamides, quinolones, tetracyclines and aminoglycosides in veterinary use." },
        { title: "Antifungal and Antiviral Agents", content: "Antifungal drugs, antiviral chemotherapy and antiprotozoal agents. Coccidiostats and anthelmintics for parasitic infections." },
        { title: "Chemotherapy of Parasitic Diseases", content: "Anthelmintics – benzimidazoles, macrocyclic lactones, imidazothiazoles. Ectoparasiticides – organophosphates, pyrethroids and newer compounds." },
      ]),
      ...chapters(4, [
        { title: "Applied Pharmacology", content: "Drug interactions, adverse drug reactions and withdrawal periods. Pharmacovigilance and rational drug use in food-producing animals." },
        { title: "Veterinary Drug Regulations", content: "Drug schedules, prescription requirements and controlled substances. Regulatory frameworks for veterinary drug use and antimicrobial stewardship." },
        { title: "Pharmacology of Biologicals", content: "Vaccines, antisera, allergens and immunomodulators. Biological products used in veterinary preventive medicine." },
      ]),
    ],
  },
  {
    code: "AHDP-VME-201",
    name: "Introductory Veterinary Clinical Medicine",
    year: "2nd Year",
    semester: "3rd Semester",
    chapters: [
      ...chapters(1, [
        { title: "Clinical Examination and History Taking", content: "Methods of clinical examination – inspection, palpation, percussion, auscultation. History taking, physical examination records and clinical documentation." },
        { title: "Disease Diagnosis Methods", content: "Laboratory diagnostic methods, blood sampling, sample collection and transport. Clinical pathology – haematology, biochemistry and urinalysis basics." },
        { title: "General Principles of Treatment", content: "Fluid therapy, electrolyte correction, supportive care and symptomatic treatment. Principles of rational therapeutics in veterinary medicine." },
      ]),
      ...chapters(2, [
        { title: "Infectious Diseases of Cattle – Bacterial", content: "Anthrax, blackleg, brucellosis, tuberculosis and Johne's disease. Clinical signs, diagnosis, treatment and control measures." },
        { title: "Infectious Diseases of Cattle – Viral", content: "Foot-and-mouth disease, rinderpest, bovine viral diarrhoea and infectious bovine rhinotracheitis. Vaccination and disease prevention." },
        { title: "Metabolic Diseases of Cattle", content: "Milk fever, ketosis, ruminal acidosis, bloat and grass tetany. Clinical features, emergency treatment and prevention strategies." },
      ]),
      ...chapters(3, [
        { title: "Diseases of Small Ruminants", content: "Clostridial diseases, caseous lymphadenitis, foot rot, pneumonia and pregnancy toxemia in sheep and goats." },
        { title: "Diseases of Swine", content: "African swine fever, classical swine fever, erysipelas, porcine reproductive and respiratory syndrome and parvovirus infection." },
        { title: "Poultry Diseases", content: "Newcastle disease, infectious bursal disease, Marek's disease, fowl pox and coccidiosis in poultry." },
      ]),
      ...chapters(4, [
        { title: "Emergency Medicine", content: "Acute haemorrhage, shock, heat stroke, poisoning and trauma management. Emergency drugs, doses and critical care protocols." },
        { title: "Common Toxicities", content: "Plant poisoning, organophosphate toxicity, heavy metal poisoning and mycotoxin toxicosis. Clinical signs and antidotal treatment." },
        { title: "Wound Management and Bandaging", content: "Wound classification, cleaning, debridement, suturing and bandaging techniques. Principles of wound healing and infection control." },
      ]),
    ],
  },
  {
    code: "AHDP-VAN-201",
    name: "Introductory Animal Nutrition",
    year: "2nd Year",
    semester: "3rd Semester",
    chapters: [
      ...chapters(1, [
        { title: "Principles of Animal Nutrition", content: "Nutrient classes, functions and requirements. Nutrient digestion and absorption mechanisms. Factors affecting nutrient utilization in domestic animals." },
        { title: "Water and Energy Nutrition", content: "Role of water in body functions, water requirements and quality. Energy concepts, gross, digestible, metabolisable and net energy systems." },
        { title: "Carbohydrate and Lipid Nutrition", content: "Structural and non-structural carbohydrates, fibre digestion in ruminants. Lipid digestion, absorption and metabolic roles in different species." },
      ]),
      ...chapters(2, [
        { title: "Protein and Amino Acid Nutrition", content: "Crude protein, digestible protein and metabolisable protein concepts. Amino acid requirements, limiting amino acids and protein evaluation systems." },
        { title: "Mineral and Vitamin Nutrition", content: "Macro and micro mineral functions, deficiencies and supplementation. Fat-soluble and water-soluble vitamins, sources and requirements." },
        { title: "Feedstuff Classification and Evaluation", content: "Classification of feeds – roughages, concentrates and supplements. Feed analysis, proximate analysis and feed quality assessment methods." },
      ]),
      ...chapters(3, [
        { title: "Nutrient Requirements of Livestock", content: "Nutrient requirements for growth, maintenance, reproduction, lactation and work. NRC guidelines and feeding standards for different species." },
        { title: "Balanced Ration Formulation", content: "Principles of ration formulation, Pearson's square method, linear programming and computer-based ration balancing. Least-cost ration formulation." },
        { title: "Feed Supplements and Additives", content: "Probiotics, prebiotics, enzymes, growth promoters and feed preservatives. Feed additives – benefits, regulation and proper usage." },
      ]),
      ...chapters(4, [
        { title: "Fodder Production", content: "Annual and perennial fodder crops, pasture management, hay and silage making. Cultivation practices for major fodder species." },
        { title: "Feed Storage and Preservation", content: "Grain storage, silage fermentation, hay making and feed preservation methods. Preventing feed spoilage and mycotoxin contamination." },
        { title: "Feeding Management Practices", content: "Feeding systems, feed conversion efficiency, feed intake regulation and practical feeding of different livestock species." },
      ]),
    ],
  },
  {
    code: "AHDP-VSU-201",
    name: "Minor Veterinary Surgery",
    year: "2nd Year",
    semester: "4th Semester",
    chapters: [
      ...chapters(1, [
        { title: "Principles of Asepsis and Surgical Technique", content: "Sterilization methods, aseptic preparation, surgical scrub and draping. Wound healing phases and factors affecting healing." },
        { title: "Anaesthesia – Local and Regional", content: "Local anesthetics, nerve blocks, epidural anaesthesia and regional techniques. Anaesthetic equipment and monitoring." },
        { title: "General Anaesthesia in Animals", content: "Pre-anaesthetic medication, induction agents, maintenance anaesthesia and recovery. Anaesthetic protocols for different species." },
      ]),
      ...chapters(2, [
        { title: "Wound Surgery", content: "Wound types, primary closure, delayed primary closure and second intention healing. Skin grafting, flap techniques and wound drainage." },
        { title: "Suturing Techniques", content: "Suture materials, suture patterns – simple interrupted, mattress, cruciate, continuous. Knot tying and instrument handling." },
        { title: "Abscess and Cyst Surgery", content: "Incision and drainage of abscesses, removal of sebaceous cysts, hygromas and synovial cysts. Aural haematoma repair." },
      ]),
      ...chapters(3, [
        { title: "Castration and Dehorning", content: "Open and closed castration techniques, elastrator band castration. Dehorning methods, disbudding and polled genetics." },
        { title: "Tail Docking and Enucleation", content: "Tail docking procedures, enucleation of the eye and third eyelid flap surgery. Minor soft tissue surgeries in practice." },
        { title: "Dental and Oral Surgery", content: "Dental floating, tooth extraction and oral cavity surgery. Removal of oral tumours and correction of dental abnormalities." },
      ]),
      ...chapters(4, [
        { title: "Orthopedic Conditions", content: "Fracture types, splinting and casting techniques. Common fractures in small animals and fracture repair principles." },
        { title: "Lameness Examination", content: "Gait analysis, flexion tests and regional anaesthesia for lameness diagnosis. Navicular disease and joint disorders." },
        { title: "Post-operative Care", content: "Wound management, pain control, fluid therapy and nutrition post-surgery. Complications and their management." },
      ]),
    ],
  },
  {
    code: "AHDP-VRE-201",
    name: "Introductory Animal Reproduction",
    year: "2nd Year",
    semester: "4th Semester",
    chapters: [
      ...chapters(1, [
        { title: "Reproductive Anatomy – Male", content: "Testicular anatomy, sperm transport pathway, accessory sex glands and penis anatomy. Species differences in male reproductive anatomy." },
        { title: "Reproductive Anatomy – Female", content: "Ovarian structure, oviduct, uterus, cervix and vagina. Species-specific differences in female reproductive tract anatomy." },
        { title: "Reproductive Hormones", content: "Hypothalamic, pituitary and gonadal hormones. Hormonal regulation of reproductive cycles, feedback mechanisms and seasonality." },
      ]),
      ...chapters(2, [
        { title: "Semen Collection and Evaluation", content: "Semen collection methods – artificial vagina, electro-ejaculation and massage. Semen evaluation – motility, morphology, concentration and viability." },
        { title: "Artificial Insemination Techniques", content: "AI equipment, insemination methods, timing and technique. Deep uterine and cervical insemination. AI in cattle, buffalo, sheep and goats." },
        { title: "Semen Processing and Storage", content: "Semen dilution, extender composition, cooling and freezing protocols. Liquid nitrogen storage and straw technology." },
      ]),
      ...chapters(3, [
        { title: "Pregnancy Diagnosis", content: "Rectal palpation, ultrasonography, hormonal tests and blood tests for pregnancy diagnosis. Timing and accuracy of different methods." },
        { title: "Gestation Period and Fetal Development", content: "Duration of gestation across species, fetal membranes, placental types and fetal development milestones." },
        { title: "Parturition", content: "Signs of parturition, stages of labour, fetal membranes and placental expulsion. Dystocia recognition, assisted delivery and obstetric procedures." },
      ]),
      ...chapters(4, [
        { title: "Reproductive Disorders – Female", content: "Ovarian cysts, silent heat, anestrus, metritis and pyometra. Uterine prolapse, vaginal prolapse and their management." },
        { title: "Reproductive Disorders – Male", content: "Cryptorchidism, hypoplasia, seminal vesiculitis and orchitis. Breeding soundness examination of males." },
        { title: "Infertility Investigation", content: "Infertility examination procedures, herd fertility assessment and breeding efficiency indices. Strategies for improving herd reproductive performance." },
      ]),
    ],
  },
];

// ─── BVSc Subject Data ──────────────────────────────────────────────────────

const BVSC_SUBJECTS = [
  // ═══════════════════════════════════════════════════════════════════════════
  // FIRST PROFESSIONAL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    code: "BVSC-VAN-101",
    name: "Veterinary Anatomy",
    year: "1st Year",
    paper: "1st Paper",
    chapters: [
      ...chapters(1, [
        { title: "General Anatomy and Osteology", content: "Anatomical terminology, body planes and comparative osteology. Bones of axial skeleton – skull, vertebrae, ribs and sternum across domestic species." },
        { title: "Arthrology – Joints and Ligaments", content: "Classification of joints, synovial joint structure, ligaments and joint physiology. Comparative arthrology of limbs and vertebral column." },
        { title: "Myology – General Principles", content: "Muscle classification, properties, attachments and actions. Fascia, tendons, aponeuroses and muscle architecture." },
      ]),
      ...chapters(2, [
        { title: "Fore Limb Musculoskeletal Anatomy", content: "Bones, joints, muscles and tendons of the thoracic limb. Shoulder, elbow, carpus and digit anatomy in domestic animals." },
        { title: "Fore Limb Neurovasculature", content: "Brachial plexus, arterial supply and venous drainage of the fore limb. Lymphatic drainage patterns." },
        { title: "Comparative Fore Limb Anatomy", content: "Species differences in fore limb structure between equine, bovine, canine and feline. Functional anatomy related to locomotion." },
      ]),
      ...chapters(3, [
        { title: "Head and Neck Anatomy", content: "Cranial bones, facial muscles, oral cavity and pharynx. Anatomy of the tongue, teeth and salivary glands." },
        { title: "Neck and Throat Anatomy", content: "Cervical vertebrae, neck muscles, trachea, oesophagus and thyroid gland. Topographical anatomy of the neck region." },
        { title: "Special Sense Organs", content: "Eye anatomy – globe, adnexa and extraocular muscles. Ear anatomy – external, middle and inner ear structures." },
      ]),
      ...chapters(4, [
        { title: "Thorax Anatomy", content: "Thoracic wall, ribs and intercostal spaces. Pleural cavities, mediastinal structures and thoracic inlet anatomy." },
        { title: "Heart and Great Vessels", content: "Cardiac anatomy, chambers, valves, coronary circulation and conduction system. Great vessels and thoracic aorta." },
        { title: "Lungs and Respiratory Passages", content: "Bronchial tree, lung lobes, pulmonary vasculature and lymphatics. Comparative respiratory anatomy across species." },
      ]),
    ],
  },
  {
    code: "BVSC-VPH-101",
    name: "Veterinary Physiology",
    year: "1st Year",
    paper: "1st Paper",
    chapters: [
      ...chapters(1, [
        { title: "Blood and Cardiovascular Physiology", content: "Haemoglobin, erythrocyte indices, coagulation cascade and blood groups. Cardiac cycle, haemodynamics and cardiovascular regulation." },
        { title: "Nervous System Physiology", content: "Synaptic transmission, spinal reflexes, sensory systems and motor control. Autonomic nervous system function and neurohumoral regulation." },
        { title: "Muscular Physiology", content: "Excitation-contraction coupling, muscle fibre types, neuromuscular transmission. Muscle contraction mechanics and energetics." },
      ]),
      ...chapters(2, [
        { title: "Digestive System Physiology", content: "Gastrointestinal motility, secretion and absorption. Ruminant digestion, microbial fermentation and species-specific digestive physiology." },
        { title: "Respiratory System Physiology", content: "Pulmonary ventilation, gas exchange and transport. Ventilation-perfusion matching and respiratory regulation." },
        { title: "Liver and Pancreas Physiology", content: "Hepatic functions, bile production and metabolism. Pancreatic exocrine and endocrine functions." },
      ]),
      ...chapters(3, [
        { title: "Renal Physiology and Urine Formation", content: "Glomerular filtration, tubular function and acid-base regulation. Counter-current mechanism and concentrating ability across species." },
        { title: "Endocrine System Physiology", content: "Hypothalamic-pituitary axis, thyroid, adrenal, parathyroid and pancreatic endocrine functions. Hormonal regulation of metabolism." },
        { title: "Reproductive Endocrinology", content: "Gonadotropins, sex steroids and reproductive cycle regulation. Seasonal breeding, puberty and reproductive senescence." },
      ]),
      ...chapters(4, [
        { title: "Reproductive Physiology", content: "Spermatogenesis, oogenesis, oestrus cycle and fertilisation. Gestation, parturition and lactation across species." },
        { title: "Lactation and Mammary Physiology", content: "Mammary development, milk synthesis, composition and secretion. Lactation hormones and milking physiology." },
        { title: "Growth Physiology", content: "Growth curves, growth hormones, nutritional influences on growth. Factors affecting growth and body composition in livestock." },
      ]),
    ],
  },
  {
    code: "BVSC-LPM-101",
    name: "Livestock Production Management",
    year: "1st Year",
    paper: "1st Paper",
    chapters: [
      ...chapters(1, [
        { title: "Introduction to Livestock Production", content: "Importance of livestock in Indian agriculture. Classification of livestock, breed conservation and livestock production systems." },
        { title: "Cattle Production Systems", content: "Dairy and beef production systems. Housing, feeding and management of cattle for different production purposes." },
        { title: "Buffalo Production Systems", content: "Dairy buffalo management, breeding programs and production optimization. Buffalo-specific husbandry practices." },
      ]),
      ...chapters(2, [
        { title: "Sheep and Goat Production", content: "Wool, meat and milk production in small ruminants. Flock management, breeding systems and health care." },
        { title: "Poultry Production", content: "Broiler and layer production systems. Hatchery management, feeding programs and environmental control." },
        { title: "Swine Production", content: "Pig production systems, breeding management, nutrition and growth monitoring. Pork production and quality control." },
      ]),
      ...chapters(3, [
        { title: "Feed and Nutrition Management", content: "Feed availability, fodder production, ration formulation and feeding strategies for different livestock species." },
        { title: "Housing and Infrastructure", content: "Animal housing design, ventilation, lighting and space requirements. Farm infrastructure and equipment." },
        { title: "Health Management", content: "Disease prevention, vaccination programs, biosecurity and quarantine protocols for livestock farms." },
      ]),
      ...chapters(4, [
        { title: "Livestock Economics", content: "Cost-benefit analysis, marketing channels, value chain development and livestock enterprise management." },
        { title: "Sustainable Livestock Production", content: "Environmental impact, waste management, carbon footprint and sustainable intensification of livestock production." },
        { title: "Extension and Advisory Services", content: "Technology transfer, farmer training, ICT-based extension and best practices dissemination in livestock production." },
      ]),
    ],
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // SECOND PROFESSIONAL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    code: "BVSC-VBC-201",
    name: "Veterinary Biochemistry",
    year: "2nd Year",
    paper: "1st Paper",
    chapters: [
      ...chapters(1, [
        { title: "Biomolecules – Structure and Function", content: "Carbohydrates, lipids, proteins and nucleic acids. Structure-function relationships, conformational changes and biochemical classification." },
        { title: "Enzymes and Enzyme Kinetics", content: "Enzyme classification, mechanisms of catalysis, Michaelis-Menten kinetics. Enzyme regulation, allosteric control and clinical enzymology." },
        { title: "Biochemical Techniques", content: "Spectrophotometry, chromatography, electrophoresis and centrifugation. Clinical biochemistry laboratory methods and quality control." },
      ]),
      ...chapters(2, [
        { title: "Carbohydrate Metabolism", content: "Glycolysis, TCA cycle, oxidative phosphorylation and pentose phosphate pathway. Gluconeogenesis, glycogen metabolism and blood glucose regulation." },
        { title: "Lipid Metabolism", content: "Beta-oxidation, ketogenesis, lipogenesis and cholesterol metabolism. Fatty acid synthesis, phospholipid metabolism and lipoproteins." },
        { title: "Protein and Amino Acid Metabolism", content: "Protein synthesis, transamination, deamination and urea cycle. Nitrogen balance and amino acid catabolism." },
      ]),
      ...chapters(3, [
        { title: "Analytical Biochemistry", content: "Clinical enzyme assays, immunoassays, ELISA and radioimmunoassay. Blood chemistry panels and diagnostic biochemistry." },
        { title: "Molecular Biology Techniques", content: "DNA extraction, PCR, gel electrophoresis and blotting techniques. Gene expression analysis and molecular diagnostics." },
        { title: "Clinical Biochemistry", content: "Liver function tests, kidney function tests, cardiac markers and metabolic panels. Biochemical profiles in disease diagnosis." },
      ]),
    ],
  },
  {
    code: "BVSC-VMI-201",
    name: "Veterinary Microbiology",
    year: "2nd Year",
    paper: "1st Paper",
    chapters: [
      ...chapters(1, [
        { title: "General Microbiology", content: "Microbial cell structure, classification and growth requirements. Bacterial morphology, staining, culture media and cultivation methods." },
        { title: "Microbial Genetics and Physiology", content: "DNA replication, gene expression, mutation and recombination. Bacterial metabolism, growth curves and sterilization methods." },
        { title: "Immunology – Innate Immunity", content: "Physical barriers, phagocytes, complement system and natural killer cells. Inflammation and acute phase response." },
      ]),
      ...chapters(2, [
        { title: "Adaptive Immunity", content: "Humoral and cell-mediated immunity. Antibody structure, classes and functions. T-cell and B-cell responses and immune memory." },
        { title: "Immunological Techniques", content: "Agglutination, precipitation, complement fixation, ELISA and flow cytometry. Diagnostic immunology and serological methods." },
        { title: "Vaccinology and Immunoprophylaxis", content: "Vaccine types, adjuvants, production and quality control. Vaccination strategies and immune responses to vaccination." },
      ]),
      ...chapters(3, [
        { title: "Systemic Bacteriology – Gram Positive", content: "Staphylococcus, Streptococcus, Bacillus, Clostridium and Corynebacterium species. Pathogenesis, diagnosis and control of infections." },
        { title: "Systemic Bacteriology – Gram Negative", content: "Escherichia coli, Salmonella, Pasteurella, Brucella and Pseudomonas. Zoonotic potential and laboratory diagnosis." },
        { title: "Anaerobic and Fastidious Bacteria", content: "Clostridial diseases, leptospirosis, mycoplasmosis and chlamydiosis. Special culture requirements and identification methods." },
      ]),
      ...chapters(4, [
        { title: "Virology", content: "Virus structure, replication strategies and classification. DNA and RNA virus families important in veterinary medicine." },
        { title: "Veterinary Virology – DNA Viruses", content: "Poxviruses, herpesviruses, adenoviruses, parvoviruses and iridoviruses. Pathogenesis, diagnosis and control of viral infections." },
        { title: "Mycology", content: "Fungal morphology, classification and cultivation. Superficial, subcutaneous and systemic mycoses in animals." },
      ]),
    ],
  },
  {
    code: "BVSC-VPA-201",
    name: "Veterinary Pathology",
    year: "2nd Year",
    paper: "2nd Paper",
    chapters: [
      ...chapters(1, [
        { title: "Cell Injury and Adaptation", content: "Types of cell injury, reversible and irreversible cell changes. Cellular adaptation – hypertrophy, hyperplasia, atrophy and metaplasia." },
        { title: "Inflammation and Repair", content: "Acute and chronic inflammation, mediators and cellular responses. Wound healing, tissue repair and regenerative processes." },
        { title: "Hemodynamic Disorders", content: "Circulatory disturbances, oedema, haemorrhage, thrombosis and embolism. Infarction, shock and their pathological consequences." },
      ]),
      ...chapters(2, [
        { title: "Neoplasia", content: "Tumour biology, classification, nomenclature and grading. Oncogenes, tumour suppressors and carcinogenesis mechanisms." },
        { title: "Systemic Pathology – Cardiovascular", content: "Myocardial degeneration, endocarditis, pericarditis and vascular pathology. Atherosclerosis and hypertensive changes in animals." },
        { title: "Systemic Pathology – Respiratory and Digestive", content: "Pneumonia types, interstitial lung disease, hepatitis, enteritis and peritonitis. Species-specific pathological patterns." },
      ]),
      ...chapters(3, [
        { title: "Special Veterinary Pathology – Infectious", content: "Pathological lesions of bacterial, viral, fungal and parasitic diseases. Gross and microscopic pathology of major infectious diseases." },
        { title: "Special Veterinary Pathology – Metabolic", content: "Pathology of nutritional deficiencies, metabolic disorders and toxicoses. Fatty liver syndrome, urolithiasis and mineral deficiency lesions." },
        { title: "Special Veterinary Pathology – Reproductive", content: "Placentitis, abortion pathology, testicular degeneration and mammary pathology. Reproductive tract lesions in domestic animals." },
      ]),
      ...chapters(4, [
        { title: "Diagnostic Pathology – Necropsy", content: "Post-mortem examination techniques, organ collection and fixation. Necropsy procedures for different species and tissue sampling." },
        { title: "Histopathology and Histochemistry", content: "Tissue processing, sectioning, staining methods and histochemical techniques. Special stains for tissue diagnosis." },
        { title: "Cytopathology and Molecular Pathology", content: "Fine needle aspiration cytology, impression smears and molecular diagnostic techniques in pathology." },
      ]),
    ],
  },
  {
    code: "BVSC-AGB-201",
    name: "Animal Genetics and Breeding",
    year: "2nd Year",
    paper: "2nd Paper",
    chapters: [
      ...chapters(1, [
        { title: "Introduction to Genetics", content: "Mendelian laws of inheritance, gene concept, multiple alleles and gene interactions. Chromosomal basis of inheritance and chromosomal aberrations." },
        { title: "Quantitative Genetics", content: "Polygenic inheritance, additive and non-additive genetic variance. Heritability, repeatability and genetic correlation concepts." },
        { title: "Population Genetics", content: "Hardy-Weinberg equilibrium, gene and genotypic frequencies. Factors changing gene frequencies – selection, drift, mutation and migration." },
      ]),
      ...chapters(2, [
        { title: "Principles of Animal Breeding", content: "Selection methods – mass, progeny, sib and combined selection. Selection intensity, genetic progress and breeding value estimation." },
        { title: "Mating Systems", content: "Inbreeding, linebreeding, outcrossing and crossbreeding. Heterosis and its exploitation in livestock improvement programs." },
        { title: "Breeding Programmes", content: "Centralized recording, genetic evaluation and national breeding programmes. Sire selection, dam selection and breeding value prediction." },
      ]),
      ...chapters(3, [
        { title: "Reproductive Technologies in Breeding", content: "Artificial insemination, embryo transfer, multiple ovulation and embryo transfer (MOET). In-vitro fertilisation and embryo biotechnology." },
        { title: "Molecular Genetics and Markers", content: "DNA markers, RFLP, microsatellites, SNP and QTL mapping. Marker-assisted selection and genomic selection in livestock." },
        { title: "Genomic Selection", content: "Genome-wide association studies, genomic estimated breeding values. Reference populations, SNP chips and implementation of genomic selection." },
      ]),
      ...chapters(4, [
        { title: "Breeding for Production Traits", content: "Selection for milk production, growth rate, wool production and reproductive efficiency. Index selection and multi-trait selection." },
        { title: "Breeding for Disease Resistance", content: "Genetic resistance to diseases, breeding for immune competence. Genetic disorders and their control in livestock populations." },
        { title: "Conservation of Animal Genetic Resources", content: "Breed conservation strategies, in-situ and ex-situ conservation. Genetic diversity assessment and management of endangered breeds." },
      ]),
    ],
  },
  {
    code: "BVSC-AN-201",
    name: "Animal Nutrition",
    year: "2nd Year",
    paper: "2nd Paper",
    chapters: [
      ...chapters(1, [
        { title: "Principles of Animal Nutrition", content: "Nutrient classes, functions and requirements. Nutrient digestion and absorption mechanisms. Factors affecting nutrient utilization in domestic animals." },
        { title: "Water and Energy Nutrition", content: "Role of water in body functions, water requirements and quality. Energy concepts, gross, digestible, metabolisable and net energy systems." },
        { title: "Carbohydrate and Lipid Nutrition", content: "Structural and non-structural carbohydrates, fibre digestion in ruminants. Lipid digestion, absorption and metabolic roles in different species." },
      ]),
      ...chapters(2, [
        { title: "Protein and Amino Acid Nutrition", content: "Crude protein, digestible protein and metabolisable protein concepts. Amino acid requirements, limiting amino acids and protein evaluation systems." },
        { title: "Mineral and Vitamin Nutrition", content: "Macro and micro mineral functions, deficiencies and supplementation. Fat-soluble and water-soluble vitamins, sources and requirements." },
        { title: "Feedstuff Classification and Evaluation", content: "Classification of feeds – roughages, concentrates and supplements. Feed analysis, proximate analysis and feed quality assessment methods." },
      ]),
      ...chapters(3, [
        { title: "Nutrient Requirements of Livestock", content: "Nutrient requirements for growth, maintenance, reproduction, lactation and work. NRC guidelines and feeding standards for different species." },
        { title: "Balanced Ration Formulation", content: "Principles of ration formulation, Pearson's square method, linear programming and computer-based ration balancing. Least-cost ration formulation." },
        { title: "Feed Supplements and Additives", content: "Probiotics, prebiotics, enzymes, growth promoters and feed preservatives. Feed additives – benefits, regulation and proper usage." },
      ]),
      ...chapters(4, [
        { title: "Fodder Production", content: "Annual and perennial fodder crops, pasture management, hay and silage making. Cultivation practices for major fodder species." },
        { title: "Feed Storage and Preservation", content: "Grain storage, silage fermentation, hay making and feed preservation methods. Preventing feed spoilage and mycotoxin contamination." },
        { title: "Feeding Management Practices", content: "Feeding systems, feed conversion efficiency, feed intake regulation and practical feeding of different livestock species." },
      ]),
    ],
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // THIRD PROFESSIONAL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    code: "BVSC-VPT-301",
    name: "Veterinary Pharmacology and Toxicology",
    year: "3rd Year",
    paper: "1st Paper",
    chapters: [
      ...chapters(1, [
        { title: "General Pharmacology – Pharmacokinetics", content: "Absorption, distribution, metabolism and excretion of drugs. Bioavailability, half-life, volume of distribution and clearance concepts." },
        { title: "General Pharmacology – Pharmacodynamics", content: "Drug receptors, dose-response relationships, therapeutic index. Drug antagonism, synergism and potentiation." },
        { title: "Pharmacological Research Methods", content: "Experimental design, animal models, statistical analysis and bioassays. Drug evaluation methods and clinical pharmacology." },
      ]),
      ...chapters(2, [
        { title: "Systemic Pharmacology – Autonomic", content: "Cholinergic, anticholinergic, adrenergic and antiadrenergic drugs. Ganglionic and neuromuscular blocking agents." },
        { title: "Systemic Pharmacology – CNS and CVS", content: "Anaesthetics, analgesics, sedatives and cardiovascular drugs. Antiarrhythmics, antihypertensives and positive inotropic agents." },
        { title: "Systemic Pharmacology – Chemotherapy", content: "Antibiotics, antifungals, antivirals and antiprotozoal agents. Anthelmintics, ectoparasiticides and anticancer drugs." },
      ]),
      ...chapters(3, [
        { title: "Veterinary Toxicology – Plant Poisons", content: "Toxic plants, plant toxins and their effects on livestock. Pyrrolizidine alkaloids, oxalates, cyanogenic glycosides and photosensitizing plants." },
        { title: "Veterinary Toxicology – Chemical Poisons", content: "Organophosphates, carbamates, heavy metals, organochlorines and rodenticides. Mechanisms of toxicity and antidotes." },
        { title: "Mycotoxins and Feed Contaminants", content: "Aflatoxins, ochratoxin, fumonisins, deoxynivalenol and ergot alkaloids. Detection, prevention and treatment of mycotoxicoses." },
      ]),
      ...chapters(4, [
        { title: "Therapeutic Pharmacology", content: "Rational drug selection, dosage regimens and route selection. Drug interactions, contraindications and special population dosing." },
        { title: "Pharmacovigilance and Drug Regulation", content: "Adverse drug reaction monitoring, withdrawal periods and drug residues. Veterinary drug regulations and antimicrobial stewardship." },
        { title: "Pharmacogenomics and Personalised Therapy", content: "Genetic variation in drug response, pharmacogenetic testing and breed-specific drug sensitivities." },
      ]),
    ],
  },
  {
    code: "BVSC-VPH-301",
    name: "Veterinary Public Health and Epidemiology",
    year: "3rd Year",
    paper: "1st Paper",
    chapters: [
      ...chapters(1, [
        { title: "Principles of Epidemiology", content: "Epidemiological study designs, measures of disease frequency and association. Bias, confounding and effect modification in epidemiological studies." },
        { title: "Disease Surveillance and Investigation", content: "Disease surveillance systems, outbreak investigation and response. Disease reporting, notification and surveillance in veterinary medicine." },
        { title: "Diagnostic Test Evaluation", content: "Sensitivity, specificity, predictive values and likelihood ratios. ROC curves and diagnostic test validation in veterinary practice." },
      ]),
      ...chapters(2, [
        { title: "Zoonoses – Bacterial", content: "Salmonellosis, brucellosis, leptospirosis, tuberculosis and campylobacteriosis. Transmission, prevention and control of bacterial zoonoses." },
        { title: "Zoonoses – Viral and Parasitic", content: "Rabies, avian influenza, Japanese encephalitis, cysticercosis and toxoplasmosis. Emerging zoonotic infections and pandemic preparedness." },
        { title: "Food Safety and Quality Assurance", content: "HACCP principles, food safety management systems, residue monitoring and antimicrobial resistance in food animals." },
      ]),
      ...chapters(3, [
        { title: "One Health Approach", content: "Integration of human, animal and environmental health. Antimicrobial resistance, vector-borne diseases and emerging infections." },
        { title: "Environmental Health", content: "Environmental contamination, water quality, air pollution and their impact on animal and human health. Climate change and disease." },
        { title: "Wildlife and Environmental Health", content: "Wildlife disease surveillance, conservation medicine and ecosystem health. Biodiversity and its role in disease emergence." },
      ]),
      ...chapters(4, [
        { title: "Meat and Milk Hygiene", content: "Ante-mortem and post-mortem inspection, meat grading and milk quality control. Slaughter hygiene and processing standards." },
        { title: "Municipal and Industrial Waste Management", content: "Waste disposal methods, environmental pollution and its effects on animal health. Effluent treatment and solid waste management." },
        { title: "Occupational Health in Animal Industry", content: "Zoonotic risk for animal handlers, personal protective equipment and occupational safety. Immunization of high-risk groups." },
      ]),
    ],
  },
  {
    code: "BVSC-VPA-301",
    name: "Veterinary Parasitology",
    year: "3rd Year",
    paper: "1st Paper",
    chapters: [
      ...chapters(1, [
        { title: "General Parasitology", content: "Parasite-host relationships, life cycles and epidemiology. Classification of parasites, terminology and ecological concepts in parasitology." },
        { title: "Helminthology – Nematodes", content: "Morphology, life cycles and pathology of gastrointestinal and tissue nematodes. Ascaris, Trichuris, Haemonchus, Ostertagia and Dictyocaulus." },
        { title: "Helminthology – Trematodes and Cestodes", content: "Liver flukes, lung flukes and tapeworms. Fasciola, Schistosoma, Moniezia and Echinococcus life cycles and pathology." },
      ]),
      ...chapters(2, [
        { title: "Entomology – External Parasites", content: "Ticks, mites, lice, fleas and flies. Morphology, life cycles, pathogenicity and vector-borne disease transmission." },
        { title: "Arthropod-Borne Diseases", content: "Babesiosis, theileriosis, anaplasmosis, trypanosomiasis and leishmaniasis. Transmission cycles and control strategies." },
        { title: "Ectoparasite Control", content: "Acaricides, insecticides and their application methods. Integrated pest management and resistance mechanisms." },
      ]),
      ...chapters(3, [
        { title: "Protozoology – Apicomplexa", content: "Coccidia, haemosporidia, piroplasms and toxoplasma. Life cycles, pathogenesis and diagnosis of protozoal infections." },
        { title: "Protozoology – Flagellates and Ciliates", content: "Trypanosomes, Leishmania, Giardia and rumen protozoa. Morphology, pathogenicity and laboratory diagnosis." },
        { title: "Immunology of Parasitic Infections", content: "Immune responses to parasites, evasion mechanisms and acquired immunity. Immunodiagnosis and vaccine development." },
      ]),
      ...chapters(4, [
        { title: "Diagnostic Parasitology", content: "Faecal examination methods, blood smear techniques and serological diagnosis. Quantitative and qualitative parasitological methods." },
        { title: "Anthelmintic Therapy", content: "Classification of anthelmintics, mechanisms of action and resistance. Rational drug use, efficacy testing and combination therapy." },
        { title: "Applied Parasitology and Control Programs", content: "Integrated parasite management, strategic treatment and pasture management. Zoonotic parasites and public health importance." },
      ]),
    ],
  },
  {
    code: "BVSC-LPT-301",
    name: "Livestock Products Technology",
    year: "3rd Year",
    paper: "2nd Paper",
    chapters: [
      ...chapters(1, [
        { title: "Meat Science and Technology", content: "Muscle biology, meat composition, factors affecting meat quality. Slaughter procedures, dressing and carcass evaluation." },
        { title: "Poultry and Egg Products", content: "Poultry processing, egg grading, packaging and quality control. Poultry product safety and regulatory standards." },
        { title: "Milk and Dairy Products", content: "Milk composition, quality testing, pasteurization and processing. Manufacturing of dairy products – butter, cheese, yogurt and ice cream." },
      ]),
      ...chapters(2, [
        { title: "Fish and Seafood Technology", content: "Fish processing, preservation methods and quality assessment. Fishery products and their nutritional value." },
        { title: "By-products Utilization", content: "Leather, wool, blood, bone and offal utilization. Rendering industry and by-product processing technologies." },
        { title: "Food Safety and Quality Control", content: "HACCP implementation, food safety management systems, residue monitoring and compliance with national and international standards." },
      ]),
      ...chapters(3, [
        { title: "Meat Preservation and Processing", content: "Curing, smoking, canning, freezing and irradiation of meat products. Minimally processed meat products and shelf-life extension." },
        { title: "Product Adulteration and Detection", content: "Common adulterants in meat, milk and egg products. Detection methods and regulatory compliance for product authenticity." },
        { title: "Value Addition to Livestock Products", content: "Product diversification, functional foods, organic and niche market products. Marketing strategies for value-added livestock products." },
      ]),
    ],
  },
  {
    code: "BVSC-VAH-301",
    name: "Veterinary and Animal Husbandry Extension Education",
    year: "3rd Year",
    paper: "2nd Paper",
    chapters: [
      ...chapters(1, [
        { title: "Fundamentals of Extension Education", content: "Definition, objectives and philosophy of extension education. History of agricultural extension, extension principles and teaching-learning process." },
        { title: "Rural Sociology and Development", content: "Rural social structure, social groups, community development and leadership. Role of extension in rural livelihood improvement." },
        { title: "Extension Philosophy and Approaches", content: "Farmers first approach, participatory rural appraisal and community-driven development. Adult education principles and extension methodologies." },
      ]),
      ...chapters(2, [
        { title: "Extension Programme Planning", content: "Needs assessment, programme development, implementation and evaluation. Logical framework approach and result-based management in extension." },
        { title: "Extension Teaching Methods", content: "Individual, group and mass methods of extension teaching. Farm demonstrations, training, exhibitions, farm visits and field days." },
        { title: "Training and Capacity Building", content: "Training need assessment, training design, delivery and evaluation. Capacity building of farmers, extension workers and rural youth." },
      ]),
      ...chapters(3, [
        { title: "Communication in Extension", content: "Communication models, barriers and strategies. Verbal, non-verbal and visual communication in extension. Interpersonal communication skills." },
        { title: "Mass Media and ICT in Extension", content: "Role of radio, television, print media and social media in extension. ICT-based extension – mobile apps, e-learning and digital platforms." },
        { title: "Audio-Visual Aids and Presentation", content: "Use of charts, models, posters, video and multimedia in extension. Effective presentation and public speaking skills for extension professionals." },
      ]),
      ...chapters(4, [
        { title: "Livestock Entrepreneurship", content: "Entrepreneurship development, business planning and feasibility studies. Value chain analysis and market linkages for livestock products." },
        { title: "Self-Help Groups and Cooperatives", content: "Formation and management of self-help groups, cooperatives and farmer producer organisations. Microfinance and credit access for livestock farmers." },
        { title: "Extension Programme Evaluation", content: "Impact assessment, monitoring and evaluation methods. Cost-benefit analysis of extension programmes and outcome measurement." },
      ]),
    ],
  },
  {
    code: "BVSC-VCP-301",
    name: "Veterinary Clinical Practices",
    year: "3rd Year",
    paper: "3rd Paper",
    chapters: [
      ...chapters(1, [
        { title: "Clinical Examination and Diagnosis", content: "Systematic clinical examination techniques, history taking, physical examination and clinical reasoning. Diagnostic approach to common presentations." },
        { title: "Laboratory Diagnosis", content: "Haematology, clinical chemistry, urinalysis, faecal examination and cytology. Sample collection, processing and result interpretation." },
        { title: "Diagnostic Imaging in Practice", content: "Point-of-care ultrasonography, portable radiography and endoscopy. Image acquisition and interpretation in field conditions." },
      ]),
      ...chapters(2, [
        { title: "Therapeutic Procedures", content: "Intravenous and intraosseous catheterisation, fluid therapy, blood transfusion and parenteral nutrition. Common medical procedures in practice." },
        { title: "Emergency and Critical Care", content: "Triage, shock management, cardiopulmonary resuscitation and emergency drug protocols. Critical care monitoring and intensive care unit management." },
        { title: "Wound Management and Bandaging", content: "Wound assessment, cleaning, closure and bandage application. Cast application, splinting and post-operative wound care." },
      ]),
      ...chapters(3, [
        { title: "Large Animal Clinical Practice", content: "Ambulatory practice, field surgery, herd health rounds and production medicine. Common conditions in cattle, horses and small ruminants." },
        { title: "Large Animal Medicine and Surgery", content: "Dairy practice, equine practice, beef cattle operations and feedlot medicine. Reproductive management and surgical interventions." },
        { title: "Large Animal Emergency Practice", content: "Colic, dystocia, traumatic reticuloperitonitis, displaced abomasum and fracture repair in large animals." },
      ]),
      ...chapters(4, [
        { title: "Small Animal Clinical Practice", content: "Companion animal medicine, preventive health care, vaccination protocols and wellness examinations." },
        { title: "Small Animal Surgery and Dentistry", content: "Soft tissue surgery, orthopaedic procedures, dental scaling and extraction. Common surgical conditions in dogs and cats." },
        { title: "Special Species and Exotic Animal Practice", content: "Avian medicine, reptile medicine, rabbit medicine and zoo animal practice. Husbandry requirements and common conditions in exotic species." },
      ]),
    ],
  },
  {
    code: "BVSC-LFP-301",
    name: "Livestock Farm Practices",
    year: "3rd Year",
    paper: "3rd Paper",
    chapters: [
      ...chapters(1, [
        { title: "Dairy Farm Management", content: "Daily farm operations, milking routines, record keeping and farm layout. Dairy farm planning and management for different scales." },
        { title: "Cattle and Buffalo Health Management", content: "Preventive health programs, vaccination schedules, common disease recognition and first aid in livestock." },
        { title: "Feed and Fodder Management", content: "Feed storage, ration formulation, feeding schedules and fodder production. Economic feeding strategies for livestock." },
      ]),
      ...chapters(2, [
        { title: "Sheep and Goat Farm Management", content: "Flock management, shearing practices, breeding management and health care for small ruminants." },
        { title: "Poultry Farm Management", content: "Broiler and layer farm management, housing systems, feeding programs and environmental control." },
        { title: "Swine Farm Management", content: "Pig farm management, breeding programs, nutrition and growth monitoring. Pork production and quality control." },
      ]),
      ...chapters(3, [
        { title: "Farm Record Keeping", content: "Financial records, production records, health records and performance monitoring. Computerized farm management information systems." },
        { title: "Livestock Marketing", content: "Marketing channels, market intelligence, price discovery and value chain development for livestock and livestock products." },
        { title: "Farm Economics and Business Planning", content: "Cost-benefit analysis, break-even analysis, farm budgeting and business planning for livestock enterprises." },
      ]),
    ],
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // FOURTH PROFESSIONAL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    code: "BVSC-VSR-401",
    name: "Veterinary Surgery and Radiology",
    year: "4th Year",
    paper: "1st Paper",
    chapters: [
      ...chapters(1, [
        { title: "General Surgical Principles", content: "Aseptic technique, surgical instrumentation, wound closure and suture materials. Haemostasis, drainage and surgical anatomy." },
        { title: "Anaesthesia and Pain Management", content: "General and regional anaesthesia protocols, monitoring and pain assessment. Multimodal analgesia and anaesthetic emergencies." },
        { title: "Pre-operative and Post-operative Care", content: "Patient preparation, surgical planning, fluid therapy and wound management. Complications, infection control and surgical nutrition." },
      ]),
      ...chapters(2, [
        { title: "Abdominal Surgery", content: "Laparotomy, rumenotomy, ovariohysterectomy, caesarean section and splenectomy. Gastrointestinal surgery in large and small animals." },
        { title: "Thoracic Surgery", content: "Thoracotomy, pericardectomy, lung lobectomy and diaphragmatic hernia repair. Chest tube placement and pleural drainage." },
        { title: "Urogenital Surgery", content: "Cystotomy, nephrectomy, urethrostomy, castration and penile surgery. Prostatic surgery and reproductive tract procedures." },
      ]),
      ...chapters(3, [
        { title: "Orthopaedic Surgery", content: "Fracture repair – internal and external fixation, joint surgery, cruciate ligament repair. Arthroscopy and limb amputation." },
        { title: "Head and Neck Surgery", content: "Brachycephalic obstructive airway surgery, lateral ear canal resection, laryngeal paralysis repair and thyroidectomy." },
        { title: "Soft Tissue and Reconstructive Surgery", content: "Hernia repair, reconstructive surgery, skin flaps and grafts. Tumour removal and wound reconstruction techniques." },
      ]),
      ...chapters(4, [
        { title: "Veterinary Radiology – Principles", content: "X-ray physics, image acquisition, exposure factors and radiation safety. Digital radiography and image processing." },
        { title: "Diagnostic Radiology – Body Systems", content: "Radiographic interpretation of thoracic, abdominal and musculoskeletal systems. Normal radiographic anatomy and pathological patterns." },
        { title: "Advanced Imaging – Ultrasound and CT", content: "Ultrasonographic techniques, echocardiography and CT scanning. MRI principles and cross-sectional imaging in veterinary practice." },
      ]),
    ],
  },
  {
    code: "BVSC-VME-401",
    name: "Veterinary Medicine",
    year: "4th Year",
    paper: "1st Paper",
    chapters: [
      ...chapters(1, [
        { title: "General Medicine – Diagnostic Approach", content: "Systematic approach to clinical diagnosis, differential diagnosis formulation. Diagnostic imaging, laboratory tests and clinical decision-making." },
        { title: "General Medicine – Therapeutic Principles", content: "Fluid therapy, antimicrobial therapy, anti-inflammatory therapy and supportive care. Treatment protocols and evidence-based medicine." },
        { title: "General Medicine – Infectious Disease Diagnosis", content: "Specimen collection, culture and sensitivity testing. Serological and molecular diagnostic methods in clinical practice." },
      ]),
      ...chapters(2, [
        { title: "Diseases of the Digestive System – Large Animals", content: "Rumenitis, hardware disease, abomasal displacement, colic and diarrhoeal diseases in cattle and horses." },
        { title: "Diseases of the Respiratory System – Large Animals", content: "Pneumonia, pleurisy, heaves, shipping fever and rhodococcosis. Differential diagnosis and treatment of respiratory diseases." },
        { title: "Diseases of the Cardiovascular and Nervous System", content: "Cardiac diseases, anaemia, purpura and haemorrhagic disorders. Nervous diseases – meningitis, encephalitis and spinal cord disorders." },
      ]),
      ...chapters(3, [
        { title: "Infectious Diseases – Bacterial", content: "Anthrax, blackleg, tetanus, strangles, contagious bovine pleuropneumonia and caseous lymphadenitis. Clinical features and management." },
        { title: "Infectious Diseases – Viral", content: "Foot-and-mouth disease, rinderpest, BVD, African swine fever, canine distemper and parvovirus infections." },
        { title: "Mycotic and Rickettsial Diseases", content: "Dermatophytosis, aspergillosis, histoplasmosis and rickettsial infections. Ehrlichiosis, anaplasmosis and Rocky Mountain spotted fever." },
      ]),
      ...chapters(4, [
        { title: "Small Animal Medicine", content: "Canine and feline common diseases – metabolic, infectious, dermatological and oncological. Geriatric care and preventive health programs." },
        { title: "Equine Medicine", content: "Colic, laminitis, equine influenza, strangles and equine metabolic syndrome. Emergency care and critical management." },
        { title: "Special Species Medicine", content: "Avian, camelid, rabbit and wildlife medicine. Zoo animal medicine and exotic pet health management." },
      ]),
    ],
  },
  {
    code: "BVSC-VGO-401",
    name: "Veterinary Gynaecology and Obstetrics",
    year: "4th Year",
    paper: "2nd Paper",
    chapters: [
      ...chapters(1, [
        { title: "Female Reproductive Anatomy and Histology", content: "Ovary, oviduct, uterus, cervix and vagina anatomy. Reproductive tract histology and seasonal changes across species." },
        { title: "Female Reproductive Physiology", content: "Oestrus cycle, hormonal regulation, follicular dynamics and corpus luteum function. Embryonic development and implantation." },
        { title: "Endocrinology of Reproduction", content: "GnRH, FSH, LH, oestrogen, progesterone and prostaglandin. Hormonal assays, reproductive hormone profiles and clinical applications." },
      ]),
      ...chapters(2, [
        { title: "Normal Parturition", content: "Stages of labour, fetal membranes and placental expulsion. Neonatal care, resuscitation and colostrum management." },
        { title: "Dystocia and Obstetric Emergencies", content: "Causes of dystocia, fetal malpresentation and maternal foetal disproportion. Obstetric procedures, caesarean section and foetotomy." },
        { title: "Post-partum Disorders", content: "Metritis, retained placenta, uterine prolapse, milk fever and ketosis. Post-partum care and reproductive recovery management." },
      ]),
      ...chapters(3, [
        { title: "Infertility in Female Animals", content: "Cystic ovarian disease, anestrus, silent heat and repeat breeding. Diagnostic workup, hormonal treatment and herd fertility management." },
        { title: "Uterine and Ovarian Disorders", content: "Pyometra, endometritis, ovarian cysts, oophoritis and salpingitis. Treatment protocols and reproductive prognosis." },
        { title: "Abortion and Reproductive Failure", content: "Infectious and non-infectious causes of abortion. Diagnostic approaches, infectious abortion control and herd-level management." },
      ]),
      ...chapters(4, [
        { title: "Male Reproduction", content: "Testicular physiology, spermatogenesis and semen evaluation. Breeding soundness examination and male infertility investigation." },
        { title: "Artificial Insemination and Semen Technology", content: "AI techniques, semen processing, cryopreservation and quality control. AI centres, breeding programs and reproductive technology." },
        { title: "Controlled Reproduction", content: "Estrus synchronisation, embryo transfer, in-vitro fertilisation and embryo sexing. Advanced reproductive technologies in livestock." },
      ]),
    ],
  },
  {
    code: "BVSC-VCP-401",
    name: "Veterinary Clinical Practices",
    year: "4th Year",
    paper: "3rd Paper",
    chapters: [
      ...chapters(1, [
        { title: "Clinical Examination and Diagnosis", content: "Systematic clinical examination techniques, history taking, physical examination and clinical reasoning. Diagnostic approach to common presentations." },
        { title: "Laboratory Diagnosis", content: "Haematology, clinical chemistry, urinalysis, faecal examination and cytology. Sample collection, processing and result interpretation." },
        { title: "Diagnostic Imaging in Practice", content: "Point-of-care ultrasonography, portable radiography and endoscopy. Image acquisition and interpretation in field conditions." },
      ]),
      ...chapters(2, [
        { title: "Therapeutic Procedures", content: "Intravenous and intraosseous catheterisation, fluid therapy, blood transfusion and parenteral nutrition. Common medical procedures in practice." },
        { title: "Emergency and Critical Care", content: "Triage, shock management, cardiopulmonary resuscitation and emergency drug protocols. Critical care monitoring and intensive care unit management." },
        { title: "Wound Management and Bandaging", content: "Wound assessment, cleaning, closure and bandage application. Cast application, splinting and post-operative wound care." },
      ]),
      ...chapters(3, [
        { title: "Large Animal Clinical Practice", content: "Ambulatory practice, field surgery, herd health rounds and production medicine. Common conditions in cattle, horses and small ruminants." },
        { title: "Large Animal Medicine and Surgery", content: "Dairy practice, equine practice, beef cattle operations and feedlot medicine. Reproductive management and surgical interventions." },
        { title: "Large Animal Emergency Practice", content: "Colic, dystocia, traumatic reticuloperitonitis, displaced abomasum and fracture repair in large animals." },
      ]),
      ...chapters(4, [
        { title: "Small Animal Clinical Practice", content: "Companion animal medicine, preventive health care, vaccination protocols and wellness examinations." },
        { title: "Small Animal Surgery and Dentistry", content: "Soft tissue surgery, orthopaedic procedures, dental scaling and extraction. Common surgical conditions in dogs and cats." },
        { title: "Special Species and Exotic Animal Practice", content: "Avian medicine, reptile medicine, rabbit medicine and zoo animal practice. Husbandry requirements and common conditions in exotic species." },
      ]),
    ],
  },
];

// ─── MVSc & PhD Department Data ─────────────────────────────────────────────

const MVSC_PHD_DEPARTMENTS: {
  name: string;
  code: string;
  subjects: {
    name: string;
    code: string;
    chapters: { title: string; content: string; unitNumber: number }[];
  }[];
}[] = [
  {
    name: "Animal Genetics & Breeding",
    code: "AGB",
    subjects: [
      {
        name: "Advanced Animal Breeding",
        code: "AGB-601",
        chapters: [
          ...chapters(1, [
            { title: "Quantitative Genetics and Selection Theory", content: "Advanced concepts in quantitative genetics, selection index theory and optimum selection intensity. Genetic parameters estimation and prediction accuracy." },
            { title: "Population Genetics and Evolution", content: "Quantitative trait locus mapping, genome-wide association studies and genomic selection. Population structure and genetic diversity analysis." },
          ]),
          ...chapters(2, [
            { title: "Molecular Breeding", content: "Marker-assisted selection, genomic estimated breeding values and marker panels. Implementation of genomic selection in breeding programs." },
            { title: "Breeding Programme Design", content: "Centralized evaluation systems, international genetic evaluations and multi-country cooperation. BLUP methodology and genetic trend analysis." },
          ]),
        ],
      },
      {
        name: "Cytogenetics and Molecular Genetics",
        code: "AGB-602",
        chapters: [
          ...chapters(1, [
            { title: "Chromosome Biology", content: "Karyotyping, chromosome banding, structural and numerical aberrations. FISH and molecular cytogenetic techniques in livestock." },
            { title: "DNA Technology and Genomics", content: "DNA extraction, PCR, sequencing, microarrays and SNP genotyping. Functional genomics and transcriptomics in animal science." },
          ]),
          ...chapters(2, [
            { title: "Gene Expression and Regulation", content: "Epigenetics, DNA methylation, histone modification and gene regulation. Transcriptomic analysis and RNA-seq in livestock species." },
            { title: "Bioinformatics for Animal Genetics", content: "Sequence analysis, genome assembly, variant calling and genome annotation. Computational tools and databases for animal genetics research." },
          ]),
        ],
      },
      {
        name: "Livestock Diversity and Conservation",
        code: "AGB-603",
        chapters: [
          ...chapters(1, [
            { title: "Animal Genetic Resources", content: "Breed classification, genetic diversity assessment and characterization of indigenous breeds. Global status of livestock genetic resources." },
            { title: "Conservation Strategies", content: "In-situ and ex-situ conservation, cryopreservation of genetic material and gene banks. Prioritization and conservation planning." },
          ]),
          ...chapters(2, [
            { title: "Breed Improvement and Utilization", content: "Crossbreeding strategies, composite breed development and breed characterization. Utilization of indigenous genetic resources." },
            { title: "Genetic Databases and Information Systems", content: "DAD-IS, breed registries and genetic information databases. Data management and sharing in international genetic evaluations." },
          ]),
        ],
      },
    ],
  },
  {
    name: "Animal Nutrition",
    code: "AN",
    subjects: [
      {
        name: "Advanced Animal Nutrition",
        code: "AN-601",
        chapters: [
          ...chapters(1, [
            { title: "Ruminant Nutrition", content: "Rumen microbiology, fermentation dynamics and nutrient metabolism. Protein and energy feeding of dairy cattle and beef cattle." },
            { title: "Non-Ruminant Nutrition", content: "Nutrition of swine, poultry and horses. Amino acid requirements, energy metabolism and feed efficiency." },
          ]),
          ...chapters(2, [
            { title: "Nutritional Immunology", content: "Role of nutrients in immune function, zinc, selenium and vitamin E in immunity. Nutrition and disease resistance in livestock." },
            { title: "Feed Additives and Growth Promoters", content: "Antibiotic alternatives, probiotics, prebiotics, enzymes and organic acids. Growth promotion mechanisms and regulatory frameworks." },
          ]),
        ],
      },
      {
        name: "Mineral and Vitamin Nutrition",
        code: "AN-602",
        chapters: [
          ...chapters(1, [
            { title: "Macro Mineral Nutrition", content: "Calcium, phosphorus, magnesium, sodium and potassium metabolism. Deficiency diseases, requirements and supplementation strategies." },
            { title: "Trace Element Nutrition", content: "Iron, copper, zinc, selenium, cobalt and iodine metabolism. Deficiency disorders and diagnostic approaches." },
          ]),
          ...chapters(2, [
            { title: "Vitamin Nutrition in Livestock", content: "Fat-soluble and water-soluble vitamin metabolism, requirements and deficiency symptoms. Vitamin supplementation and interactions." },
            { title: "Nutritional Disorders", content: "Metabolic diseases, nutrient toxicities and imbalances. Diagnosis, treatment and prevention of nutritional disorders in livestock." },
          ]),
        ],
      },
      {
        name: "Feed Science and Technology",
        code: "AN-603",
        chapters: [
          ...chapters(1, [
            { title: "Feed Analysis and Evaluation", content: "Proximate analysis, near-infrared spectroscopy and feed quality assessment. Anti-nutritional factors and feed processing effects." },
            { title: "Feed Manufacturing Technology", content: "Pelleting, extrusion, compaction and feed processing methods. Feed mill design, quality control and production management." },
          ]),
          ...chapters(2, [
            { title: "Fodder Production and Conservation", content: "Pasture management, hay and silage production, hydroponic fodder. Fodder crop varieties and agronomic practices." },
            { title: "Precision Feeding", content: "Automated feeding systems, sensor-based monitoring and precision nutrition. Individual animal feeding and group feeding strategies." },
          ]),
        ],
      },
    ],
  },
  {
    name: "Animal Reproduction, Gynaecology & Obstetrics",
    code: "ARGO",
    subjects: [
      {
        name: "Advanced Reproductive Technologies",
        code: "ARGO-601",
        chapters: [
          ...chapters(1, [
            { title: "Embryo Transfer Technology", content: "Superovulation, embryo collection, evaluation and transfer. In-vivo and in-vitro embryo production and embryo cryopreservation." },
            { title: "Assisted Reproductive Techniques", content: "In-vitro fertilisation, intracytoplasmic sperm injection and embryo micromanipulation. Sexing of embryos and transgenic animals." },
          ]),
          ...chapters(2, [
            { title: "Reproductive Biotechnology", content: "Somatic cell nuclear transfer, cloning and stem cell technology. Molecular markers for reproductive traits and fertility genomics." },
            { title: "Hormonal Control of Reproduction", content: "Estrus synchronisation protocols, timed artificial insemination and hormonal manipulation. Controlled internal drug release and gonadotropin protocols." },
          ]),
        ],
      },
      {
        name: "Veterinary Obstetrics",
        code: "ARGO-602",
        chapters: [
          ...chapters(1, [
            { title: "Normal and Abnormal Parturition", content: "Mechanisms of parturition, fetal membrane physiology and post-partum involution. Neonatal assessment and care." },
            { title: "Dystocia Management", content: "Fetotomy techniques, caesarean section and obstetric emergencies. Torsion of the uterus, prolapse management and post-partum care." },
          ]),
          ...chapters(2, [
            { title: "Abortion and Pregnancy Loss", content: "Infectious causes of abortion, diagnostic investigation and herd-level management. Pregnancy toxemia and pregnancy immunology." },
            { title: "Reproductive Health Management", content: "Herd fertility programs, reproductive monitoring and decision support systems. Economic analysis of reproductive efficiency." },
          ]),
        ],
      },
      {
        name: "Female Reproductive Disorders",
        code: "ARGO-603",
        chapters: [
          ...chapters(1, [
            { title: "Ovarian Disorders", content: "Cystic ovarian degeneration, follicular and luteal cysts, ovarian hypoplasia and tumours. Diagnosis and hormonal treatment." },
            { title: "Uterine Disorders", content: "Endometritis, pyometra, metritis and uterine prolapse. Uterine flora, infection mechanisms and therapeutic approaches." },
          ]),
          ...chapters(2, [
            { title: "Cervical and Vaginal Disorders", content: "Cervical incompetence, vaginal prolapse, vestibulovaginitis and adhesions. Clinical management and reproductive prognosis." },
            { title: "Infertility Investigation and Management", content: "Diagnostic workup for infertile females, breeding management and fertility improvement strategies. Role of nutrition in fertility." },
          ]),
        ],
      },
    ],
  },
  {
    name: "Livestock Production & Management",
    code: "LPM",
    subjects: [
      {
        name: "Advanced Livestock Management",
        code: "LPM-601",
        chapters: [
          ...chapters(1, [
            { title: "Dairy Production Systems", content: "Intensive and extensive dairy systems, precision dairy farming and milk quality assurance. Herd management, milking systems and production economics." },
            { title: "Beef Production Systems", content: "Cow-calf operations, stocker management and feedlot finishing. Carcass quality, growth implants and beef production efficiency." },
          ]),
          ...chapters(2, [
            { title: "Small Ruminant Production", content: "Sheep and goat production systems, meat and wool production. Pastoral systems, grazing management and market-oriented production." },
            { title: "Swine Production Management", content: "Intensive pig production, breeding management, growing-finishing systems and welfare considerations." },
          ]),
        ],
      },
      {
        name: "Livestock Behaviour and Welfare",
        code: "LPM-602",
        chapters: [
          ...chapters(1, [
            { title: "Animal Behaviour Science", content: "Ethology, learning, social behaviour and communication. Behavioural indicators of welfare and stress in livestock." },
            { title: "Welfare Assessment", content: "Animal welfare science, assessment protocols and certification schemes. Five domains model and welfare indicators." },
          ]),
          ...chapters(2, [
            { title: "Housing and Welfare", content: "Environmental enrichment, space requirements, flooring and ventilation. Welfare of confined vs free-range systems." },
            { title: "Transport and Slaughter Welfare", content: "Transport stress, lairage conditions, stunning methods and humane slaughter. Regulatory frameworks and welfare auditing." },
          ]),
        ],
      },
    ],
  },
  {
    name: "Livestock Products Technology",
    code: "LPT",
    subjects: [
      {
        name: "Meat Science and Technology",
        code: "LPT-601",
        chapters: [
          ...chapters(1, [
            { title: "Muscle Biology and Meat Quality", content: "Muscle structure, post-mortem changes, rigor mortis and meat quality attributes. Factors affecting meat tenderness, colour and flavour." },
            { title: "Meat Processing Technology", content: "Sausage making, curing, smoking and meat preservation methods. Processed meat products and value addition techniques." },
          ]),
          ...chapters(2, [
            { title: "Poultry and Egg Technology", content: "Poultry processing, egg quality assessment and egg products. Grading, storage and preservation of poultry products." },
            { title: "Quality and Safety Assurance", content: "HACCP in meat plants, residue monitoring and microbiological standards. Halal and kosher slaughter, export quality requirements." },
          ]),
        ],
      },
      {
        name: "Milk and Dairy Technology",
        code: "LPT-602",
        chapters: [
          ...chapters(1, [
            { title: "Milk Production and Composition", content: "Milk synthesis, composition, quality factors and adulteration detection. Milk collection, cooling and transportation systems." },
            { title: "Dairy Processing", content: "Pasteurisation, homogenisation, standardisation and UHT processing. Milk product manufacturing – butter, cheese, yogurt and milk powder." },
          ]),
          ...chapters(2, [
            { title: "Fermented Dairy Products", content: "Microbiology of fermentation, starter cultures and fermented milk product technology. Quality control in fermented dairy production." },
            { title: "Dairy Plant Management", content: "Dairy plant design, equipment selection and maintenance. Cleaning-in-place systems and hygiene management in dairy processing." },
          ]),
        ],
      },
    ],
  },
  {
    name: "Poultry Science",
    code: "PS",
    subjects: [
      {
        name: "Advanced Poultry Production",
        code: "PS-601",
        chapters: [
          ...chapters(1, [
            { title: "Poultry Genetics and Breeding", content: "Breeding objectives, selection methods and genetic improvement in poultry. Layer and broiler breeding programmes." },
            { title: "Poultry Nutrition", content: "Nutrient requirements of broilers and layers, feed formulation and feeding programmes. Feed additives and growth promoters in poultry." },
          ]),
          ...chapters(2, [
            { title: "Poultry Housing and Environment", content: "Housing systems, environmental control, lighting programmes and ventilation. Welfare considerations in poultry production." },
            { title: "Poultry Health Management", content: "Major poultry diseases, vaccination schedules and biosecurity. Integrated pest management and disease prevention programmes." },
          ]),
        ],
      },
      {
        name: "Poultry Diseases",
        code: "PS-602",
        chapters: [
          ...chapters(1, [
            { title: "Viral Diseases of Poultry", content: "Newcastle disease, infectious bursal disease, Marek's disease, avian influenza and infectious bronchitis. Diagnosis and control strategies." },
            { title: "Bacterial Diseases of Poultry", content: "Colibacillosis, salmonellosis, fowl cholera, infectious coryza and mycoplasmosis. Antimicrobial resistance and treatment options." },
          ]),
          ...chapters(2, [
            { title: "Parasitic Diseases of Poultry", content: "Coccidiosis, histomoniasis, capillariasis and external parasites. Prevention, treatment and integrated parasite management." },
            { title: "Nutritional and Metabolic Disorders", content: "Ascites, fatty liver syndrome, leg disorders and cage layer fatigue. Nutritional strategies for disease prevention." },
          ]),
        ],
      },
    ],
  },
  {
    name: "Veterinary Anatomy",
    code: "VA",
    subjects: [
      {
        name: "Comparative Veterinary Anatomy",
        code: "VA-601",
        chapters: [
          ...chapters(1, [
            { title: "Comparative Osteology", content: "Comparative skeletal anatomy across domestic species, functional morphology and evolutionary adaptations in vertebrate skeleton." },
            { title: "Comparative Myology", content: "Muscular anatomy comparisons across species, functional adaptations and biomechanical analysis of locomotion." },
          ]),
          ...chapters(2, [
            { title: "Gross Anatomy of Head and Neck", content: "Detailed comparative anatomy of cranial structures, special senses and cervical regions across domestic species." },
            { title: "Gross Anatomy of Trunk", content: "Comparative thoracic and abdominal anatomy, visceral organ arrangement and topographical relationships in domestic animals." },
          ]),
        ],
      },
      {
        name: "Veterinary Neuroanatomy",
        code: "VA-602",
        chapters: [
          ...chapters(1, [
            { title: "Central Nervous System Anatomy", content: "Brain and spinal cord anatomy, meninges, ventricles and CSF pathways. Comparative neuroanatomy across species." },
            { title: "Peripheral Nervous System", content: "Cranial nerves, spinal nerves and autonomic nervous system. Nerve plexuses, ganglia and peripheral nerve pathways." },
          ]),
          ...chapters(2, [
            { title: "Neural Pathways and Tracts", content: "Sensory pathways, motor pathways and integration centres. White matter tracts and cortical organisation in domestic animals." },
            { title: "Applied Neuroanatomy", content: "Neurological examination, lesion localisation and clinical neuroanatomy. Correlation between structure and function." },
          ]),
        ],
      },
      {
        name: "Veterinary Histology and Embryology",
        code: "VA-603",
        chapters: [
          ...chapters(1, [
            { title: "Advanced Histological Techniques", content: "Electron microscopy, immunohistochemistry, in-situ hybridisation and confocal microscopy. Tissue preparation and imaging methods." },
            { title: "Organ System Histology", content: "Microscopic anatomy of organ systems, specialised cell types and tissue architecture across species." },
          ]),
          ...chapters(2, [
            { title: "Developmental Biology", content: "Gametogenesis, fertilisation, cleavage and gastrulation. Organogenesis and fetal membrane development across species." },
            { title: "Applied Embryology", content: "Teratology, developmental anomalies and congenital defects. Embryonic pathology and reproductive failure." },
          ]),
        ],
      },
    ],
  },
  {
    name: "Veterinary Biochemistry",
    code: "VB",
    subjects: [
      {
        name: "Advanced Veterinary Biochemistry",
        code: "VB-601",
        chapters: [
          ...chapters(1, [
            { title: "Molecular Biology of the Cell", content: "Gene expression, signal transduction, cell cycle regulation and apoptosis. Molecular mechanisms of disease in domestic animals." },
            { title: "Metabolic Regulation", content: "Allosteric regulation, covalent modification and gene expression regulation. Metabolic integration and hormonal control." },
          ]),
          ...chapters(2, [
            { title: "Clinical Biochemistry", content: "Diagnostic biochemistry panels, organ-specific markers and disease biomarkers. Interpretation of laboratory results in clinical practice." },
            { title: "Immunobiochemistry", content: "Antibody structure, complement biochemistry, cytokine networks and immune cell signalling. Biochemical aspects of immune responses." },
          ]),
        ],
      },
      {
        name: "Nutritional Biochemistry",
        code: "VB-602",
        chapters: [
          ...chapters(1, [
            { title: "Energy Metabolism", content: "Bioenergetics, ATP production and metabolic pathways. Carbohydrate, lipid and protein catabolism and anabolism." },
            { title: "Vitamin and Coenzyme Biochemistry", content: "Vitamin functions as coenzymes, cofactor requirements and metabolic roles. Biochemical basis of nutritional deficiency diseases." },
          ]),
          ...chapters(2, [
            { title: "Mineral Metabolism", content: "Mineral absorption, transport, storage and excretion. Enzymatic roles of minerals and biochemical effects of deficiency." },
            { title: "Antioxidant Biochemistry", content: "Free radical biology, antioxidant defence systems and oxidative stress. Biochemical markers of oxidative damage in disease." },
          ]),
        ],
      },
    ],
  },
  {
    name: "Veterinary Biotechnology",
    code: "VBT",
    subjects: [
      {
        name: "Molecular Diagnostics",
        code: "VBT-601",
        chapters: [
          ...chapters(1, [
            { title: "PCR and Nucleic Acid Amplification", content: "Conventional PCR, real-time PCR, digital PCR and isothermal amplification. Primer design, optimisation and diagnostic applications." },
            { title: "DNA Sequencing and Genotyping", content: "Sanger sequencing, next-generation sequencing and SNP genotyping. Sequence analysis, variant identification and phylogenetics." },
          ]),
          ...chapters(2, [
            { title: "Recombinant DNA Technology", content: "Cloning vectors, gene expression systems, protein production and genetic engineering. Applications in veterinary diagnostics and therapeutics." },
            { title: "Transgenic and Gene-Edited Animals", content: "Gene editing technologies – CRISPR, TALENs and zinc finger nucleases. Applications, ethics and regulatory frameworks." },
          ]),
        ],
      },
      {
        name: "Veterinary Vaccinology",
        code: "VBT-602",
        chapters: [
          ...chapters(1, [
            { title: "Vaccine Design and Development", content: "Antigen selection, adjuvant development, delivery systems and formulations. Rational vaccine design and reverse vaccinology approaches." },
            { title: "Recombinant and DNA Vaccines", content: "Subunit vaccines, vector vaccines, DNA vaccines and RNA vaccines. Novel vaccine platforms and their advantages." },
          ]),
          ...chapters(2, [
            { title: "Immune Response to Vaccines", content: "Correlates of protection, mucosal immunity and immunological memory. Vaccine immunology and challenge of developing vaccines for diverse species." },
            { title: "Vaccine Production and Quality Control", content: "Cell culture technology, virus propagation, purification and formulation. Good manufacturing practices and vaccine safety assessment." },
          ]),
        ],
      },
    ],
  },
  {
    name: "Veterinary Extension Education",
    code: "VEE",
    subjects: [
      {
        name: "Extension Communication",
        code: "VEE-601",
        chapters: [
          ...chapters(1, [
            { title: "Communication Theory in Extension", content: "Communication models, theories and frameworks for agricultural extension. Information dissemination and knowledge management in livestock sectors." },
            { title: "ICT in Veterinary Extension", content: "Information and communication technology applications, mobile advisory services and digital platforms for veterinary extension." },
          ]),
          ...chapters(2, [
            { title: "Participatory Extension Methods", content: "Participatory rural appraisal, farmer field schools and community-based extension. Participatory technology development and validation." },
            { title: "Extension Programme Evaluation", content: "Monitoring and evaluation frameworks, impact assessment and cost-benefit analysis. Result-based management in extension programmes." },
          ]),
        ],
      },
      {
        name: "Livestock Entrepreneurship Development",
        code: "VEE-602",
        chapters: [
          ...chapters(1, [
            { title: "Entrepreneurship in Livestock", content: "Opportunities in livestock sector, market analysis and business planning. Value chain development and market linkages." },
            { title: "Financial Management for Livestock Enterprises", content: "Budgeting, financial analysis, credit management and risk assessment. Microfinance and cooperative models for small-scale producers." },
          ]),
          ...chapters(2, [
            { title: "Innovation Systems in Livestock", content: "Agricultural innovation systems, knowledge co-creation and technology transfer. Role of universities, research institutions and industry." },
            { title: "Policy and Institutional Analysis", content: "Livestock policies, institutional frameworks and governance. Advocacy, lobbying and policy engagement for livestock development." },
          ]),
        ],
      },
    ],
  },
  {
    name: "Veterinary Medicine",
    code: "VMD",
    subjects: [
      {
        name: "Large Animal Internal Medicine",
        code: "VMD-601",
        chapters: [
          ...chapters(1, [
            { title: "Equine Medicine", content: "Colic, laminitis, respiratory diseases, metabolic disorders and neurological conditions in horses. Emergency care and critical management." },
            { title: "Ruminant Medicine", content: "Production diseases, metabolic disorders, infectious diseases and parasitism in cattle and small ruminants." },
          ]),
          ...chapters(2, [
            { title: "Swine Medicine", content: "Respiratory diseases, reproductive disorders, metabolic diseases and welfare issues in intensive pig production." },
            { title: "Camelid and Miscellaneous Species", content: "Medicine of camelids, deer, llamas and alpacas. Unique species considerations and comparative pathology." },
          ]),
        ],
      },
      {
        name: "Small Animal Internal Medicine",
        code: "VMD-602",
        chapters: [
          ...chapters(1, [
            { title: "Canine Medicine", content: "Cardiovascular, respiratory, gastrointestinal, endocrine and renal diseases in dogs. Diagnostic approach and treatment protocols." },
            { title: "Feline Medicine", content: "Feline-specific diseases, chronic kidney disease, diabetes, hyperthyroidism and feline infectious diseases." },
          ]),
          ...chapters(2, [
            { title: "Dermatology", content: "Allergic dermatitis, parasitic skin diseases, fungal infections and autoimmune skin conditions in small animals." },
            { title: "Oncology", content: "Tumour biology, chemotherapy protocols, radiation therapy and palliative care. Common tumours in dogs and cats." },
          ]),
        ],
      },
      {
        name: "Infectious Diseases",
        code: "VMD-603",
        chapters: [
          ...chapters(1, [
            { title: "Emerging and Re-emerging Diseases", content: "Novel pathogens, disease emergence mechanisms and pandemic preparedness. Surveillance systems and early warning for livestock diseases." },
            { title: "Vector-Borne Diseases", content: "Tick-borne, mosquito-borne and fly-borne diseases. Epidemiology, diagnosis and control of vector-borne infections." },
          ]),
          ...chapters(2, [
            { title: "Antimicrobial Resistance", content: "Resistance mechanisms, surveillance, antimicrobial stewardship and alternatives to antibiotics. Global action plans and implementation." },
            { title: "Immunodeficiency and Immunomediated Diseases", content: "Primary and secondary immunodeficiencies, autoimmune diseases and immune-mediated conditions in domestic animals." },
          ]),
        ],
      },
    ],
  },
  {
    name: "Veterinary Microbiology",
    code: "VM",
    subjects: [
      {
        name: "Advanced Bacteriology",
        code: "VM-601",
        chapters: [
          ...chapters(1, [
            { title: "Bacterial Pathogenesis", content: "Virulence factors, adhesion mechanisms, invasion and toxin production. Host-pathogen interactions and bacterial disease mechanisms." },
            { title: "Bacterial Genetics and Resistance", content: "Horizontal gene transfer, plasmids, transposons and antimicrobial resistance genes. Resistance mechanisms and gene transfer." },
          ]),
          ...chapters(2, [
            { title: "Molecular Identification Methods", content: "MALDI-TOF, whole genome sequencing, MLST and phylogenetic analysis. Rapid identification and epidemiological typing." },
            { title: "Environmental and Zoonotic Bacteriology", content: "Waterborne and foodborne pathogens, environmental reservoirs and transmission dynamics. Public health significance of animal bacteria." },
          ]),
        ],
      },
      {
        name: "Advanced Virology",
        code: "VM-602",
        chapters: [
          ...chapters(1, [
            { title: "Viral Evolution and Ecology", content: "Viral evolution, quasispecies, recombination and reassortment. Ecological determinants of viral emergence and spillover events." },
            { title: "Viral Immunology", content: "Immune evasion strategies, viral persistence and latency. Mucosal immunity and vaccination strategies for viral diseases." },
          ]),
          ...chapters(2, [
            { title: "Molecular Virology", content: "Reverse genetics, viral vector systems, reverse transcriptase PCR and quantitative viral assays. Molecular diagnostics for viral infections." },
            { title: "Emerging Viral Diseases", content: "Coronaviruses, flaviviruses, paramyxoviruses and novel viral threats. Surveillance, detection and response to emerging viral infections." },
          ]),
        ],
      },
      {
        name: "Medical Mycology",
        code: "VM-603",
        chapters: [
          ...chapters(1, [
            { title: "Fungal Pathogenesis", content: "Mycotic virulence factors, immune evasion and host-pathogen interaction. Opportunistic and systemic fungal infections in animals." },
            { title: "Diagnostic Mycology", content: "Culture methods, molecular identification, serological assays and antifungal susceptibility testing." },
          ]),
          ...chapters(2, [
            { title: "Antifungal Therapy", content: "Antifungal drug classes, mechanisms of action and resistance. Treatment protocols and clinical management of fungal infections." },
            { title: "Zoonotic Mycoses", content: "Dermatophytosis, sporotrichosis, histoplasmosis and other zoonotic fungal infections. Public health aspects of mycotic diseases." },
          ]),
        ],
      },
    ],
  },
  {
    name: "Veterinary Parasitology",
    code: "VP",
    subjects: [
      {
        name: "Advanced Helminthology",
        code: "VP-601",
        chapters: [
          ...chapters(1, [
            { title: "Helminth Taxonomy and Systematics", content: "Classification, morphology and molecular identification of veterinary helminths. Phylogenetic relationships and taxonomy." },
            { title: "Host-Parasite Interactions", content: "Immune responses to helminths, evasion mechanisms and acquired immunity. Immunopathology and hypersensitivity reactions." },
          ]),
          ...chapters(2, [
            { title: "Molecular Parasitology", content: "DNA-based identification, population genetics and phylogeography. Molecular markers for species delimitation and epidemiological studies." },
            { title: "Integrated Parasite Control", content: "Refugia-based strategies, targeted selective treatment and sustainable parasite management. Economic impact and decision support tools." },
          ]),
        ],
      },
      {
        name: "Veterinary Entomology",
        code: "VP-602",
        chapters: [
          ...chapters(1, [
            { title: "Arthropod Biology", content: "Morphology, life cycles and ecology of ticks, mites, lice, fleas and flies of veterinary importance." },
            { title: "Vector-Borne Disease Transmission", content: "Pathogen-vector interactions, transmission dynamics and epidemiology of vector-borne diseases." },
          ]),
          ...chapters(2, [
            { title: "Ectoparasite Control Strategies", content: "Chemical, biological and cultural control methods. Resistance management and integrated pest management." },
            { title: "Forensic Entomology", content: "Applications of entomology in forensic investigations, insect succession and post-mortem interval estimation." },
          ]),
        ],
      },
      {
        name: "Veterinary Protozoology",
        code: "VP-603",
        chapters: [
          ...chapters(1, [
            { title: "Protozoan Biology and Pathogenesis", content: "Cell biology, life cycles and virulence mechanisms of protozoan parasites. Host-parasite relationships and tissue tropism." },
            { title: "Molecular Diagnostics for Protozoa", content: "PCR-based detection, sequencing methods and epidemiological applications. Genotyping and population structure studies." },
          ]),
          ...chapters(2, [
            { title: "Antiprotozoal Chemotherapy", content: "Drug classes, mechanisms of action and resistance. Treatment protocols and combination therapy for protozoal infections." },
            { title: "Emerging Protozoal Diseases", content: "Novel protozoal infections, foodborne protozoa and waterborne outbreaks. Surveillance and public health significance." },
          ]),
        ],
      },
    ],
  },
  {
    name: "Veterinary Pathology",
    code: "VPA",
    subjects: [
      {
        name: "Advanced Veterinary Pathology",
        code: "VPA-601",
        chapters: [
          ...chapters(1, [
            { title: "Molecular Pathology", content: "Molecular mechanisms of disease, gene expression in pathology and biomarker discovery. Transcriptomics and proteomics in disease research." },
            { title: "Comparative Oncology", content: "Tumour biology across species, comparative oncology and cancer genetics. Spontaneous animal tumours as models for human cancer." },
          ]),
          ...chapters(2, [
            { title: "Immunopathology", content: "Immune-mediated diseases, hypersensitivity reactions and autoimmunity. Diagnostic immunohistochemistry and molecular pathology." },
            { title: "Toxicologic Pathology", content: "Organ-specific toxicity, dose-response relationships and mechanisms of toxic injury. Regulatory toxicology and safety assessment." },
          ]),
        ],
      },
      {
        name: "Diagnostic Pathology",
        code: "VPA-602",
        chapters: [
          ...chapters(1, [
            { title: "Advanced Histopathology", content: "Special stains, immunohistochemistry, in-situ hybridisation and digital pathology. Automated image analysis and artificial intelligence." },
            { title: "Cytopathology", content: "Fine needle aspiration cytology, exfoliative cytology and liquid-based cytology. Diagnostic criteria and reporting systems." },
          ]),
          ...chapters(2, [
            { title: "Molecular Diagnostics in Pathology", content: "PCR-based pathology, FISH, next-generation sequencing and mutation analysis. Integration of molecular and morphological diagnosis." },
            { title: "Laboratory Management and Quality Assurance", content: "Laboratory accreditation, quality control, proficiency testing and safety. Standard operating procedures and documentation." },
          ]),
        ],
      },
    ],
  },
  {
    name: "Veterinary Pharmacology & Toxicology",
    code: "VPT",
    subjects: [
      {
        name: "Clinical Pharmacology",
        code: "VPT-601",
        chapters: [
          ...chapters(1, [
            { title: "Rational Drug Therapy", content: "Evidence-based pharmacotherapy, drug selection criteria and treatment protocols. Clinical pharmacokinetics and therapeutic drug monitoring." },
            { title: "Drug Interactions and Adverse Reactions", content: "Pharmacokinetic and pharmacodynamic drug interactions. Adverse drug reactions, idiosyncrasy and drug allergy in animals." },
          ]),
          ...chapters(2, [
            { title: "Pharmacotherapy of Infectious Diseases", content: "Antimicrobial stewardship, resistance-guided therapy and combination strategies. Pharmacokinetic/pharmacodynamic modelling for antimicrobials." },
            { title: "Pharmacotherapy of Chronic Diseases", content: "Long-term drug therapy for metabolic, cardiovascular and autoimmune diseases. Patient monitoring and dose adjustment strategies." },
          ]),
        ],
      },
      {
        name: "Veterinary Toxicology",
        code: "VPT-602",
        chapters: [
          ...chapters(1, [
            { title: "Toxicokinetics", content: "Absorption, distribution, metabolism and excretion of toxicants. Dose-response relationships and toxicological risk assessment." },
            { title: "Organ Toxicology", content: "Hepatotoxicity, nephrotoxicity, neurotoxicity, haematotoxicity and reproductive toxicity. Mechanisms and diagnostic indicators." },
          ]),
          ...chapters(2, [
            { title: "Natural Toxins", content: "Plant toxins, mycotoxins, marine toxins and venomous animal toxins. Identification, clinical effects and management of natural toxicoses." },
            { title: "Chemical Toxicology", content: "Pesticide toxicology, heavy metal poisoning, drug residues and environmental contaminants. Analytical methods and regulatory standards." },
          ]),
        ],
      },
    ],
  },
  {
    name: "Veterinary Physiology",
    code: "VPH",
    subjects: [
      {
        name: "Advanced Veterinary Physiology",
        code: "VPH-601",
        chapters: [
          ...chapters(1, [
            { title: "Cellular and Molecular Physiology", content: "Ion channels, signal transduction, gene regulation and cell signalling pathways. Molecular mechanisms of physiological processes." },
            { title: "Integrative Physiology", content: "Systems integration, neural control, hormonal regulation and homeostatic mechanisms. Exercise physiology and environmental adaptation." },
          ]),
          ...chapters(2, [
            { title: "Comparative Physiology", content: "Species differences in physiological processes, evolutionary adaptations and physiological ecology. Adaptation to extreme environments." },
            { title: "Applied Veterinary Physiology", content: "Physiological basis of disease, performance physiology and welfare physiology. Applications in clinical diagnosis and management." },
          ]),
        ],
      },
      {
        name: "Reproductive Physiology",
        code: "VPH-602",
        chapters: [
          ...chapters(1, [
            { title: "Advanced Reproductive Neuroendocrinology", content: "GnRH pulse generator, kisspeptin neurons, photoperiodism and seasonal breeding. Neural control of reproductive function." },
            { title: "Uterine Physiology", content: "Endometrial function, implantation biology, placental physiology and fetal-maternal communication." },
          ]),
          ...chapters(2, [
            { title: "Testicular Physiology", content: "Spermatogenesis regulation, blood-testis barrier and Sertoli cell function. Temperature effects and testicular thermoregulation." },
            { title: "Lactation Biology", content: "Mammary gland development, milk protein and fat synthesis, prolactin signalling and lactation management." },
          ]),
        ],
      },
    ],
  },
  {
    name: "Veterinary Public Health & Epidemiology",
    code: "VPH_E",
    subjects: [
      {
        name: "Epidemiology and Disease Surveillance",
        code: "VPH_E-601",
        chapters: [
          ...chapters(1, [
            { title: "Advanced Epidemiological Methods", content: "Study design, statistical analysis, multilevel modelling and spatial epidemiology. Meta-analysis and systematic reviews." },
            { title: "Disease Modelling", content: "Mathematical modelling of disease transmission, compartmental models and parameter estimation. Predictive modelling for disease control." },
          ]),
          ...chapters(2, [
            { title: "One Health Epidemiology", content: "Integrated surveillance across human, animal and environmental health sectors. Multi-disciplinary approaches to disease investigation." },
            { title: "Risk Assessment and Management", content: "Quantitative risk assessment, hazard identification and risk communication. Regulatory frameworks for food safety and animal health." },
          ]),
        ],
      },
      {
        name: "Zoonotic Diseases",
        code: "VPH_E-602",
        chapters: [
          ...chapters(1, [
            { title: "Emerging Zoonoses", content: "Novel zoonotic pathogens, spillover events and pandemic preparedness. Surveillance, detection and response to emerging threats." },
            { title: "Foodborne Zoonoses", content: "Salmonella, Campylobacter, Listeria and E. coli O157:H7. Source attribution, risk factors and control along the food chain." },
          ]),
          ...chapters(2, [
            { title: "Vector-Borne Zoonoses", content: "West Nile virus, Rift Valley fever, Crimean-Congo haemorrhagic fever and Lyme disease. Vector ecology and control strategies." },
            { title: "Neglected Zoonotic Diseases", content: "Brucellosis, rabies, cysticercosis, echinococcosis and leishmaniasis. Global burden and integrated control approaches." },
          ]),
        ],
      },
    ],
  },
  {
    name: "Veterinary Surgery & Radiology",
    code: "VSR",
    subjects: [
      {
        name: "Advanced Veterinary Surgery",
        code: "VSR-601",
        chapters: [
          ...chapters(1, [
            { title: "Surgical Oncology", content: "Tumour surgery, margins, reconstructive surgery and oncological principles. Surgical approach to common tumour locations." },
            { title: "Minimally Invasive Surgery", content: "Laparoscopy, thoracoscopy, arthroscopy and endoscopy. Equipment, techniques and indications for minimally invasive procedures." },
          ]),
          ...chapters(2, [
            { title: "Advanced Orthopaedic Surgery", content: "Joint replacement, arthroplasty, spinal surgery and fracture fixation. Advanced implants and biological fixation methods." },
            { title: "Neurosurgery", content: "Craniotomy, hemilaminectomy, ventral slot and brain surgery. Spinal cord compression and neurological decompression." },
          ]),
        ],
      },
      {
        name: "Advanced Veterinary Radiology",
        code: "VSR-602",
        chapters: [
          ...chapters(1, [
            { title: "Advanced Imaging Modalities", content: "CT, MRI, nuclear medicine and PET scanning in veterinary practice. Indications, protocols and image interpretation." },
            { title: "Interventional Radiology", content: "Fluoroscopy-guided procedures, angiography, stent placement and embolisation. Minimally invasive image-guided interventions." },
          ]),
          ...chapters(2, [
            { title: "Ultrasonographic Techniques", content: "Advanced ultrasonography including Doppler, contrast-enhanced and 3D/4D imaging. Echo-guided procedures and quantitative analysis." },
            { title: "Radiation Safety and Physics", content: "Radiation protection, dose limits, shielding and quality assurance. X-ray physics, image quality and optimisation." },
          ]),
        ],
      },
    ],
  },
];

// ─── Mock Test Data ─────────────────────────────────────────────────────────

const MOCK_TESTS = [
  {
    title: "Veterinary Anatomy – Bone and Joint Basics",
    description: "Test your knowledge of osteology and arthrology fundamentals.",
    duration: 30,
    totalMarks: 10,
    subjectCode: "VAN-101",
    questions: [
      { text: "How many cervical vertebrae does a horse have?", options: JSON.stringify(["5", "7", "9", "12"]), correctAnswer: 1, marks: 2, explanation: "Horses, like most mammals, have 7 cervical vertebrae." },
      { text: "Which bone is commonly called the kneecap?", options: JSON.stringify(["Humerus", "Femur", "Patella", "Tibia"]), correctAnswer: 2, marks: 2, explanation: "The patella is the sesamoid bone found within the quadriceps tendon, commonly known as the kneecap." },
      { text: "What type of joint is the elbow?", options: JSON.stringify(["Ball and socket", "Hinge joint", "Pivot joint", "Gliding joint"]), correctAnswer: 1, marks: 2, explanation: "The elbow is a hinge joint allowing flexion and extension." },
      { text: "Which is the largest bone in the body of a cow?", options: JSON.stringify(["Femur", "Tibia", "Pelvis", "Humerus"]), correctAnswer: 0, marks: 2, explanation: "The femur is the largest and strongest bone in the body of most domestic animals." },
      { text: "The atlas is the _____ cervical vertebra.", options: JSON.stringify(["1st", "2nd", "3rd", "7th"]), correctAnswer: 0, marks: 2, explanation: "The atlas (C1) is the first cervical vertebra that articulates with the skull." },
    ],
  },
  {
    title: "Veterinary Physiology – Blood and Circulation",
    description: "Test your understanding of cardiovascular physiology.",
    duration: 25,
    totalMarks: 10,
    subjectCode: "VPH-101",
    questions: [
      { text: "What is the normal heart rate range for an adult cow at rest?", options: JSON.stringify(["40-80 bpm", "80-120 bpm", "120-160 bpm", "160-200 bpm"]), correctAnswer: 0, marks: 2, explanation: "The normal resting heart rate for cattle is 40-80 beats per minute." },
      { text: "Which blood cells are primarily involved in immune defense?", options: JSON.stringify(["Erythrocytes", "Platelets", "Leucocytes", "Thrombocytes"]), correctAnswer: 2, marks: 2, explanation: "Leucocytes (white blood cells) are the primary cells of the immune system." },
      { text: "What is the main function of haemoglobin?", options: JSON.stringify(["Clotting", "Oxygen transport", "Immune defense", "Nutrient transport"]), correctAnswer: 1, marks: 2, explanation: "Haemoglobin binds oxygen in the lungs and delivers it to tissues throughout the body." },
      { text: "Which chamber of the heart pumps blood to the lungs?", options: JSON.stringify(["Left ventricle", "Right ventricle", "Left atrium", "Right atrium"]), correctAnswer: 1, marks: 2, explanation: "The right ventricle pumps deoxygenated blood to the lungs through the pulmonary artery." },
      { text: "What is the normal blood pH range in domestic animals?", options: JSON.stringify(["6.8-7.0", "7.2-7.4", "7.4-7.6", "7.6-7.8"]), correctAnswer: 1, marks: 2, explanation: "Normal blood pH in domestic animals ranges from 7.2-7.4." },
    ],
  },
  {
    title: "Animal Nutrition – Feed and Nutrients",
    description: "Test your knowledge of animal nutrition and feed evaluation.",
    duration: 20,
    totalMarks: 10,
    subjectCode: "VAN-201",
    questions: [
      { text: "What is crude protein (CP) measured by?", options: JSON.stringify(["Fat content", "Nitrogen content × 6.25", "Fibre content", "Ash content"]), correctAnswer: 1, marks: 2, explanation: "Crude protein is estimated by multiplying nitrogen content by 6.25 (based on average protein nitrogen content of 16%)." },
      { text: "Which vitamin is synthesised by rumen microbes?", options: JSON.stringify(["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"]), correctAnswer: 1, marks: 2, explanation: "Rumen microorganisms synthesise B-complex vitamins including B12 (cobalamin)." },
      { text: "What is the most energy-dense nutrient?", options: JSON.stringify(["Carbohydrates", "Proteins", "Fats", "Fibre"]), correctAnswer: 2, marks: 2, explanation: "Fats (lipids) provide approximately 9 kcal/g compared to 4 kcal/g for carbohydrates and proteins." },
      { text: "Which mineral is essential for milk production in dairy cows?", options: JSON.stringify(["Iron", "Calcium", "Zinc", "Copper"]), correctAnswer: 1, marks: 2, explanation: "Calcium is crucial for milk production and bone health; deficiency causes milk fever (hypocalcaemia)." },
      { text: "What does ADF stand for in feed analysis?", options: JSON.stringify(["Acid Detergent Fibre", "Animal Digestible Feed", "Average Digestible Fraction", "Acid Digestible Fat"]), correctAnswer: 0, marks: 2, explanation: "ADF (Acid Detergent Fibre) measures cellulose, lignin and silica – indicating digestibility of a feed." },
    ],
  },
  {
    title: "Animal Breeding – Genetics Fundamentals",
    description: "Test your understanding of genetic principles in animal breeding.",
    duration: 30,
    totalMarks: 10,
    subjectCode: "AB-201",
    questions: [
      { text: "What is heritability in animal breeding?", options: JSON.stringify(["Total genetic variance", "Ratio of additive genetic variance to phenotypic variance", "Ratio of genetic to environmental variance", "Total phenotypic variance"]), correctAnswer: 1, marks: 2, explanation: "Heritability (h²) is the proportion of phenotypic variance attributable to additive genetic variance." },
      { text: "What does heterosis refer to?", options: JSON.stringify(["Inbreeding depression", "Hybrid vigour", "Genetic drift", "Natural selection"]), correctAnswer: 1, marks: 2, explanation: "Heterosis (hybrid vigour) is the superior performance of crossbred offspring over the average of purebred parents." },
      { text: "Which mating system increases homozygosity?", options: JSON.stringify(["Outcrossing", "Crossbreeding", "Inbreeding", "Grading"]), correctAnswer: 2, marks: 2, explanation: "Inbreeding increases homozygosity and can lead to inbreeding depression." },
      { text: "The Hardy-Weinberg equilibrium assumes:", options: JSON.stringify(["Large population, random mating, no selection", "Small population, random mating", "Any population with selection", "Large population with mutation"]), correctAnswer: 0, marks: 2, explanation: "Hardy-Weinberg equilibrium requires large population size, random mating, no selection, no mutation and no migration." },
      { text: "BLUP stands for:", options: JSON.stringify(["Best Linear Unbiased Prediction", "Basic Linear Unbiased Procedure", "Biological Lineage Unbiased Prediction", "Breeding Line Uniform Production"]), correctAnswer: 0, marks: 2, explanation: "BLUP (Best Linear Unbiased Prediction) is a statistical method for estimating breeding values." },
    ],
  },
  {
    title: "Animal Reproduction – AI and Breeding",
    description: "Test your knowledge of artificial insemination and reproductive technologies.",
    duration: 25,
    totalMarks: 10,
    subjectCode: "VRE-201",
    questions: [
      { text: "What is the average gestation period of a cow?", options: JSON.stringify(["9 months", "9.5 months", "10 months", "11 months"]), correctAnswer: 1, marks: 2, explanation: "The gestation period of cattle is approximately 283 days (about 9.5 months)." },
      { text: "What is the preferred site for AI in cattle?", options: JSON.stringify(["Cervix", "Mid-cervical", "Uterine body", "Uterine horn"]), correctAnswer: 2, marks: 2, explanation: "Deep uterine insemination deposits semen in the uterine body for optimal conception rates." },
      { text: "What is the main function of the zona pellucida?", options: JSON.stringify(["Nutrient supply", "Species-specific sperm binding", "Hormone production", "Implantation support"]), correctAnswer: 1, marks: 2, explanation: "The zona pellucida is a glycoprotein layer that mediates species-specific sperm-egg binding." },
      { text: "At what temperature should frozen semen be stored in liquid nitrogen?", options: JSON.stringify(["-20°C", "-80°C", "-196°C", "-273°C"]), correctAnswer: 2, marks: 2, explanation: "Frozen semen is stored in liquid nitrogen at -196°C for long-term preservation." },
      { text: "What is the oestrus cycle length in mares?", options: JSON.stringify(["14 days", "18-24 days", "21 days", "28 days"]), correctAnswer: 1, marks: 2, explanation: "The oestrus cycle in mares is approximately 18-24 days, varying with breed and season." },
    ],
  },
  {
    title: "Veterinary Pharmacology – Drug Basics",
    description: "Test your knowledge of pharmacological principles.",
    duration: 25,
    totalMarks: 10,
    subjectCode: "VPH-201",
    questions: [
      { text: "What is the therapeutic index?", options: JSON.stringify(["Dose per kg body weight", "Ratio of toxic dose to effective dose", "Time to reach steady state", "Drug concentration in blood"]), correctAnswer: 1, marks: 2, explanation: "Therapeutic index (TI) = TD50/ED50 – a higher TI indicates a safer drug." },
      { text: "Which route has the highest bioavailability?", options: JSON.stringify(["Oral", "Subcutaneous", "Intravenous", "Intramuscular"]), correctAnswer: 2, marks: 2, explanation: "Intravenous administration has 100% bioavailability as the drug is delivered directly into the bloodstream." },
      { text: "What is the first-pass effect?", options: JSON.stringify(["Rapid drug action", "Hepatic metabolism before systemic circulation", "Kidney filtration", "Drug absorption in intestine"]), correctAnswer: 1, marks: 2, explanation: "First-pass metabolism occurs when drugs absorbed from the GI tract are metabolised by the liver before reaching systemic circulation." },
      { text: "NSAIDs primarily inhibit which enzyme?", options: JSON.stringify(["Cyclooxygenase (COX)", "Lipoxygenase", "Phospholipase A2", "ACE"]), correctAnswer: 0, marks: 2, explanation: "NSAIDs inhibit cyclooxygenase (COX) enzymes, reducing prostaglandin synthesis." },
      { text: "Which drug class is used to treat roundworm infections?", options: JSON.stringify(["Antibiotics", "Anthelmintics", "Antifungals", "NSAIDs"]), correctAnswer: 1, marks: 2, explanation: "Anthelmintics are drugs used to treat parasitic worm infections including roundworms." },
    ],
  },
  {
    title: "Preventive Medicine – Vaccination",
    description: "Test your knowledge of immunisation and disease prevention.",
    duration: 20,
    totalMarks: 10,
    subjectCode: "VPM-201",
    questions: [
      { text: "What is the primary purpose of vaccination?", options: JSON.stringify(["Treatment of disease", "Prevention of disease", "Diagnosis of disease", "Eradication of disease"]), correctAnswer: 1, marks: 2, explanation: "Vaccination is primarily a preventive measure to stimulate immunity against specific pathogens." },
      { text: "Which vaccine type contains killed organisms?", options: JSON.stringify(["Live attenuated", "Inactivated (killed)", "Subunit", "DNA vaccine"]), correctAnswer: 1, marks: 2, explanation: "Inactivated (killed) vaccines contain whole organisms that have been killed by chemicals or heat." },
      { text: "What is a booster vaccination?", options: JSON.stringify(["First vaccine dose", "Subsequent dose to strengthen immunity", "Vaccine given during illness", "Emergency vaccination"]), correctAnswer: 1, marks: 2, explanation: "Booster doses are given after the primary vaccination series to strengthen and maintain immunity." },
      { text: "Cold chain refers to:", options: JSON.stringify(["Room temperature storage", "Maintaining vaccines at recommended temperatures", "Refrigerator equipment", "Transport of vaccines"]), correctAnswer: 1, marks: 2, explanation: "Cold chain refers to the system of maintaining vaccines at recommended temperatures from production to administration." },
      { text: "Which is NOT a route of vaccine administration?", options: JSON.stringify(["Intramuscular", "Subcutaneous", "Intravenous", "Oral"]), correctAnswer: 2, marks: 2, explanation: "Vaccines are generally NOT given intravenously as this can cause severe reactions and doesn't produce effective immunity." },
    ],
  },
  {
    title: "Veterinary Medicine – Common Diseases",
    description: "Test your knowledge of common livestock diseases.",
    duration: 30,
    totalMarks: 10,
    subjectCode: "VME-201",
    questions: [
      { text: "What is the causative agent of Blackleg in cattle?", options: JSON.stringify(["Clostridium perfringens", "Clostridium chauvoei", "Bacillus anthracis", "Mycobacterium bovis"]), correctAnswer: 1, marks: 2, explanation: "Clostridium chauvoei is the primary causative agent of blackleg (clostridial myositis) in cattle." },
      { text: "Milk fever in dairy cows is caused by:", options: JSON.stringify(["High calcium", "Low calcium", "High phosphorus", "Low magnesium"]), correctAnswer: 1, marks: 2, explanation: "Milk fever (parturient hypocalcaemia) is caused by low blood calcium around the time of calving." },
      { text: "What is the characteristic lesion of Foot and Mouth Disease?", options: JSON.stringify(["Pneumonia", "Vesicles on mouth and feet", "Liver damage", "Kidney failure"]), correctAnswer: 1, marks: 2, explanation: "FMD causes characteristic vesicles (blisters) on the oral mucosa, feet and teats." },
      { text: "Rabies is primarily transmitted through:", options: JSON.stringify(["Airborne route", "Bite of infected animal", "Contaminated feed", "Direct contact"]), correctAnswer: 1, marks: 2, explanation: "Rabies is primarily transmitted through the saliva of infected animals via bites." },
      { text: "Johne's disease affects which system primarily?", options: JSON.stringify(["Respiratory", "Digestive", "Nervous", "Reproductive"]), correctAnswer: 1, marks: 2, explanation: "Johne's disease (paratuberculosis) primarily affects the intestines, causing chronic diarrhoea and weight loss." },
    ],
  },
  {
    title: "Veterinary Surgery – Principles",
    description: "Test your knowledge of surgical principles and techniques.",
    duration: 25,
    totalMarks: 10,
    subjectCode: "VSU-201",
    questions: [
      { text: "What is the ideal suture pattern for skin closure?", options: JSON.stringify(["Continuous", "Simple interrupted", "Subcuticular", "All interrupted"]), correctAnswer: 1, marks: 2, explanation: "Simple interrupted sutures provide excellent wound apposition and are easy to remove if needed." },
      { text: "Which material is commonly used for absorbable sutures?", options: JSON.stringify(["Nylon", "Polypropylene", "Polyglactin 910", "Silk"]), correctAnswer: 2, marks: 2, explanation: "Polyglactin 910 (Vicryl) is a commonly used synthetic absorbable suture material." },
      { text: "Aseptic technique aims to:", options: JSON.stringify(["Kill all bacteria", "Prevent wound infection", "Promote healing", "All of the above"]), correctAnswer: 3, marks: 2, explanation: "Aseptic technique encompasses all measures to prevent contamination and infection of surgical wounds." },
      { text: "What is the minimum duration for surgical scrub of hands?", options: JSON.stringify(["1 minute", "3 minutes", "5 minutes", "10 minutes"]), correctAnswer: 2, marks: 2, explanation: "Surgical hand scrubbing should last at least 5 minutes with antimicrobial soap." },
      { text: "Caesarean section is indicated when:", options: JSON.stringify(["Normal labour", "Dystocia uncorrectable by manipulation", "Fetal death", "All of the above"]), correctAnswer: 3, marks: 2, explanation: "Caesarean section is indicated for uncorrectable dystocia, fetal death causing maternal risk, and other emergencies." },
    ],
  },
  {
    title: "Veterinary Public Health – Food Safety",
    description: "Test your knowledge of food safety and zoonotic diseases.",
    duration: 20,
    totalMarks: 10,
    subjectCode: "VPM-201",
    questions: [
      { text: "HACCP stands for:", options: JSON.stringify(["Hazard Analysis Critical Control Points", "Health Assessment and Control Check Points", "Hygiene and Contamination Control Programme", "Hazard Assessment and Control Procedures"]), correctAnswer: 0, marks: 2, explanation: "HACCP (Hazard Analysis Critical Control Points) is a systematic approach to food safety." },
      { text: "Which is a common foodborne zoonotic pathogen?", options: JSON.stringify(["Escherichia coli O157:H7", "Clostridium chauvoei", "Mycoplasma bovis", "Bordetella bronchiseptica"]), correctAnswer: 0, marks: 2, explanation: "E. coli O157:H7 is a major foodborne pathogen that can cause severe disease in humans." },
      { text: "What is the safe internal cooking temperature for poultry?", options: JSON.stringify(["60°C", "65°C", "74°C", "85°C"]), correctAnswer: 2, marks: 2, explanation: "Poultry should be cooked to an internal temperature of at least 74°C (165°F) to kill harmful bacteria." },
      { text: "Ante-mortem inspection is performed:", options: JSON.stringify(["After slaughter", "Before slaughter", "During processing", "At retail"]), correctAnswer: 1, marks: 2, explanation: "Ante-mortem inspection is the examination of animals before slaughter to identify diseases and fitness for human consumption." },
      { text: "Which zoonotic disease is transmitted through unpasteurised milk?", options: JSON.stringify(["Rabies", "Brucellosis", "Anthrax", "Tuberculosis"]), correctAnswer: 1, marks: 2, explanation: "Brucellosis can be transmitted to humans through consumption of unpasteurised milk and dairy products." },
    ],
  },
  {
    title: "BVSc Anatomy – Limb and Head",
    description: "Advanced anatomy test for BVSc students.",
    duration: 35,
    totalMarks: 10,
    subjectCode: "VAN-301",
    questions: [
      { text: "The brachial plexus is formed by which spinal nerves?", options: JSON.stringify(["C1-C4", "C5-T2", "T3-L3", "L4-S3"]), correctAnswer: 1, marks: 2, explanation: "The brachial plexus is formed by the ventral branches of C5-T2 (or C6-T1 in some species) spinal nerves." },
      { text: "Which muscle is responsible for the stay apparatus in the hind limb of a horse?", options: JSON.stringify(["Semitendinosus", "Quadriceps femoris", "Gastrocnemius", "Tensor fasciae latae"]), correctAnswer: 1, marks: 2, explanation: "The quadriceps femoris, along with the stifle locking mechanism, is a key component of the hind limb stay apparatus." },
      { text: "The foramen magnum is an opening in which bone?", options: JSON.stringify(["Maxilla", "Occipital bone", "Temporal bone", "Parietal bone"]), correctAnswer: 1, marks: 2, explanation: "The foramen magnum is a large opening in the occipital bone through which the spinal cord passes." },
      { text: "Which cranial nerve controls tongue movement?", options: JSON.stringify(["Trigeminal (V)", "Facial (VII)", "Hypoglossal (XII)", "Glossopharyngeal (IX)"]), correctAnswer: 2, marks: 2, explanation: "The hypoglossal nerve (CN XII) provides motor innervation to the tongue muscles." },
      { text: "The supraspinatus muscle is innervated by:", options: JSON.stringify(["Radial nerve", "Axillary nerve", "Musculocutaneous nerve", "Suprascapular nerve"]), correctAnswer: 3, marks: 2, explanation: "The supraspinatus muscle is innervated by the suprascapular nerve." },
    ],
  },
  {
    title: "BVSc Pathology – Cell Injury",
    description: "Test your knowledge of general pathology.",
    duration: 30,
    totalMarks: 10,
    subjectCode: "VPA-401",
    questions: [
      { text: "Which is an example of reversible cell injury?", options: JSON.stringify(["Necrosis", "Apoptosis", "Cellular swelling", "Karyorrhexis"]), correctAnswer: 2, marks: 2, explanation: "Cellular swelling (hydropic change) is an early, reversible form of cell injury." },
      { text: "Apoptosis is characterised by:", options: JSON.stringify(["Inflammation", "Cell membrane rupture", "Shrinkage and fragmentation", "Enzymatic digestion"]), correctAnswer: 2, marks: 2, explanation: "Apoptosis is programmed cell death characterised by cell shrinkage, chromatin condensation and membrane-bound apoptotic bodies." },
      { text: "Which type of necrosis is associated with pancreatitis?", options: JSON.stringify(["Coagulative", "Liquefactive", "Fat necrosis", "Caseous"]), correctAnswer: 2, marks: 2, explanation: "Fat necrosis is commonly associated with pancreatitis due to release of pancreatic lipases." },
      { text: "Amyloidosis is characterised by deposition of:", options: JSON.stringify(["Collagen", "Amyloid protein", "Calcium", "Glycogen"]), correctAnswer: 1, marks: 2, explanation: "Amyloidosis involves the extracellular deposition of insoluble amyloid fibrillar protein in various tissues." },
      { text: "Which is a feature of acute inflammation?", options: JSON.stringify(["Fibrosis", "Neutrophil infiltration", "Granuloma formation", "Lymphocyte predominance"]), correctAnswer: 1, marks: 2, explanation: "Acute inflammation is characterised by neutrophil infiltration, vascular changes and oedema." },
    ],
  },
];

// ─── Main Seed Function ─────────────────────────────────────────────────────

async function main() {
  console.log("Starting database seed...");

  // Clean existing data
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE "UserProgress", "MockTestAttempt", "Question", "MockTest",
      "StudyMaterial", "FlashcardProgress", "Consultation", "Expert", "Payment",
      "Chapter", "Subject", "Department", "Programme", "User" CASCADE
  `);
  console.log("Existing data cleaned.");

  // ── Programmes ──────────────────────────────────────────────────────────

  const ahdp = await prisma.programme.create({
    data: {
      name: "AHDP",
      fullName: "Animal Husbandry Diploma Programme",
      yearType: "semester",
      icon: "BookOpen",
    },
  });

  const bvsc = await prisma.programme.create({
    data: {
      name: "BVSC",
      fullName: "Bachelor of Veterinary Science & Animal Husbandry",
      yearType: "year",
      icon: "GraduationCap",
    },
  });

  const mvsc = await prisma.programme.create({
    data: {
      name: "MVSC",
      fullName: "Master of Veterinary Science",
      yearType: "department",
      icon: "FlaskConical",
    },
  });

  const phd = await prisma.programme.create({
    data: {
      name: "PHD",
      fullName: "Doctor of Philosophy in Veterinary Science",
      yearType: "department",
      icon: "Stethoscope",
    },
  });

  console.log("Programmes created!");

  // ── AHDP Subjects and Chapters ──────────────────────────────────────────

  for (const subj of AHDP_SUBJECTS) {
    const created = await prisma.subject.create({
      data: {
        code: subj.code,
        name: subj.name,
        year: subj.year,
        semester: subj.semester,
        programmeId: ahdp.id,
      },
    });

    for (const ch of subj.chapters) {
      await prisma.chapter.create({
        data: {
          title: ch.title,
          content: ch.content,
          unitNumber: ch.unitNumber,
          subjectId: created.id,
        },
      });
    }
  }

  console.log(`AHDP subjects created (${AHDP_SUBJECTS.length} subjects with chapters).`);

  // ── BVSc Subjects and Chapters ──────────────────────────────────────────

  for (const subj of BVSC_SUBJECTS) {
    const created = await prisma.subject.create({
      data: {
        code: subj.code,
        name: subj.name,
        year: subj.year,
        paper: subj.paper,
        programmeId: bvsc.id,
      },
    });

    for (const ch of subj.chapters) {
      await prisma.chapter.create({
        data: {
          title: ch.title,
          content: ch.content,
          unitNumber: ch.unitNumber,
          subjectId: created.id,
        },
      });
    }
  }

  console.log(`BVSc subjects created (${BVSC_SUBJECTS.length} subjects with chapters).`);

  // ── MVSc Departments, Subjects and Chapters ─────────────────────────────

  const mvscDeptIds: string[] = [];

  for (const dept of MVSC_PHD_DEPARTMENTS) {
    const createdDept = await prisma.department.create({
      data: {
        name: dept.name,
        code: dept.code,
        programmeId: mvsc.id,
      },
    });
    mvscDeptIds.push(createdDept.id);

    for (const subj of dept.subjects) {
      const createdSubj = await prisma.subject.create({
        data: {
          code: subj.code,
          name: subj.name,
          year: "1st Year",
          programmeId: mvsc.id,
          departmentId: createdDept.id,
        },
      });

      for (const ch of subj.chapters) {
        await prisma.chapter.create({
          data: {
            title: ch.title,
            content: ch.content,
            unitNumber: ch.unitNumber,
            subjectId: createdSubj.id,
          },
        });
      }
    }
  }

  console.log(`MVSc departments created (${mvscDeptIds.length} departments with subjects).`);

  // ── PhD Departments, Subjects and Chapters ──────────────────────────────

  const phdDeptIds: string[] = [];

  for (const dept of MVSC_PHD_DEPARTMENTS) {
    const createdDept = await prisma.department.create({
      data: {
        name: dept.name,
        code: dept.code,
        programmeId: phd.id,
      },
    });
    phdDeptIds.push(createdDept.id);

    for (const subj of dept.subjects) {
      const createdSubj = await prisma.subject.create({
        data: {
          code: subj.code + "-PHD",
          name: subj.name + " (PhD)",
          year: "1st Year",
          programmeId: phd.id,
          departmentId: createdDept.id,
        },
      });

      for (const ch of subj.chapters) {
        await prisma.chapter.create({
          data: {
            title: ch.title,
            content: ch.content,
            unitNumber: ch.unitNumber,
            subjectId: createdSubj.id,
          },
        });
      }
    }
  }

  console.log(`PhD departments created (${phdDeptIds.length} departments with subjects).`);

  // ── Demo Users ──────────────────────────────────────────────────────────

  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@vetacademia.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const studentPassword = await bcrypt.hash("student123", 12);
  const student = await prisma.user.create({
    data: {
      name: "Demo Student",
      email: "student@vetacademia.com",
      password: studentPassword,
      role: "STUDENT",
      programme: "BVSC",
      year: "2nd Year",
    },
  });

  const expertPassword = await bcrypt.hash("expert123", 12);
  const expertUser = await prisma.user.create({
    data: {
      name: "Dr. Expert",
      email: "expert@vetacademia.com",
      password: expertPassword,
      role: "EXPERT",
      programme: "MVSC",
    },
  });

  await prisma.expert.create({
    data: {
      userId: expertUser.id,
      specialization: "Veterinary Surgery",
      bio: "Senior veterinarian with 15 years of clinical experience in large and small animal surgery.",
      hourlyRate: 500,
      rating: 4.8,
      totalReviews: 120,
    },
  });

  console.log("Demo users created!");
  console.log("  Admin:    admin@vetacademia.com / admin123");
  console.log("  Student:  student@vetacademia.com / student123");
  console.log("  Expert:   expert@vetacademia.com / expert123");

  // ── Mock Tests and Questions ────────────────────────────────────────────

  for (const mockData of MOCK_TESTS) {
    const subject = await prisma.subject.findFirst({
      where: { code: mockData.subjectCode },
    });

    const mockTest = await prisma.mockTest.create({
      data: {
        title: mockData.title,
        description: mockData.description,
        duration: mockData.duration,
        totalMarks: mockData.totalMarks,
        subjectId: subject?.id ?? null,
      },
    });

    for (const q of mockData.questions) {
      await prisma.question.create({
        data: {
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          marks: q.marks,
          explanation: q.explanation ?? null,
          mockTestId: mockTest.id,
        },
      });
    }
  }

  console.log(`Mock tests created (${MOCK_TESTS.length} tests with questions).`);

  // ── Summary ─────────────────────────────────────────────────────────────

  const subjectCount = await prisma.subject.count();
  const chapterCount = await prisma.chapter.count();
  const deptCount = await prisma.department.count();
  const mockTestCount = await prisma.mockTest.count();
  const questionCount = await prisma.question.count();
  const userCount = await prisma.user.count();

  console.log("\n════════════════════════════════════════");
  console.log("  SEED SUMMARY");
  console.log("════════════════════════════════════════");
  console.log(`  Programmes:       4`);
  console.log(`  Departments:      ${deptCount}`);
  console.log(`  Subjects:         ${subjectCount}`);
  console.log(`  Chapters:         ${chapterCount}`);
  console.log(`  Mock Tests:       ${mockTestCount}`);
  console.log(`  Questions:        ${questionCount}`);
  console.log(`  Users:            ${userCount}`);
  console.log("════════════════════════════════════════");
  console.log("  Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
