import { Fragment } from "react";
import { Link } from "react-router-dom";
import { HELP_CONTACT_EMAIL } from "@/help/config/help";
import { HelpSoftwareExportGrid } from "@/help/components/HelpSoftwareExportGrid";
import { flattenHelpInlines } from "@/help/utils/helpBlocks";

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
        <strong key={key} className="font-medium text-white">
          {node.content}
        </strong>
      );
    }

    if (node.type === "email") {
      const email = node.address || HELP_CONTACT_EMAIL;
      return (
        <a
          key={key}
          href={`mailto:${email}`}
          className="text-white underline underline-offset-4 hover:text-zinc-200"
        >
          {email}
        </a>
      );
    }

    if (node.type === "link") {
      if (isInternalHref(node.href)) {
        return (
          <Link
            key={key}
            to={node.href}
            className="text-white underline underline-offset-4 hover:text-zinc-200"
          >
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
          className="text-white underline underline-offset-4 hover:text-zinc-200"
        >
          {node.content}
        </a>
      );
    }

    return null;
  });
}

function Callout({ tone, children, testId }) {
  const tones = {
    note: "border-zinc-800 bg-zinc-900/40 text-zinc-400",
    tip: "border-zinc-700 bg-zinc-900/60 text-zinc-300",
    warning: "border-amber-900/50 bg-amber-950/20 text-amber-100/90",
  };

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}
      data-testid={testId}
      role="note"
    >
      {children}
    </div>
  );
}

function renderBlock(block, index) {
  if (block.type === "paragraph") {
    return (
      <p key={index} className="text-sm leading-relaxed text-zinc-300 sm:text-base">
        {renderInlines(block.content, `p${index}`)}
      </p>
    );
  }

  if (block.type === "heading") {
    const Tag = block.level === 3 ? "h3" : "h2";
    const className =
      block.level === 3
        ? "pt-2 text-base font-medium text-white"
        : "pt-4 text-lg font-light tracking-tight text-white sm:text-xl";

    return (
      <Tag key={index} className={className}>
        {typeof block.content === "string"
          ? block.content
          : flattenHelpInlines(block.content)}
      </Tag>
    );
  }

  if (block.type === "list") {
    const ListTag = block.ordered ? "ol" : "ul";

    return (
      <ListTag
        key={index}
        className={`space-y-2 pl-5 text-sm leading-relaxed text-zinc-300 sm:text-base ${
          block.ordered ? "list-decimal" : "list-disc"
        }`}
      >
        {(block.items ?? []).map((item, itemIndex) => (
          <li key={itemIndex}>{renderInlines(item, `l${index}-${itemIndex}`)}</li>
        ))}
      </ListTag>
    );
  }

  if (block.type === "steps") {
    return (
      <ol
        key={index}
        className="space-y-4"
        data-testid="help-steps"
      >
        {(block.items ?? []).map((item, itemIndex) => {
          const title = item && typeof item === "object" ? item.title : null;
          const content =
            item && typeof item === "object" && !Array.isArray(item)
              ? item.content
              : item;

          return (
            <li
              key={itemIndex}
              className="flex gap-4"
              data-testid={`help-step-${itemIndex + 1}`}
            >
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-xs text-zinc-300">
                {itemIndex + 1}
              </span>
              <div className="min-w-0 space-y-1">
                {title ? (
                  <p className="text-sm font-medium text-white sm:text-base">{title}</p>
                ) : null}
                <div className="text-sm leading-relaxed text-zinc-300 sm:text-base">
                  {renderInlines(content, `s${index}-${itemIndex}`)}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  if (block.type === "note") {
    return (
      <Callout key={index} tone="note" testId="help-block-note">
        {renderInlines(block.content, `n${index}`)}
      </Callout>
    );
  }

  if (block.type === "tip") {
    return (
      <Callout key={index} tone="tip" testId="help-block-tip">
        {renderInlines(block.content, `t${index}`)}
      </Callout>
    );
  }

  if (block.type === "warning") {
    return (
      <Callout key={index} tone="warning" testId="help-block-warning">
        {renderInlines(block.content, `w${index}`)}
      </Callout>
    );
  }

  if (block.type === "image-placeholder") {
    return (
      <div
        key={index}
        className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-4 text-center"
        data-testid="help-image-placeholder"
      >
        <p className="text-sm text-zinc-500">
          {block.caption || "Imagem ilustrativa em breve"}
        </p>
      </div>
    );
  }

  if (block.type === "link") {
    const body = (
      <>
        <p className="text-sm font-medium text-white">{flattenHelpInlines(block.content)}</p>
        {block.description ? (
          <p className="mt-1 text-sm text-zinc-400">{block.description}</p>
        ) : null}
      </>
    );

    if (isInternalHref(block.href)) {
      return (
        <Link
          key={index}
          to={block.href}
          className="block rounded-2xl border border-zinc-800 px-4 py-3 transition-colors hover:border-zinc-600"
          data-testid="help-block-link"
        >
          {body}
        </Link>
      );
    }

    return (
      <a
        key={index}
        href={block.href}
        className="block rounded-2xl border border-zinc-800 px-4 py-3 transition-colors hover:border-zinc-600"
        data-testid="help-block-link"
      >
        {body}
      </a>
    );
  }

  if (block.type === "software-export") {
    return <HelpSoftwareExportGrid key={index} />;
  }

  return null;
}

/**
 * @param {{ blocks?: import("@/help/utils/helpBlocks").HelpBlock[] }} props
 */
export function HelpArticleBody({ blocks = [] }) {
  return (
    <div className="space-y-5" data-testid="help-article-body">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}
