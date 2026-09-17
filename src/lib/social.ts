// Central place for all public social / connect links.
// Update URLs here once — footer, contact page, floating button and SEO schema update automatically.

export const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/profile.php?id=61593778203571",
  instagram: "https://www.instagram.com/vetacademia.india/",
  // WhatsApp chat with VetAcademia (number +91-8949929291)
  whatsapp: "https://wa.me/918949929291?text=Hi%20VetAcademia%2C%20I%20need%20help%20with%20my%20preparation",
  // WhatsApp / Telegram study groups are managed by admins — link to the hub page
  // Replace with your main Telegram channel (e.g. https://t.me/vetacademia) when ready
  telegram: "/community",
  community: "/community",
  email: "mailto:contact@vetacademia.in",
  phone: "tel:+918949929291",
} as const;

export type SocialKey = keyof typeof SOCIAL_LINKS;
