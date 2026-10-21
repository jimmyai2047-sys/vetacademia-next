// Field/column configs for the generic admin CRUD (finding 17): Blog,
// Books and Success Stories had no admin UI at all — these configs drive
// a single RecordsManager component for all three collections.

import { BOOK_LEVELS } from "@/lib/reference-dictionary";

export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "textarea" | "url" | "number" | "checkbox" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
  hint?: string;
};

export type ColumnDef = {
  key: string;
  label: string;
  type?: "text" | "date" | "bool" | "rating" | "truncate";
};

export type Collection = {
  endpoint: string;
  title: string;
  itemNoun: string;
  description: string;
  columns: ColumnDef[];
  fields: FieldDef[];
  defaults: Record<string, string | number | boolean>;
};

const OWNERSHIP_FIELDS: FieldDef[] = [
  { key: "owner", label: "Owner (keeps this current)", type: "text", hint: "Person/team accountable" },
  { key: "sourceUrl", label: "Source / evidence URL", type: "url", hint: "Provenance for claims or listings" },
  { key: "reviewedBy", label: "Reviewed by", type: "text", hint: "Setting this stamps Reviewed at = now" },
];

export const blogCollection: Collection = {
  endpoint: "/api/admin/blog",
  title: "Blog",
  itemNoun: "post",
  description: "Articles at /blog. Owner + source make accountability visible on every post.",
  columns: [
    { key: "title", label: "Title", type: "truncate" },
    { key: "slug", label: "Slug" },
    { key: "author", label: "Author" },
    { key: "owner", label: "Owner" },
    { key: "isPublished", label: "Published", type: "bool" },
    { key: "publishedAt", label: "Published", type: "date" },
  ],
  fields: [
    { key: "title", label: "Title *", type: "text", required: true },
    { key: "slug", label: "Slug (auto from title if blank)", type: "text" },
    { key: "author", label: "Author", type: "text" },
    { key: "excerpt", label: "Excerpt", type: "textarea" },
    { key: "content", label: "Content (HTML) *", type: "textarea", required: true },
    { key: "coverImageUrl", label: "Cover image URL", type: "url" },
    { key: "tags", label: "Tags (comma separated)", type: "text" },
    { key: "isPublished", label: "Published (visible at /blog)", type: "checkbox" },
    ...OWNERSHIP_FIELDS,
  ],
  defaults: { title: "", slug: "", author: "VetAcademia Team", excerpt: "", content: "", coverImageUrl: "", tags: "", isPublished: true, owner: "", sourceUrl: "", reviewedBy: "" },
};

export const bookCollection: Collection = {
  endpoint: "/api/admin/books",
  title: "Books",
  itemNoun: "book",
  description: "Reading-list books at /books, with level, order and recommendation flags.",
  columns: [
    { key: "title", label: "Title", type: "truncate" },
    { key: "author", label: "Author" },
    { key: "subject", label: "Subject" },
    { key: "level", label: "Level" },
    { key: "owner", label: "Owner" },
    { key: "isRecommended", label: "Recommended", type: "bool" },
    { key: "order", label: "Order" },
  ],
  fields: [
    { key: "title", label: "Title *", type: "text", required: true },
    { key: "author", label: "Author", type: "text" },
    { key: "publisher", label: "Publisher", type: "text" },
    { key: "edition", label: "Edition", type: "text" },
    { key: "subject", label: "Subject *", type: "text", required: true },
    {
      key: "level",
      label: "Level",
      type: "select",
      options: [...BOOK_LEVELS].map((v) => ({ value: v, label: v })),
    },
    { key: "description", label: "Description", type: "textarea" },
    { key: "coverImageUrl", label: "Cover image URL", type: "url" },
    { key: "isRecommended", label: "Recommended", type: "checkbox" },
    { key: "order", label: "Display order", type: "number" },
    ...OWNERSHIP_FIELDS,
  ],
  defaults: { title: "", author: "", publisher: "", edition: "", subject: "", level: "General", description: "", coverImageUrl: "", isRecommended: true, order: 0, owner: "", sourceUrl: "", reviewedBy: "" },
};

export const testimonialCollection: Collection = {
  endpoint: "/api/admin/testimonials",
  title: "Success Stories",
  itemNoun: "story",
  description: "Success stories at /testimonials — approval flag, rating and proof link per story.",
  columns: [
    { key: "name", label: "Name" },
    { key: "exam", label: "Exam" },
    { key: "programme", label: "Programme" },
    { key: "quote", label: "Quote", type: "truncate" },
    { key: "rating", label: "Rating", type: "rating" },
    { key: "owner", label: "Owner" },
    { key: "isApproved", label: "Approved", type: "bool" },
  ],
  fields: [
    { key: "name", label: "Name *", type: "text", required: true },
    { key: "exam", label: "Exam / achievement *", type: "text", required: true },
    { key: "programme", label: "Programme", type: "text" },
    { key: "quote", label: "Quote *", type: "textarea", required: true },
    { key: "rating", label: "Rating (0–5)", type: "number" },
    { key: "intakeYear", label: "Intake year", type: "number" },
    { key: "isApproved", label: "Approved (visible publicly)", type: "checkbox" },
    ...OWNERSHIP_FIELDS,
  ],
  defaults: { name: "", exam: "", programme: "", quote: "", rating: 5, intakeYear: "", isApproved: true, owner: "", sourceUrl: "", reviewedBy: "" },
};
