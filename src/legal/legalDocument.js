import { LEGAL_ENTITY } from "@/legal/legalEntity";

/**
 * Helpers de conteúdo legal estruturado (sem JSX e sem Markdown).
 *
 * @typedef {string | {
 *   type: "emphasis" | "link" | "email",
 *   content?: string,
 *   href?: string,
 *   address?: string,
 * }} LegalInline
 *
 * @typedef {{
 *   type: "paragraph" | "list" | "note",
 *   content?: LegalInline | LegalInline[],
 *   ordered?: boolean,
 *   items?: Array<LegalInline | LegalInline[]>,
 * }} LegalBlock
 *
 * @typedef {{
 *   id: string,
 *   title: string,
 *   label?: string,
 *   blocks: LegalBlock[],
 * }} LegalSectionContent
 *
 * @typedef {{
 *   title: string,
 *   version: string,
 *   lastUpdated: string,
 *   sections: LegalSectionContent[],
 * }} LegalDocumentContent
 */

export function paragraph(...parts) {
  const content = parts.length === 1 ? parts[0] : parts;
  return { type: "paragraph", content };
}

export function unorderedList(items) {
  return { type: "list", items };
}

export function orderedList(items) {
  return { type: "list", ordered: true, items };
}

export function note(content) {
  return { type: "note", content };
}

export function emphasis(content) {
  return { type: "emphasis", content };
}

export function legalLink(href, content) {
  return { type: "link", href, content };
}

export function legalEmail(address) {
  return address ? { type: "email", address } : { type: "email" };
}

/**
 * @param {LegalDocumentContent} document
 * @returns {{ id: string, label: string }[]}
 */
export function getLegalTocSections(document) {
  return (document?.sections ?? []).map((section) => ({
    id: section.id,
    label: section.label || section.title,
  }));
}

/**
 * @param {LegalInline | LegalInline[] | undefined} nodes
 * @returns {string}
 */
export function flattenLegalInlines(nodes) {
  const list = Array.isArray(nodes) ? nodes : [nodes];

  return list
    .map((node) => {
      if (node == null || node === "") {
        return "";
      }

      if (typeof node === "string") {
        return node;
      }

      if (node.type === "email") {
        return node.address || LEGAL_ENTITY.contactEmail;
      }

      if (node.type === "emphasis" || node.type === "link") {
        return node.content ?? "";
      }

      return "";
    })
    .join("");
}

/**
 * @param {LegalDocumentContent} document
 * @returns {string}
 */
export function flattenLegalDocument(document) {
  if (!document) {
    return "";
  }

  const header = [document.title, document.version, document.lastUpdated]
    .filter(Boolean)
    .join("\n");

  const body = (document.sections ?? [])
    .map((section) => {
      const blocks = (section.blocks ?? [])
        .map((block) => {
          if (block.type === "list") {
            return (block.items ?? []).map((item) => flattenLegalInlines(item)).join("\n");
          }

          return flattenLegalInlines(block.content);
        })
        .join("\n");

      return `${section.title}\n${blocks}`;
    })
    .join("\n");

  return `${header}\n${body}`;
}
