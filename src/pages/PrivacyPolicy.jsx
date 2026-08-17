import { LegalDocumentRenderer } from "@/components/legal/LegalDocumentRenderer";
import { PRIVACY_POLICY_CONTENT } from "@/legal/privacyPolicyContent";

export function PrivacyPolicy() {
  return <LegalDocumentRenderer document={PRIVACY_POLICY_CONTENT} />;
}
