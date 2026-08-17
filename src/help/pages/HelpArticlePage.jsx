import { useParams } from "react-router-dom";
import { usePageSeo } from "@/hooks/usePageSeo";
import { HelpArticleBody } from "@/help/components/HelpArticleBody";
import { HelpBreadcrumb } from "@/help/components/HelpBreadcrumb";
import { HelpLayout } from "@/help/components/HelpLayout";
import { HelpNotFound } from "@/help/components/HelpNotFound";
import { HelpRelatedArticles } from "@/help/components/HelpRelatedArticles";
import { HelpSidebar } from "@/help/components/HelpSidebar";
import { HelpSupportCta } from "@/help/components/HelpSupportCta";
import { HelpVideoSlot } from "@/help/components/HelpVideoSlot";
import {
  getHelpArticle,
  getHelpCategory,
  getRelatedHelpArticles,
} from "@/help/content/articles";
import { buildHelpArticleSeo } from "@/help/utils/helpSeo";

export function HelpArticlePage() {
  const { categorySlug, articleSlug } = useParams();
  const article = getHelpArticle(categorySlug, articleSlug);
  const category = article ? getHelpCategory(article.category) : undefined;
  const related = article ? getRelatedHelpArticles(article) : [];
  const seo = article ? buildHelpArticleSeo(article) : { title: "", description: "" };

  usePageSeo({
    title: seo.title,
    description: seo.description,
    enabled: Boolean(article),
  });

  if (!article || !category) {
    return (
      <HelpLayout>
        <HelpNotFound />
      </HelpLayout>
    );
  }

  const comingSoon = article.status === "coming-soon";

  return (
    <HelpLayout sidebar={<HelpSidebar />}>
      <article data-testid="help-article-page">
        <HelpBreadcrumb category={category} articleTitle={article.title} />

        <p className="mt-5 text-xs uppercase tracking-wider text-zinc-500">
          {category.title}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1
            className="text-2xl font-light tracking-tight text-white sm:text-3xl"
            data-testid="help-article-title"
          >
            {article.title}
          </h1>
          {comingSoon ? (
            <span
              className="rounded-full border border-zinc-700 px-2.5 py-1 text-[10px] uppercase tracking-wider text-zinc-400"
              data-testid="help-article-coming-soon"
            >
              Em breve
            </span>
          ) : null}
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          {article.description}
        </p>
        {article.updatedAt ? (
          <p className="mt-3 text-xs text-zinc-500" data-testid="help-article-updated">
            Atualizado em {article.updatedAt}
          </p>
        ) : null}

        <div className="mt-8 space-y-8">
          <HelpVideoSlot videoUrl={article.videoUrl} />
          <HelpArticleBody blocks={article.blocks} />
        </div>

        <HelpRelatedArticles articles={related} />
        <HelpSupportCta />
      </article>
    </HelpLayout>
  );
}
