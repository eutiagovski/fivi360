import { Fragment } from "react";
import { Link } from "react-router-dom";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { getLegalTocSections } from "@/legal/legalDocument";
import { LEGAL_ENTITY } from "@/legal/legalEntity";

function isInternalHref(href) {
  return typeof href === "string" && href.startsWith("/");
}

function renderInlines(nodes, keyPrefix) {
  const list = Array.isArray(nodes) ? nodes : [nodes];

  return list.map((node, index) => {
    const key = `${keyPrefix}-${index}`;

    if (node == null || node === "") {
      return null;
    }

    if (typeof node === "string") {
      return <Fragment key={key}>{node}</Fragment>;
    }

    if (node.type === "emphasis") {
      return (
        <strong key={key} className="text-white font-normal">
          {node.content}
        </strong>
      );
    }

    if (node.type === "email") {
      const email = node.address || LEGAL_ENTITY.contactEmail;
      return (
        <a key={key} href={`mailto:${email}`}>
          {email}
        </a>
      );
    }

    if (node.type === "link") {
      if (isInternalHref(node.href)) {
        return (
          <Link key={key} to={node.href}>
            {node.content}
          </Link>
        );
      }

      return (
        <a
          key={key}
          href={node.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {node.content}
        </a>
      );
    }

    return null;
  });
}

function renderBlock(block, index) {
  if (block.type === "paragraph") {
    return <p key={index}>{renderInlines(block.content, `p${index}`)}</p>;
  }

  if (block.type === "list") {
    const ListTag = block.ordered ? "ol" : "ul";

    return (
      <ListTag key={index}>
        {(block.items ?? []).map((item, itemIndex) => (
          <li key={itemIndex}>{renderInlines(item, `l${index}-${itemIndex}`)}</li>
        ))}
      </ListTag>
    );
  }

  if (block.type === "note") {
    return (
      <p key={index} className="text-sm text-zinc-500">
        {renderInlines(block.content, `n${index}`)}
      </p>
    );
  }

  return null;
}

/**
 * Renderiza um documento legal estruturado no layout atual.
 *
 * @param {{
 *   document: import("@/legal/legalDocument").LegalDocumentContent,
 * }} props
 */
export function LegalDocumentRenderer({ document }) {
  const sections = getLegalTocSections(document);

  return (
    <LegalPageLayout
      title={document.title}
      sections={sections}
      lastUpdated={document.lastUpdated}
      version={document.version}
    >
      {document.sections.map((section) => (
        <LegalSection key={section.id} id={section.id} title={section.title}>
          {section.blocks.map((block, index) => renderBlock(block, index))}
        </LegalSection>
      ))}
    </LegalPageLayout>
  );
}
