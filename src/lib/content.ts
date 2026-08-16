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
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "td",
      "th",
      "caption",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "loading", "decoding"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
      "*": ["class", "style"],
    },
    transformTags: {
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: "lazy", decoding: "async" },
      }),
    },
    allowedStyles: {
      "*": {
        "text-align": [/^(left|center|right|justify)$/],
        color: [/^([a-z]+|#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)$)/],
        "background-color": [/^([a-z]+|#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)$)/],
        "font-weight": [/^(normal|bold|bolder|lighter|\d+)$/],
        "font-style": [/^(normal|italic|oblique)$/],
        "font-size": [
          /^(\d+(\.\d+)?(px|em|rem|pt|%)?|small|medium|large|x-small|x-large|smaller|larger)$/,
        ],
        "text-decoration": [/^(none|underline|line-through|overline)$/],
        "vertical-align": [/^(top|middle|bottom|baseline|sub|super)$/],
        width: [/^(\d+(\.\d+)?(px|em|rem|pt|%)?|auto)$/],
        height: [/^(\d+(\.\d+)?(px|em|rem|pt|%)?|auto)$/],
        border: [/^(\d+(\.\d+)?(px|em|rem|pt|%)?|auto|collapse|none)$/],
        padding: [/^(\d+(\.\d+)?(px|em|rem|pt|%)?|auto)$/],
        margin: [/^(\d+(\.\d+)?(px|em|rem|pt|%)?|auto)$/],
        "list-style-type": [
          /^(disc|circle|square|decimal|lower-alpha|upper-alpha|lower-roman|upper-roman|none)$/,
        ],
      },
    },
    allowedSchemes: ["http", "https", "data"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
  });
}
