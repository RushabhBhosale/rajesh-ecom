import sanitizeHtml, { IOptions } from "sanitize-html";
import { marked } from "marked";

const allowedTags = Array.from(
  new Set([
    ...sanitizeHtml.defaults.allowedTags,
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "figure",
    "figcaption",
    "img",
    "iframe",
  ])
);

const allowedAttributes: IOptions["allowedAttributes"] = {
  ...sanitizeHtml.defaults.allowedAttributes,
  "*": Array.from(
    new Set([
      ...((sanitizeHtml.defaults.allowedAttributes?.["*"] as string[]) ?? []),
      "class",
      "style",
      "target",
      "rel",
    ])
  ),
  a: Array.from(
    new Set([
      ...((sanitizeHtml.defaults.allowedAttributes?.a as string[]) ?? []),
      "target",
      "rel",
    ])
  ),
  img: ["src", "alt", "title", "loading", "width", "height"],
  iframe: ["src", "title", "width", "height", "allow", "allowfullscreen", "frameborder", "loading"],
};

export function sanitizeRichText(input: string): string {
  if (!input) {
    return "";
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }

  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(trimmed);
  const rawHtml = looksLikeHtml
    ? trimmed
    : marked.parse(trimmed, { mangle: false, headerIds: false });

  return sanitizeHtml(rawHtml, {
    allowedTags,
    allowedAttributes,
    allowedSchemes: ["http", "https", "mailto", "tel", "data"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
      iframe: ["http", "https"],
      a: ["http", "https", "mailto", "tel"],
    },
    allowedSchemesAppliedToAttributes: ["src", "href"],
    allowProtocolRelative: false,
    transformTags: {
      iframe: (tagName, attribs) => {
        if (!attribs.src) {
          return { tagName: "p", text: "Embedded content missing source." };
        }
        return {
          tagName,
          attribs: {
            ...attribs,
            loading: attribs.loading ?? "lazy",
          },
        };
      },
      img: (tagName, attribs) => {
        if (!attribs.src) {
          return { tagName: "span", text: "Image source missing" };
        }
        return {
          tagName,
          attribs: {
            ...attribs,
            loading: attribs.loading ?? "lazy",
          },
        };
      },
    },
  });
}
