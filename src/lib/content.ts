import sanitizeHtml from "sanitize-html";

export function isHtmlContent(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text || "");
}

export function sanitizeChapterContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "h1",
      "h2",
      "h3",
      "h4",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "blockquote",
      "code",
      "pre",
      "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "data"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
  });
}
