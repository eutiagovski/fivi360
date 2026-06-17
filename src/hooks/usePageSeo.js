import { useEffect } from "react";
import {
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
} from "@/utils/publicSeo";

const MANAGED_META_TAGS = [
  { attr: "name", key: "description" },
  { attr: "property", key: "og:title" },
  { attr: "property", key: "og:description" },
  { attr: "name", key: "twitter:title" },
  { attr: "name", key: "twitter:description" },
];

function readMetaContent(attr, key) {
  return (
    document.querySelector(`meta[${attr}="${key}"]`)?.getAttribute("content") ??
    null
  );
}

function writeMetaContent(attr, key, content) {
  let element = document.querySelector(`meta[${attr}="${key}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

/**
 * Atualiza title, meta description e tags OG/Twitter para a rota atual.
 *
 * @param {{ title?: string, description?: string, enabled?: boolean }} options
 */
export function usePageSeo({ title, description, enabled = true }) {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const resolvedTitle = title?.trim() || DEFAULT_SITE_TITLE;
    const resolvedDescription =
      description?.trim() || DEFAULT_SITE_DESCRIPTION;

    const previousTitle = document.title;
    const previousMeta = MANAGED_META_TAGS.map(({ attr, key }) => ({
      attr,
      key,
      content: readMetaContent(attr, key),
    }));

    document.title = resolvedTitle;
    writeMetaContent("name", "description", resolvedDescription);
    writeMetaContent("property", "og:title", resolvedTitle);
    writeMetaContent("property", "og:description", resolvedDescription);
    writeMetaContent("name", "twitter:title", resolvedTitle);
    writeMetaContent("name", "twitter:description", resolvedDescription);

    return () => {
      document.title = previousTitle || DEFAULT_SITE_TITLE;

      for (const { attr, key, content } of previousMeta) {
        if (content == null) {
          document.querySelector(`meta[${attr}="${key}"]`)?.remove();
          continue;
        }

        writeMetaContent(attr, key, content);
      }
    };
  }, [title, description, enabled]);
}
