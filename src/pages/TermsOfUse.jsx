import { LegalDocumentRenderer } from "@/components/legal/LegalDocumentRenderer";
import { TERMS_OF_USE_CONTENT } from "@/legal/termsOfUseContent";

export function TermsOfUse() {
  return <LegalDocumentRenderer document={TERMS_OF_USE_CONTENT} />;
}
