import { useMemo, useState } from "react";
import { HelpSearch } from "@/help/components/HelpSearch";
import { HelpSearchResults } from "@/help/components/HelpSearchResults";
import { getListedHelpArticles } from "@/help/content/articles";
import { searchHelpArticles } from "@/help/utils/helpSearch";

/**
 * @param {{
 *   size?: "hero" | "compact",
 *   id?: string,
 *   autoFocus?: boolean,
 * }} props
 */
export function HelpSearchPanel({ size = "compact", id, autoFocus = false }) {
  const [query, setQuery] = useState("");
  const listed = useMemo(() => getListedHelpArticles(), []);
  const results = useMemo(
    () => searchHelpArticles(query, { articles: listed }),
    [query, listed],
  );

  return (
    <div data-testid="help-search-panel">
      <HelpSearch
        id={id}
        value={query}
        onChange={setQuery}
        size={size}
        autoFocus={autoFocus}
      />
      <HelpSearchResults
        query={query}
        results={results}
        onNavigate={() => setQuery("")}
      />
    </div>
  );
}
