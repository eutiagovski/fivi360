/**
 * Helpers de conteúdo da Central de Ajuda (sem JSX e sem Markdown).
 *
 * @typedef {string | {
 *   type: "emphasis" | "link" | "email",
 *   content?: string,
 *   href?: string,
 *   address?: string,
 * }} HelpInline
 *
 * @typedef {{
 *   type: "paragraph" | "heading" | "list" | "steps" | "note" | "tip" | "warning" | "image-placeholder" | "link" | "software-export",
 *   content?: HelpInline | HelpInline[],
 *   level?: number,
 *   ordered?: boolean,
 *   items?: Array<HelpInline | HelpInline[] | { title?: string, content?: HelpInline | HelpInline[] }>,
 *   caption?: string,
 *   href?: string,
 *   description?: string,
 * }} HelpBlock
 */

export function paragraph(...parts) {
  const content = parts.length === 1 ? parts[0] : parts;
  return { type: "paragraph", content };
}

export function heading(content, level = 2) {
  return { type: "heading", level, content };
}

export function unorderedList(items) {
  return { type: "list", items };
}

export function orderedList(items) {
  return { type: "list", ordered: true, items };
}

export function steps(items) {
  return { type: "steps", items };
}

export function note(content) {
  return { type: "note", content };
}

export function tip(content) {
  return { type: "tip", content };
}

export function warning(content) {
  return { type: "warning", content };
}

export function imagePlaceholder(caption) {
  return { type: "image-placeholder", caption };
}

export function linkBlock(href, content, description) {
  return { type: "link", href, content, description };
}

export function softwareExportBlock() {
  return { type: "software-export" };
}

export function emphasis(content) {
  return { type: "emphasis", content };
}

export function helpLink(href, content) {
  return { type: "link", href, content };
}

export function helpEmail(address) {
  return { type: "email", address };
}

/**
 * @param {HelpInline | HelpInline[] | undefined} nodes
 * @returns {string}
 */
export function flattenHelpInlines(nodes) {
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
        return node.address || "";
      }

      if (node.type === "emphasis" || node.type === "link") {
        return node.content ?? "";
      }

      return "";
    })
    .join("");
}

/**
 * @param {HelpBlock} block
 * @returns {string}
 */
export function flattenHelpBlock(block) {
  if (!block) {
    return "";
  }

  if (block.type === "list" || block.type === "steps") {
    return (block.items ?? [])
      .map((item) => {
        if (item && typeof item === "object" && !Array.isArray(item) && item.type == null) {
          return [item.title, flattenHelpInlines(item.content)].filter(Boolean).join(" ");
        }

        return flattenHelpInlines(item);
      })
      .join("\n");
  }

  if (block.type === "image-placeholder") {
    return block.caption ?? "";
  }

  if (block.type === "link") {
    return [flattenHelpInlines(block.content), block.description, block.href]
      .filter(Boolean)
      .join(" ");
  }

  if (block.type === "software-export") {
    return "";
  }

  return flattenHelpInlines(block.content);
}

/**
 * @param {{ title?: string, description?: string, blocks?: HelpBlock[] }} article
 * @returns {string}
 */
export function flattenHelpArticle(article) {
  if (!article) {
    return "";
  }

  const blocks = (article.blocks ?? []).map(flattenHelpBlock).join("\n");
  return [article.title, article.description, blocks].filter(Boolean).join("\n");
}
