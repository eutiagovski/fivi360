import { Link, useParams } from "react-router-dom";
import { usePageSeo } from "@/hooks/usePageSeo";
import { HelpBreadcrumb } from "@/help/components/HelpBreadcrumb";
import { HelpLayout } from "@/help/components/HelpLayout";
import { HelpNotFound } from "@/help/components/HelpNotFound";
import { HelpSidebar } from "@/help/components/HelpSidebar";
import { getHelpArticlesByCategory, getHelpCategory } from "@/help/content/articles";
import { helpArticlePath } from "@/help/utils/helpPaths";
import { buildHelpCategorySeo } from "@/help/utils/helpSeo";

export function HelpCategoryPage() {
  const { categorySlug } = useParams();
  const category = getHelpCategory(categorySlug);
  const articles = category ? getHelpArticlesByCategory(category.slug) : [];
  const seo = buildHelpCategorySeo(category);

  usePageSeo({
    title: seo.title,
    description: seo.description,
    enabled: Boolean(category),
  });

  if (!category) {
    return (
      <HelpLayout>
        <HelpNotFound />
      </HelpLayout>
    );
  }

  return (
    <HelpLayout sidebar={<HelpSidebar />}>
      <div data-testid="help-category-page">
        <HelpBreadcrumb category={category} />
        <h1 className="mt-5 text-2xl font-light tracking-tight text-white sm:text-3xl">
          {category.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          {category.description}
        </p>
        <ul className="mt-8 space-y-3" data-testid="help-category-articles">
          {articles.map((article) => (
            <li key={article.slug}>
              <Link
                to={helpArticlePath(article)}
                className="block rounded-2xl border border-zinc-800 px-4 py-4 transition-colors hover:border-zinc-600 sm:px-5"
                data-testid={`help-article-link-${article.slug}`}
              >
                <p className="text-sm font-medium text-white sm:text-base">
                  {article.title}
                </p>
                <p className="mt-1 text-sm text-zinc-400">{article.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </HelpLayout>
  );
}
