// Upload REMAINING chapters: DVP-111 Ch2-6 (new, locked) + DVP-112 Ch2 (update
// placeholder, locked) + Ch3-10 (new, locked). Chapter 1 of both books stays free.
// Same pipeline as upload-dvp-ch1.ts. MCQ answers drafted from standard
// veterinary knowledge — faculty to spot-check in Admin → ChapterMcqManager.
//
// Run: npx tsx prisma/seeds/upload-dvp-rest.ts
import "dotenv/config";
import { readFileSync } from "fs";
import mammoth from "mammoth";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { processInlineImages } from "@/lib/chapter-images";
import { sanitizeChapterContent } from "@/lib/content";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type Mcq = { q: string; o: [string, string, string, string]; a: number; e: string };
type Job = {
  file: string;
  marker: string;
  mode: { kind: "update"; chapterId: string } | { kind: "create"; subjectId: string; unitNumber: number; type: string; courseCode: string; creditHours: string };
  title: string;
  mcqs: Mcq[];
};

const FILE_111 = "D:/Preparation for Competitive Examinations/Academic Programmes/D.V.P/DVP-111 (Anatomy of Livestock and Poultry)/DVP-111 (Anatomy of Livestock and Poultry).docx";
const FILE_112 = "D:/Preparation for Competitive Examinations/Academic Programmes/D.V.P/DVP-112 (Introduction to Livestock Management)/DVP-112 (Introduction to Livestock Management) Final.docx";
const SUBJ_111 = "cmudgq8fb000114k5txz59u56";
const SUBJ_112 = "cmudgq8uv000314k5mxch99s3";

// ---------------- DVP-111 ----------------
const MCQ_111_CH2: Mcq[] = [
  { q: "Ruminants characteristically lack which teeth in the upper jaw?", o: ["Molars", "Premolars", "Incisors and canines", "None — all teeth are present"], a: 2, e: "Ruminants have no upper incisors or canines; a dental pad replaces them." },
  { q: "The four compartments of the ruminant stomach, in the order feed passes through them, are:", o: ["Abomasum, omasum, reticulum, rumen", "Rumen, reticulum, omasum, abomasum", "Reticulum, rumen, abomasum, omasum", "Omasum, rumen, reticulum, abomasum"], a: 1, e: "Feed flows rumen → reticulum → omasum → abomasum." },
  { q: "The true, glandular (acid-secreting) stomach of the ruminant, equivalent to the monogastric stomach, is the:", o: ["Rumen", "Reticulum", "Omasum", "Abomasum"], a: 3, e: "The abomasum is the true glandular stomach; the first three are forestomachs." },
  { q: "\u201CHardware disease\u201D (traumatic reticulo-peritonitis) results from foreign objects trapped in the:", o: ["Rumen", "Reticulum", "Omasum", "Abomasum"], a: 1, e: "Heavy sharp objects settle in the honeycomb reticulum and may pierce it." },
  { q: "Which domestic species notably lacks a gall bladder?", o: ["Cattle", "Horse", "Pig", "Sheep"], a: 1, e: "The horse has no gall bladder; bile flows continuously into the duodenum." },
  { q: "In poultry, the thin-walled diverticulum of the oesophagus used purely for storing food is the:", o: ["Crop (ingluvies)", "Proventriculus", "Gizzard", "Cloaca"], a: 0, e: "The crop stores and softens feed before gastric digestion." },
  { q: "Mechanical grinding of feed in poultry, in the absence of teeth, occurs mainly in the:", o: ["Crop", "Proventriculus", "Gizzard (ventriculus)", "Caeca"], a: 2, e: "The muscular gizzard grinds feed, aided by grit." },
  { q: "Rumination refers to:", o: ["Secretion of bile by the liver", "Regurgitation, re-mastication and re-swallowing of ingesta", "Absorption of water in the omasum", "Grinding of feed in the gizzard"], a: 1, e: "Rumination = regurgitation, cud-chewing and re-swallowing." },
  { q: "Which species relies most heavily on hind-gut (caecal/colonic) fermentation for fibre digestion?", o: ["Cattle", "Sheep", "Horse", "Goat"], a: 2, e: "The horse is a hindgut fermenter with a huge caecum and colon." },
  { q: "The common chamber in poultry that receives the digestive, urinary and reproductive tracts is the:", o: ["Crop", "Gizzard", "Cloaca", "Caecum"], a: 2, e: "All three tracts open into the cloaca in birds." },
];

const MCQ_111_CH3: Mcq[] = [
  { q: "Because the soft palate normally seals against the base of the epiglottis, which species is an obligate nasal breather?", o: ["Cattle", "Horse", "Pig", "Poultry"], a: 1, e: "Horses breathe only through the nose; the soft palate–epiglottis seal prevents mouth breathing." },
  { q: "The cartilage that prevents aspiration of food into the airway during swallowing is the:", o: ["Thyroid cartilage", "Cricoid cartilage", "Epiglottis", "Arytenoid cartilage"], a: 2, e: "The epiglottis folds over the glottis during swallowing." },
  { q: "An extra small bronchus arising directly from the trachea before the bifurcation, supplying the cranial part of the right lung, is present in:", o: ["Horse and dog only", "Ruminants and pigs", "Poultry only", "All domestic mammals equally"], a: 1, e: "The tracheal (accessory) bronchus is characteristic of ruminants and pigs." },
  { q: "Lung lobation is comparatively poorly marked (almost undivided in appearance) in the:", o: ["Cow", "Sheep", "Horse", "Pig"], a: 2, e: "Equine lungs show weak fissures compared with the well-lobated lungs of ruminants and pigs." },
  { q: "During quiet breathing, expiration is chiefly:", o: ["An active process using the diaphragm", "A passive process due to elastic recoil", "Driven by abdominal muscle contraction", "Absent in resting animals"], a: 1, e: "Quiet expiration is passive, driven by elastic recoil of lungs and chest wall." },
  { q: "Gas exchange in the avian lung occurs across:", o: ["Blind-ended alveolar sacs, as in mammals", "Parabronchi, with continuous one-way air flow", "The air sacs themselves", "The trachea"], a: 1, e: "Birds exchange gases across parabronchi with continuous unidirectional airflow; air sacs only ventilate." },
  { q: "The avian voice organ, located at the tracheal bifurcation, is called the:", o: ["Larynx", "Pharynx", "Syrinx", "Glottis"], a: 2, e: "The syrinx at the tracheal bifurcation produces sound in birds." },
  { q: "How many air sacs are typically present in the chicken?", o: ["Four", "Seven", "Nine", "Twelve"], a: 2, e: "The fowl has nine air sacs (paired cervical, clavicular, cranial/caudal thoracic, abdominal, plus one)." },
  { q: "The nasal conchae (turbinates) primarily function to:", o: ["Produce sound", "Warm, moisten and filter incoming air", "Store air for diving", "Secrete digestive enzymes"], a: 1, e: "Conchae condition inspired air — warming, moistening and trapping particles." },
  { q: "Spread of respiratory infection into bones and joints (air-sacculitis, osteomyelitis) is a particular risk in poultry because of the connection between air sacs and:", o: ["Crop", "Pneumatic bones", "Gizzard", "Kidneys"], a: 1, e: "Air sacs connect with hollow pneumatic bones, letting infection reach bone." },
];

const MCQ_111_CH4: Mcq[] = [
  { q: "The characteristically multilobulated (deeply divided into 15–20 lobules) kidney is seen in:", o: ["Sheep", "Horse", "Cattle/Buffalo", "Pig"], a: 2, e: "Bovine kidneys are externally divided into 15–20 lobules." },
  { q: "Which structure collects urine within the kidney before it drains into the ureter?", o: ["Renal cortex", "Renal medulla", "Renal pelvis", "Glomerulus"], a: 2, e: "The renal pelvis funnels urine from calyces into the ureter." },
  { q: "Urinary catheterisation is comparatively straightforward in the cow because the female urethra is:", o: ["Long and narrow", "Short and wide, opening into the vestibule", "Absent", "Coiled within the cervix"], a: 1, e: "The cow's short, wide urethra opens on the vestibule floor, easing catheterisation." },
  { q: "The fibro-elastic type of penis, with a sigmoid flexure, is found in the:", o: ["Stallion", "Bull, ram, buck and boar", "Dog", "None of the above"], a: 1, e: "Ruminants and boar have fibro-elastic penises with a sigmoid flexure; the stallion's is musculocavernous." },
  { q: "The gland notably large in the boar, contributing the gel fraction of the ejaculate, is the:", o: ["Prostate", "Vesicular (seminal vesicle) gland", "Bulbo-urethral gland", "Testis"], a: 2, e: "The boar's large bulbourethral (Cowper's) glands secrete the thick, tapioca-like gel fraction of semen." },
  { q: "The normal uterine type in domestic mammals, with two horns diverging from a single body, is termed:", o: ["Simplex", "Bicornuate", "Duplex", "Bipartite"], a: 1, e: "Domestic mammals have a bicornuate uterus (one body, two horns)." },
  { q: "Interlocking mucosal folds called annular rings, which make trans-cervical catheterisation more difficult, are a feature of the cervix in:", o: ["The mare", "The ruminant", "The sow only", "No domestic species"], a: 1, e: "The ruminant cervix has interlocking annular rings complicating AI catheter passage." },
  { q: "In poultry, urine is voided as:", o: ["Liquid urine via a urethra", "Semi-solid uric acid via the cloaca, with faeces", "Liquid urine stored in a bladder", "Uric acid via the crop"], a: 1, e: "Birds excrete semi-solid uric acid through the cloaca; they have no bladder." },
  { q: "In the adult hen, which side's ovary and oviduct remain functional?", o: ["Right only", "Left only", "Both sides equally", "Neither — the hen has no true ovary"], a: 1, e: "Only the left ovary and oviduct develop in the hen; the right regresses." },
  { q: "The region of the hen's oviduct responsible for secreting the calcareous eggshell is the:", o: ["Infundibulum", "Magnum", "Isthmus", "Uterus (shell gland)"], a: 3, e: "The uterus (shell gland) deposits the calcareous shell; magnum adds albumen, isthmus the membranes." },
];

const MCQ_111_CH5: Mcq[] = [
  { q: "The heart valve preventing backflow from the right ventricle to the right atrium is the:", o: ["Mitral (bicuspid) valve", "Tricuspid valve", "Aortic semilunar valve", "Pulmonary semilunar valve"], a: 1, e: "The tricuspid valve guards the right atrioventricular opening; mitral guards the left." },
  { q: "The most commonly used vein for venepuncture and intravenous injection in cattle is the:", o: ["Cephalic vein", "Jugular vein", "Saphenous vein", "Marginal ear vein"], a: 1, e: "The jugular vein in the jugular furrow is the standard bovine IV site." },
  { q: "The marginal ear vein is a particularly useful injection/collection site in:", o: ["Cattle", "Horses", "Weaner pigs", "Poultry"], a: 2, e: "Small ear veins are the practical route in piglets and weaners." },
  { q: "Which blood cells are primarily responsible for oxygen transport?", o: ["Leukocytes", "Erythrocytes", "Thrombocytes", "Lymphocytes"], a: 1, e: "Erythrocytes carry oxygen via haemoglobin." },
  { q: "Enlargement of the supramammary lymph node is most closely associated with:", o: ["Dental disease", "Mastitis / udder health problems", "Lameness", "Respiratory disease"], a: 1, e: "Supramammary nodes drain the udder, so they enlarge in mastitis." },
  { q: "The prescapular (superficial cervical) lymph node is located:", o: ["Behind the stifle", "Cranial to the point of the shoulder", "Below the ear", "Dorsal to the udder"], a: 1, e: "The prescapular node lies just cranial to the shoulder." },
  { q: "Which feature distinguishes avian erythrocytes from mammalian erythrocytes?", o: ["Avian erythrocytes are smaller", "Avian erythrocytes are oval and nucleated", "Avian erythrocytes lack haemoglobin", "There is no difference"], a: 1, e: "Bird RBCs are oval and nucleated; mammalian RBCs are non-nucleated discs." },
  { q: "The unique lymphoid organ found only in birds, located dorsal to the cloaca and responsible for B-lymphocyte maturation, is the:", o: ["Thymus", "Spleen", "Bursa of Fabricius", "Caecal tonsil"], a: 2, e: "The bursa of Fabricius matures B-lymphocytes in birds." },
  { q: "Poultry vaccination programmes are often timed around bursal development because the bursa of Fabricius is the principal target of:", o: ["Foot-and-mouth disease", "Infectious bursal disease (Gumboro)", "Rabies", "Mastitis"], a: 1, e: "Gumboro (IBD) virus destroys the bursa, so vaccines are timed to bursal status." },
  { q: "Compared with most mammals, the resting heart rate of the adult fowl is:", o: ["Much slower", "About the same", "Considerably faster (roughly 250–400 bpm)", "Impossible to measure"], a: 2, e: "Fowl resting heart rate is roughly 250–400 bpm, far faster than mammals." },
];

const MCQ_111_CH6: Mcq[] = [
  { q: "The part of the peripheral nervous system responsible for involuntary control of smooth muscle, cardiac muscle and glands is the:", o: ["Somatic system", "Autonomic system", "Central nervous system", "Cranial nerve system"], a: 1, e: "The autonomic system controls involuntary organs and glands." },
  { q: "The part of the brain chiefly responsible for coordination of movement, balance and muscle tone is the:", o: ["Cerebrum", "Cerebellum", "Medulla oblongata", "Pons"], a: 1, e: "The cerebellum coordinates movement, balance and tone." },
  { q: "Epidural anaesthesia in cattle is commonly performed at the:", o: ["Atlanto-occipital joint", "Sacro-coccygeal or first intercoccygeal space", "Elbow joint", "Stifle joint"], a: 1, e: "The sacro-coccygeal space is the routine caudal epidural site in cattle." },
  { q: "The nerve most commonly injured by poorly placed intramuscular injections in the hind-quarter is the:", o: ["Vagus nerve", "Sciatic nerve", "Facial nerve", "Optic nerve"], a: 1, e: "The sciatic nerve runs through the hind-quarter injection zone." },
  { q: "The reflective layer within the choroid that enhances night vision in most livestock species is the:", o: ["Cornea", "Iris", "Tapetum lucidum", "Sclera"], a: 2, e: "The tapetum lucidum reflects light back through the retina, aiding night vision." },
  { q: "The horizontally elongated pupil typical of horses, cattle, sheep and goats is an adaptation associated with:", o: ["Nocturnal hunting", "Wide panoramic vision to detect predators", "Underwater vision", "Colour discrimination"], a: 1, e: "Horizontal pupils give grazing prey a wide panoramic field to spot predators." },
  { q: "The three auditory ossicles of the mammalian middle ear are the:", o: ["Malleus, incus and stapes", "Cochlea, utricle and saccule", "Pinna, tragus and helix", "Cornea, lens and retina"], a: 0, e: "Malleus, incus and stapes transmit sound across the middle ear." },
  { q: "The unique, richly vascular structure projecting from the retina into the vitreous body of the avian eye is the:", o: ["Tapetum lucidum", "Pecten oculi", "Fovea", "Sclera"], a: 1, e: "The pecten nourishes the avian retina." },
  { q: "Compared with mammals, the external ear of poultry lacks a:", o: ["Tympanic membrane", "Pinna (external ear flap)", "Inner ear", "Middle ear"], a: 1, e: "Birds have no pinna; the ear opening is covered by feathers." },
  { q: "The single auditory ossicle of the avian middle ear, functionally equivalent to the mammalian malleus, incus and stapes together, is the:", o: ["Columella", "Cochlea", "Pecten", "Utricle"], a: 0, e: "The columella is the single avian middle-ear ossicle." },
];

// ---------------- DVP-112 ----------------
const MCQ_112_CH2: Mcq[] = [
  { q: "The recommended floor slope for drainage in a livestock shed is approximately:", o: ["1 in 10", "1 in 100", "1 in 1000", "No slope is required"], a: 1, e: "About 1 in 100 (~1%) gives gentle liquid runoff without slipping; note drainage channels and solid standing areas often use a steeper 1 in 40 to 1 in 60 gradient." },
  { q: "In which cattle housing system is each animal individually tied at a fixed standing?", o: ["Loose housing", "Tie-stall system", "Deep litter system", "Cage system"], a: 1, e: "In the tie-stall system each animal is tied at its own stall." },
  { q: "A raised slatted floor is particularly recommended for the housing of:", o: ["Cattle", "Goats", "Pigs", "Camels"], a: 1, e: "Raised slatted floors keep goats dry and reduce parasitism." },
  { q: "The 'creep area' in a pig farrowing pen is provided mainly to:", o: ["House the boar", "Keep newborn piglets warm and safe from crushing", "Store feed", "Allow the sow to exercise"], a: 1, e: "The creep area shelters piglets from crushing and chilling." },
  { q: "Which poultry housing system allows droppings to fall away from the birds through wire mesh, improving hygiene?", o: ["Deep litter system", "Backyard system", "Cage system", "Free-range system"], a: 2, e: "In cage systems droppings fall through the wire floor away from birds." },
  { q: "Ammonia build-up in poorly managed deep litter houses chiefly predisposes poultry to:", o: ["Foot rot", "Respiratory disease", "Mastitis", "Bloat"], a: 1, e: "Ammonia irritates the respiratory tract, inviting respiratory disease." },
  { q: "Camels, being adapted to arid climates, are typically housed in:", o: ["Fully enclosed, heated barns", "Open, well-drained yards with minimal shelter", "Deep litter houses", "Cages"], a: 1, e: "Camels need open, dry yards with only minimal shelter." },
  { q: "An isolation pen in a livestock shed is provided to:", o: ["House the healthiest animals", "Separate sick or newly-arrived animals and limit disease spread", "Store feed and fodder", "House only calves"], a: 1, e: "Isolation pens segregate sick or new stock to check disease spread." },
  { q: "Approximate covered floor space recommended per adult cow/buffalo is:", o: ["0.5–1.0 m²", "3.0–3.5 m²", "10–12 m²", "20 m²"], a: 1, e: "About 3–3.5 m² covered space per adult cow/buffalo is the standard." },
  { q: "Backyard poultry are generally provided with:", o: ["Wire-mesh tiered cages", "A simple raised night shelter with free daytime ranging", "Fully automated climate-controlled housing", "No housing whatsoever"], a: 1, e: "Backyard birds range by day and roost in a simple raised night shelter." },
];

const MCQ_112_CH3: Mcq[] = [
  { q: "A visible hollowing on either side of the tail head shortly before parturition is due to:", o: ["Loss of body fat", "Relaxation of the pelvic ligaments", "Dehydration", "Muscle wasting"], a: 1, e: "Relaxing pelvic ligaments hollow the tail head as calving nears." },
  { q: "In cattle, retention of placenta is generally considered to have occurred if the foetal membranes are not expelled within:", o: ["1 hour", "6 hours", "12–24 hours", "One week"], a: 2, e: "Membranes retained beyond 12–24 hours count as retained placenta." },
  { q: "Colostrum is particularly important to the newborn because it:", o: ["Provides passive immunity through antibodies absorbed across the gut wall", "Prevents parturition complications", "Substitutes for solid feed permanently", "Is not nutritionally different from normal milk"], a: 0, e: "Colostral antibodies absorbed in the first hours give passive immunity." },
  { q: "The ability of the newborn calf's gut to absorb colostral antibodies falls sharply after approximately:", o: ["1 hour", "6 hours", "3 days", "2 weeks"], a: 1, e: "Gut closure progresses rapidly; absorption is maximal in the first ~6 hours." },
  { q: "Disbudding of calves is best performed:", o: ["At weaning", "Within the first few weeks of life, before the horn bud attaches to the skull", "Only after one year of age", "Immediately after birth, within minutes"], a: 1, e: "Disbud early while the bud is free, before it fuses with the skull." },
  { q: "Creep feeding refers to:", o: ["Feeding the dam extra concentrate", "Providing concentrate feed accessible only to the young, not the dam", "A method of restraining animals", "A type of housing system"], a: 1, e: "Creep feeders let only the young reach concentrate feed." },
  { q: "Weaning age in calves is typically:", o: ["1–2 weeks", "8–12 weeks", "12 months", "24 months"], a: 1, e: "Calves are commonly weaned at about 8–12 weeks." },
  { q: "The navel of a newborn is disinfected chiefly to prevent:", o: ["Bloat", "Navel-ill (omphalitis) and joint-ill", "Mastitis", "Foot rot"], a: 1, e: "Navel dipping blocks bacteria that cause navel-ill and joint-ill." },
  { q: "Normal anterior presentation of the foetus at parturition means:", o: ["Hindlimbs presented first", "Both forelimbs and the head extended, presented first", "The foetus lying transversely", "Breech presentation"], a: 1, e: "Normal anterior = head plus both extended forelimbs first." },
  { q: "A foal that fails to stand and suckle within a few hours of birth should be:", o: ["Left alone, as this is normal", "Given prompt veterinary attention", "Weaned immediately", "Given only water"], a: 1, e: "Failure to stand and suckle early signals trouble needing veterinary care." },
];

const MCQ_112_CH4: Mcq[] = [
  { q: "Currying is best described as:", o: ["Washing the animal with soap", "Loosening dirt and dandruff with a curry comb", "Applying a medicated dip", "Trimming the hooves"], a: 1, e: "Currying uses a comb to loosen dirt, dandruff and loose hair." },
  { q: "The Reuff's method (rope-square method) is used for:", o: ["Shearing sheep", "Casting large animals for restraint", "Dipping cattle", "Feeding calves"], a: 1, e: "Reuff's rope method casts large animals for restraint." },
  { q: "Shearing of sheep is generally timed to just before:", o: ["The onset of winter", "The onset of the hot season", "Lambing only", "Weaning of lambs"], a: 1, e: "Shear before summer so sheep face heat without heavy fleece." },
  { q: "A twitch is a restraint device most commonly used in:", o: ["Cattle", "Pigs", "Equines", "Poultry"], a: 2, e: "The twitch (usually on the upper lip) restrains horses." },
  { q: "A hog snare restrains a pig by looping around the:", o: ["Neck only", "Upper jaw behind the canine teeth", "Hind legs", "Tail"], a: 1, e: "The snare loops the upper jaw behind the tusks." },
  { q: "Sudden introduction of a high-concentrate ration in cattle chiefly risks:", o: ["Ruminal acidosis", "Foot rot", "Mastitis", "Navel-ill"], a: 0, e: "Abrupt concentrate overload causes ruminal acidosis." },
  { q: "Horses are particularly prone to colic from large single feeds because of their:", o: ["Very large stomach", "Comparatively small stomach", "Absence of a stomach", "Four-chambered stomach"], a: 1, e: "The horse's small stomach overloads easily, predisposing to colic." },
  { q: "Withholding feed and water before shearing chiefly reduces the risk of:", o: ["Bloat/injury from a full rumen", "Parasite infestation", "Dehydration", "Foot rot"], a: 0, e: "An empty gut avoids bloat and handling injury during shearing." },
  { q: "The nose ring is applied mainly in:", o: ["Adult bulls", "Piglets", "Lambs", "Chicks"], a: 0, e: "Adult bulls wear nose rings for safe handling." },
  { q: "Incorrect dip concentration in acaricide use may lead to:", o: ["Improved efficacy only", "Either treatment failure or toxicity", "No effect on the animal", "Better wool quality"], a: 1, e: "Weak dips fail; strong dips poison — concentration must be exact." },
];

const MCQ_112_CH5: Mcq[] = [
  { q: "Rumination in a healthy ruminant refers to:", o: ["Urination", "Cud-chewing", "Sweating", "Panting"], a: 1, e: "Rumination is cud-chewing; its absence signals sickness." },
  { q: "Body temperature in farm animals is most commonly recorded:", o: ["Orally", "Rectally", "In the ear only", "Under the tongue"], a: 1, e: "Rectal recording with a clinical thermometer is standard." },
  { q: "Pulse is commonly recorded in cattle at the:", o: ["Coccygeal artery", "Carotid artery only", "Radial artery", "Pulmonary artery"], a: 0, e: "The coccygeal artery under the tail base is the routine bovine pulse site." },
  { q: "The normal rectal temperature range in cattle is approximately:", o: ["95–98°F", "101.0–102.5°F", "105–108°F", "90–93°F"], a: 1, e: "Normal bovine temperature is about 101–102.5°F (38.3–39.1°C)." },
  { q: "Excitement or recent exercise before TPR recording tends to:", o: ["Have no effect", "Lower pulse and respiration", "Raise pulse and respiration", "Only affect temperature"], a: 2, e: "Excitement and exercise raise pulse and respiration, so rest animals first." },
  { q: "Grinding of teeth in ruminants is generally interpreted as a sign of:", o: ["Contentment", "Pain", "Normal rumination", "Hunger"], a: 1, e: "Teeth grinding (bruxism) indicates pain in ruminants." },
  { q: "Isolating a sick animal from the herd primarily helps to:", o: ["Improve its appetite directly", "Reduce disease spread and stress", "Increase its temperature", "Speed up rumination"], a: 1, e: "Isolation limits contagion and gives the patient quiet recovery." },
  { q: "A recumbent (down) sick animal should be periodically repositioned mainly to prevent:", o: ["Overeating", "Pressure sores/complications", "Excess salivation", "Hair loss"], a: 1, e: "Turning prevents pressure sores, bloat and muscle damage in downers." },
  { q: "Healthy mucous membranes (eye/gum) in farm animals are typically:", o: ["Pale and dry", "Pink and moist", "Blue and dry", "Yellow and moist"], a: 1, e: "Pink, moist membranes indicate health; pale/blue/yellow signal disease." },
  { q: "The normal respiration rate in cattle at rest is approximately:", o: ["1–5 per minute", "10–30 per minute", "60–90 per minute", "200–400 per minute"], a: 1, e: "Resting bovine respiration is roughly 10–30 breaths per minute." },
];

const MCQ_112_CH6: Mcq[] = [
  { q: "Milk let-down is primarily mediated by the hormone:", o: ["Oxytocin", "Prolactin", "Progesterone", "Adrenaline"], a: 0, e: "Oxytocin contracts udder myoepithelial cells, ejecting milk." },
  { q: "Adrenaline released due to fear or pain during milking chiefly causes:", o: ["Faster let-down", "Blocking of let-down", "Increased fat content", "No effect on milk"], a: 1, e: "Adrenaline blocks oxytocin action, holding up milk." },
  { q: "The strip cup is used to:", o: ["Measure total milk yield", "Check fore-milk for abnormalities such as clots", "Clean the udder", "Store milk"], a: 1, e: "Fore-milk is stripped onto the cup to detect mastitis clots early." },
  { q: "The correct and gentle hand-milking technique is:", o: ["Knuckling", "Full-hand (whole-hand) milking", "Stripping only", "Squeezing the teat tip"], a: 1, e: "Full-hand milking is gentle; knuckling injures teats." },
  { q: "Post-dipping of teats after milking is done to:", o: ["Increase milk yield", "Prevent bacterial entry through the open teat canal", "Soften the udder", "Speed up let-down"], a: 1, e: "Teat dip seals the open canal against invading bacteria." },
  { q: "In cattle, the central pair of permanent incisors typically erupts at about:", o: ["1.5–2 years", "6 months", "4–5 years", "8 years"], a: 0, e: "Cattle show two permanent centrals at roughly 1.5–2 years." },
  { q: "Age in cattle and equines is chiefly estimated by:", o: ["Coat colour", "Incisor eruption and wear pattern", "Body weight alone", "Horn length only"], a: 1, e: "Dental eruption and wear is the standard age guide." },
  { q: "Milk fever (hypocalcaemia) is most closely associated with:", o: ["Weaning", "The period around calving", "Shearing", "Dipping"], a: 1, e: "Milk fever strikes high yielders around calving when calcium demand surges." },
  { q: "Full permanent incisor eruption in sheep/goat is reached at approximately:", o: ["6 months", "1 year", "3.5–4 years", "10 years"], a: 2, e: "Sheep and goats reach full mouth at about 3.5–4 years." },
  { q: "Excessive machine vacuum or faulty liners chiefly predispose to:", o: ["Teat-end damage and mastitis", "Improved milk yield", "Faster let-down only", "No adverse effect"], a: 0, e: "Bad vacuum and liners injure teat ends and invite mastitis." },
];

const MCQ_112_CH7: Mcq[] = [
  { q: "A vice in livestock management is best defined as:", o: ["A normal breed characteristic", "An abnormal, repetitive behaviour usually linked to a management deficiency", "A disease caused by a virus", "A nutritional supplement"], a: 1, e: "Vices are abnormal repetitive behaviours rooted in faulty management." },
  { q: "Licking/wool-eating in cattle is most often linked to:", o: ["Excess water intake", "Mineral (e.g., phosphorus/salt) deficiency", "Overfeeding of concentrate", "Normal grooming"], a: 1, e: "Pica and wool-eating commonly reflect phosphorus or salt shortage." },
  { q: "Crib-biting/wind-sucking is a vice most associated with which species?", o: ["Poultry", "Pig", "Equine", "Goat"], a: 2, e: "Crib-biting is the classic equine stable vice." },
  { q: "Tail-biting in pigs is strongly associated with:", o: ["Adequate space and enrichment", "Overcrowding and poor enrichment", "Excess pasture access", "Low stocking density"], a: 1, e: "Crowding and boredom trigger tail-biting outbreaks." },
  { q: "Feather-pecking and cannibalism in poultry are commonly linked to:", o: ["Overcrowding and nutritional deficiency", "Free-range housing only", "Excess nest boxes", "Low light intensity only"], a: 0, e: "Crowding plus deficiencies (protein, salt) drive pecking and cannibalism." },
  { q: "The most sustainable approach to controlling a vice is to:", o: ["Apply a physical restraint device only", "Address the underlying management cause", "Ignore it if productivity is unaffected", "Cull the affected animal immediately in every case"], a: 1, e: "Lasting control removes the cause; devices alone only suppress symptoms." },
  { q: "Self-sucking/inter-sucking in calves is often linked to:", o: ["Excess pasture", "Early weaning or insufficient milk feeding", "Overcrowded housing only", "Excess mineral supplementation"], a: 1, e: "Hungry, early-weaned calves develop sucking habits." },
  { q: "Egg-eating in poultry often begins after:", o: ["A hen loses her feathers", "An egg is accidentally broken and then learned behaviour spreads", "A new rooster is introduced", "Vaccination"], a: 1, e: "A broken egg teaches the taste; the habit then spreads flock-wide." },
  { q: "Weaving in horses is a vice characterised by:", o: ["Repeated kicking", "Rhythmic side-to-side swaying", "Egg consumption", "Tail biting"], a: 1, e: "Weaving is rhythmic swaying, shifting weight from side to side." },
  { q: "Injured animals from vice-related biting/pecking should be treated promptly mainly because:", o: ["They may attract further attack from pen-mates", "It has no further consequence", "It improves feed conversion", "It prevents weaning"], a: 0, e: "Blood and wounds invite further pecking, so isolate and treat quickly." },
];

const MCQ_112_CH8: Mcq[] = [
  { q: "Layer farming is primarily aimed at:", o: ["Meat production", "Table egg production", "Wool production", "Draught power"], a: 1, e: "Layers are kept for table eggs; broilers for meat." },
  { q: "Broiler birds typically reach market weight in about:", o: ["5–6 weeks", "5–6 months", "18–20 weeks", "72 weeks"], a: 0, e: "Modern broilers finish in roughly 5–6 weeks." },
  { q: "During the laying phase, hens are generally provided about how many hours of light per day?", o: ["8 hours", "16 hours", "24 hours", "4 hours"], a: 1, e: "About 16 hours of light sustains peak lay." },
  { q: "A calcium-rich ration is particularly important during the:", o: ["Brooding phase", "Growing phase", "Laying phase", "None of the phases"], a: 2, e: "Layers need extra calcium for shell formation." },
  { q: "Which is a hardy dual-purpose/backyard poultry breed/strain?", o: ["Vanaraja", "Holstein Friesian", "Murrah", "Sahiwal"], a: 0, e: "Vanaraja is the backyard dual-purpose bird; the others are cattle/buffalo." },
  { q: "Backyard poultry rearing is particularly significant for:", o: ["Large commercial farms only", "Landless and marginal rural households", "Export-oriented broiler units only", "Zoos"], a: 1, e: "Backyard flocks give landless and marginal families eggs, meat and income." },
  { q: "The single most important vaccination for backyard poultry flocks is against:", o: ["Foot-and-mouth disease", "Ranikhet (Newcastle) disease", "Rabies", "Brucellosis"], a: 1, e: "Ranikhet disease kills unprotected village flocks, so it is priority one." },
  { q: "Compared to layers, broiler birds are generally MORE sensitive to:", o: ["Cold stress only", "Heat stress and ammonia build-up due to fast growth", "Egg-shell quality problems", "Long laying cycles"], a: 1, e: "Fast-growing broilers suffer heat and ammonia stress most." },
  { q: "In brooding, temperature is generally:", o: ["Kept constant at ambient from day one", "Started high and gradually reduced over the first few weeks", "Not relevant to chick survival", "Increased over time"], a: 1, e: "Start near 35°C and step down weekly as chicks feather." },
  { q: "A typical nest-box provision recommendation for layer housing is approximately:", o: ["One nest per 50 hens", "One nest per four to five hens", "One nest per hen only", "No nest boxes are needed"], a: 1, e: "Provide roughly one nest per 4–5 hens." },
];

const MCQ_112_CH9: Mcq[] = [
  { q: "The standard incubation period for a chicken egg is:", o: ["14 days", "21 days", "28 days", "35 days"], a: 1, e: "Chicken eggs hatch in 21 days." },
  { q: "Recommended incubator temperature for chicken eggs is approximately:", o: ["25°C", "37.5°C", "45°C", "55°C"], a: 1, e: "Hold forced-draught incubators near 37.5°C (99.5°F)." },
  { q: "Egg turning during incubation is stopped approximately:", o: ["At the start of incubation", "3 days before expected hatching", "Immediately after setting", "It is never stopped"], a: 1, e: "Stop turning around day 18 so chicks can position for hatching." },
  { q: "Candling is used chiefly to:", o: ["Clean the egg shell", "Check fertility and embryonic development without breaking the shell", "Increase hatchability directly", "Measure egg weight"], a: 1, e: "Candling shines light through the shell to reveal fertility and growth." },
  { q: "At first candling (day 7–8), a fertile chicken egg typically shows:", o: ["A completely clear interior", "A spider-web pattern of blood vessels around the embryo", "A fully formed chick", "No change from an infertile egg"], a: 1, e: "The spider-web vessels mark a living embryo; clear eggs are infertile." },
  { q: "Hatching eggs for best hatchability should generally be set within about:", o: ["7 days of lay", "1 month of lay", "6 months of lay", "It does not matter"], a: 0, e: "Set eggs within about a week; hatchability falls with storage." },
  { q: "Washing hatching eggs before setting is generally avoided because it:", o: ["Improves hatchability", "Removes the protective cuticle and increases contamination risk", "Has no effect", "Speeds up incubation"], a: 1, e: "Washing strips the cuticle, letting bacteria enter." },
  { q: "Wet, caked litter during brooding chiefly increases the risk of:", o: ["Improved growth", "Ammonia build-up and coccidiosis", "Higher egg fertility", "Faster feathering"], a: 1, e: "Wet litter breeds ammonia and coccidia oocysts." },
  { q: "Relative humidity during the final hatching days is generally:", o: ["Reduced below the incubation level", "Raised to about 65–70%", "Kept at 0%", "Irrelevant to hatching"], a: 1, e: "Raise humidity to ~65–70% at hatching so chicks don't stick to membranes." },
  { q: "An 'all-in-all-out' approach to litter and house management between poultry batches primarily supports:", o: ["Faster egg production", "Biosecurity and disease control", "Reduced feed cost only", "Improved candling accuracy"], a: 1, e: "Full clean-out between batches breaks disease cycles." },
];

const MCQ_112_CH10: Mcq[] = [
  { q: "Herd immunity refers to:", o: ["Immunity in a single animal only", "Disease transmission interruption when a sufficient proportion of the herd/flock is immune", "A type of vaccine", "A disinfectant property"], a: 1, e: "When enough animals are immune, chains of transmission break." },
  { q: "FMD vaccine used in Indian cattle/buffalo is typically:", o: ["Live attenuated", "Killed/inactivated", "A toxoid", "Not a vaccine at all"], a: 1, e: "India uses inactivated FMD vaccine in the control programme." },
  { q: "The recommended cold-chain storage range for most vaccines is approximately:", o: ["2–8°C", "20–25°C", "-20°C", "35–40°C"], a: 0, e: "Most vaccines keep at 2–8°C; freezing or heat destroys them." },
  { q: "Vaccinating a heavily parasitised or sick animal generally:", o: ["Improves vaccine response", "Reduces the immune response to the vaccine", "Has no effect on immunity", "Is always recommended first"], a: 1, e: "Deworm and recover animals first; sick animals respond poorly." },
  { q: "Cleaning should be performed:", o: ["After disinfection", "Before disinfection", "Instead of disinfection", "Only once a year regardless of use"], a: 1, e: "Remove organic matter first — disinfectants fail on dirty surfaces." },
  { q: "Quarantine of newly purchased animals is a practice under:", o: ["Vaccination scheduling", "Biosecurity", "Candling", "Shearing"], a: 1, e: "Quarantine is a core biosecurity measure." },
  { q: "A footbath containing exhausted/diluted disinfectant:", o: ["Still provides full protection", "Provides no real protection despite appearing to be in place", "Improves over time automatically", "Is not relevant to biosecurity"], a: 1, e: "Spent footbaths give false security; recharge them on schedule." },
  { q: "Ranikhet (Newcastle) disease vaccine is generally given to poultry:", o: ["Only once, in adult life", "From the day-old/early stage, with boosters", "Only to broilers, never layers", "Only after an outbreak occurs"], a: 1, e: "Start Ranikhet vaccination early (e.g. day-old/F1) and boost on schedule." },
  { q: "Organic matter (dung, feed residue) left on a surface before disinfection chiefly:", o: ["Improves disinfectant action", "Inactivates/shields pathogens from the disinfectant", "Has no effect", "Is required for disinfection to work"], a: 1, e: "Organic load neutralises disinfectants, so clean first." },
  { q: "Structural biosecurity includes measures such as:", o: ["Farm siting decisions made before construction", "Fencing, footbaths and dedicated equipment", "Herd immunity levels", "Vaccine cold-chain temperature"], a: 1, e: "Fencing, footbaths and dedicated implements are structural barriers." },
];

const JOBS: Job[] = [
  { file: FILE_111, marker: "Chapter 2:", mode: { kind: "create", subjectId: SUBJ_111, unitNumber: 2, type: "PRACTICAL", courseCode: "DVP-111", creditHours: "0+2" }, title: "Chapter 2: Digestive System of Livestock and Poultry", mcqs: MCQ_111_CH2 },
  { file: FILE_111, marker: "Chapter 3:", mode: { kind: "create", subjectId: SUBJ_111, unitNumber: 3, type: "PRACTICAL", courseCode: "DVP-111", creditHours: "0+2" }, title: "Chapter 3: Respiratory System of Livestock and Poultry", mcqs: MCQ_111_CH3 },
  { file: FILE_111, marker: "Chapter 4:", mode: { kind: "create", subjectId: SUBJ_111, unitNumber: 4, type: "PRACTICAL", courseCode: "DVP-111", creditHours: "0+2" }, title: "Chapter 4: Uro-genital System of Livestock and Poultry", mcqs: MCQ_111_CH4 },
  { file: FILE_111, marker: "Chapter 5:", mode: { kind: "create", subjectId: SUBJ_111, unitNumber: 5, type: "PRACTICAL", courseCode: "DVP-111", creditHours: "0+2" }, title: "Chapter 5: Circulatory System and Superficial Lymph Nodes of Livestock and Poultry", mcqs: MCQ_111_CH5 },
  { file: FILE_111, marker: "Chapter 6:", mode: { kind: "create", subjectId: SUBJ_111, unitNumber: 6, type: "PRACTICAL", courseCode: "DVP-111", creditHours: "0+2" }, title: "Chapter 6: Nervous System, Including the Sense Organs, of Livestock and Poultry", mcqs: MCQ_111_CH6 },
  { file: FILE_112, marker: "Chapter 2:", mode: { kind: "update", chapterId: "cmudgq9a0000514k5u8pudl0m" }, title: "Chapter 2: Housing Management of Livestock and Poultry", mcqs: MCQ_112_CH2 },
  { file: FILE_112, marker: "Chapter 3:", mode: { kind: "create", subjectId: SUBJ_112, unitNumber: 3, type: "THEORY", courseCode: "DVP-112", creditHours: "1+2" }, title: "Chapter 3: Parturition Care and Calf/Neonatal Rearing Practices", mcqs: MCQ_112_CH3 },
  { file: FILE_112, marker: "Chapter 4:", mode: { kind: "create", subjectId: SUBJ_112, unitNumber: 4, type: "THEORY", courseCode: "DVP-112", creditHours: "1+2" }, title: "Chapter 4: Grooming, Handling, Restraint and Feeding Management Practices", mcqs: MCQ_112_CH4 },
  { file: FILE_112, marker: "Chapter 5:", mode: { kind: "create", subjectId: SUBJ_112, unitNumber: 5, type: "THEORY", courseCode: "DVP-112", creditHours: "1+2" }, title: "Chapter 5: Signs of Health and Sickness; Care of Sick Animals", mcqs: MCQ_112_CH5 },
  { file: FILE_112, marker: "Chapter 6:", mode: { kind: "create", subjectId: SUBJ_112, unitNumber: 6, type: "THEORY", courseCode: "DVP-112", creditHours: "1+2" }, title: "Chapter 6: Milking Management and Age Determination", mcqs: MCQ_112_CH6 },
  { file: FILE_112, marker: "Chapter 7:", mode: { kind: "create", subjectId: SUBJ_112, unitNumber: 7, type: "THEORY", courseCode: "DVP-112", creditHours: "1+2" }, title: "Chapter 7: Control of Vices in Farm Animals", mcqs: MCQ_112_CH7 },
  { file: FILE_112, marker: "Chapter 8:", mode: { kind: "create", subjectId: SUBJ_112, unitNumber: 8, type: "THEORY", courseCode: "DVP-112", creditHours: "1+2" }, title: "Chapter 8: Poultry Farming and Backyard Poultry", mcqs: MCQ_112_CH8 },
  { file: FILE_112, marker: "Chapter 9:", mode: { kind: "create", subjectId: SUBJ_112, unitNumber: 9, type: "THEORY", courseCode: "DVP-112", creditHours: "1+2" }, title: "Chapter 9: Incubation and Hatchery Management", mcqs: MCQ_112_CH9 },
  { file: FILE_112, marker: "Chapter 10:", mode: { kind: "create", subjectId: SUBJ_112, unitNumber: 10, type: "THEORY", courseCode: "DVP-112", creditHours: "1+2" }, title: "Chapter 10: Vaccination, Biosecurity, Cleaning and Disinfection", mcqs: MCQ_112_CH10 },
];

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function splitIntoSections(chapterHtml: string): { title: string; content: string }[] {
  const html = chapterHtml.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>/, "").trim();
  const parts = html.split(/(?=<h2[^>]*>)/g).filter((p) => stripTags(p).length > 0);
  const sections: { title: string; content: string }[] = [];
  let idx = 0;
  for (const part of parts) {
    const m = part.match(/^<h2[^>]*>([\s\S]*?)<\/h2>/);
    if (m) {
      idx += 1;
      const title = stripTags(m[1]) || `Lecture ${idx}`;
      const content = part.replace(/^<h2[^>]*>[\s\S]*?<\/h2>/, "").trim();
      sections.push({ title, content: content || "<p>—</p>" });
    } else {
      sections.push({ title: "Overview", content: part });
    }
  }
  return sections;
}

async function buildContent(file: string, marker: string) {
  const buffer = readFileSync(file);
  const result = await mammoth.convertToHtml(
    { buffer },
    {
      convertImage: (mammoth as any).images.imgElement((image: any) =>
        image.read("base64").then((data: string) => ({
          src: `data:${image.contentType};base64,${data}`,
          alt: image.alt || "",
        }))
      ),
    }
  );
  const h1Parts = result.value.split(/(?=<h1)/g);
  const ch = h1Parts.find((p) => stripTags(p.slice(0, 800)).startsWith(marker));
  if (!ch) throw new Error(`Marker ${marker} not found in ${file}`);
  const withImages = await processInlineImages(ch);
  const clean = sanitizeChapterContent(withImages);
  const content = clean.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>/, "").trim();
  const sections = splitIntoSections(clean);
  return { content, sections };
}

async function main() {
  for (const job of JOBS) {
    console.log("=== Processing:", job.title);
    const { content, sections } = await buildContent(job.file, job.marker);
    console.log(`  HTML: ${Math.round(content.length / 1024)} KB, sections: ${sections.length}, imgs: ${(content.match(/<img\b/g) || []).length}, tables: ${(content.match(/<table\b/g) || []).length}`);
    let chapterId: string;
    if (job.mode.kind === "update") {
      chapterId = job.mode.chapterId;
      await prisma.chapterSection.deleteMany({ where: { chapterId } });
      await prisma.chapterMcq.deleteMany({ where: { chapterId } });
      await prisma.chapter.update({ where: { id: chapterId }, data: { title: job.title, content, isDemo: false } });
      console.log(`  Updated ${chapterId}`);
    } else {
      const created = await prisma.chapter.create({
        data: {
          title: job.title,
          content,
          unitNumber: job.mode.unitNumber,
          courseCode: job.mode.courseCode,
          creditHours: job.mode.creditHours,
          type: job.mode.type,
          isDemo: false,
          subjectId: job.mode.subjectId,
        },
      });
      chapterId = created.id;
      console.log(`  Created ${chapterId}`);
    }
    for (let i = 0; i < sections.length; i++) {
      await prisma.chapterSection.create({
        data: { chapterId, title: sections[i].title, content: sections[i].content, order: i },
      });
    }
    for (let i = 0; i < job.mcqs.length; i++) {
      const m = job.mcqs[i];
      await prisma.chapterMcq.create({
        data: { chapterId, question: m.q, options: JSON.stringify(m.o), correctIndex: m.a, explanation: m.e, difficulty: 1, order: i },
      });
    }
    console.log(`  Done: ${sections.length} sections, ${job.mcqs.length} MCQs, locked`);
  }
  await prisma.$disconnect();
  console.log("ALL DONE");
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
