import { HelpCategoryNav } from "@/help/components/HelpCategoryNav";
import { HelpSearchPanel } from "@/help/components/HelpSearchPanel";

export function HelpSidebar() {
  return (
    <div className="space-y-6" data-testid="help-sidebar">
      <HelpSearchPanel id="help-sidebar-search" size="compact" />
      <HelpCategoryNav />
    </div>
  );
}
