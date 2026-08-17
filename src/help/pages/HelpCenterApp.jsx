import { Route, Routes } from "react-router-dom";
import { HelpArticlePage } from "@/help/pages/HelpArticlePage";
import { HelpCategoryPage } from "@/help/pages/HelpCategoryPage";
import { HelpHomePage } from "@/help/pages/HelpHomePage";
import { HelpLayout } from "@/help/components/HelpLayout";
import { HelpNotFound } from "@/help/components/HelpNotFound";

/**
 * App da Central de Ajuda.
 *
 * Hoje montado em /ajuda/* no SPA principal.
 * Preparado para migrar para apps/help/ e ajuda.fivi360.com.br.
 */
export function HelpCenterApp() {
  return (
    <Routes>
      <Route index element={<HelpHomePage />} />
      <Route path=":categorySlug" element={<HelpCategoryPage />} />
      <Route path=":categorySlug/:articleSlug" element={<HelpArticlePage />} />
      <Route
        path="*"
        element={
          <HelpLayout>
            <HelpNotFound />
          </HelpLayout>
        }
      />
    </Routes>
  );
}
