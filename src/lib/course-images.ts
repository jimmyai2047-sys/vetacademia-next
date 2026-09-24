// Cover pictures for MVSc course plates (e.g. VMC 501–512 on the subject page
// and the course hero banner). Keyed by course code (spaces ignored).
//
// SOURCES (all free for commercial use, visually verified for topic fit):
// - Unsplash License photos (hotlinked, same pattern as subject-images.ts)
// - Wikimedia Commons public-domain images (served from /public/images/courses)
// - Gram stain (VMC 502): Y tambe, CC BY-SA 3.0 via Wikimedia Commons
// - Cattle vaccination (VMC 507): USAID/Davis via pixnio, CC0

const courseImages: Record<string, string> = {
  // ── M.V.Sc Veterinary Microbiology ──
  // VMC 501 — scientist examining culture at the microscope
  "VMC501":
    "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&q=80",
  // VMC 502 — Gram stain micrograph (purple cocci + pink bacilli, 1000x)
  "VMC502": "/images/courses/vmc-502-gram-stain.jpg",
  // VMC 503 — SARS coronavirus electron micrograph (public domain)
  "VMC503": "/images/courses/vmc-503-sars-cov.jpg",
  // VMC 504 — foot-and-mouth disease virus electron micrograph (public domain)
  "VMC504": "/images/courses/vmc-504-fmdv.jpg",
  // VMC 505 — macrophage scanning electron micrograph (NIAID)
  "VMC505":
    "https://images.unsplash.com/photo-1707079917474-8b8169f89883?w=800&q=80",
  // VMC 506 — coral fungus macro (tagged mycology)
  "VMC506":
    "https://images.unsplash.com/photo-1767606924572-f25ec609eb22?w=800&q=80",
  // VMC 507 — veterinarian vaccinating cattle (CC0)
  "VMC507": "/images/courses/vmc-507-cattle-vaccination.jpg",
  // VMC 508 — pipetting into a microplate (hands-on technique)
  "VMC508":
    "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80",
  // VMC 509 — fluorescent stained cells (molecular level)
  "VMC509":
    "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&q=80",
  // VMC 510 — immunoassay plate read-out in gloved hands
  "VMC510":
    "https://images.unsplash.com/photo-1624957485560-47747511b32f?w=800&q=80",
  // VMC 511 — modern diagnostic laboratory
  "VMC511":
    "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80",
  // VMC 512 — computing hardware (bioinformatics)
  "VMC512":
    "https://images.unsplash.com/photo-1641926489586-dd5dae881415?w=800&q=80",
};

export function getCourseImage(courseCode: string | null | undefined): string | null {
  if (!courseCode) return null;
  const key = courseCode.replace(/\s+/g, "").toUpperCase();
  return courseImages[key] ?? null;
}

export default courseImages;
