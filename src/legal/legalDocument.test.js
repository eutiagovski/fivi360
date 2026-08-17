import {
  flattenLegalDocument,
  flattenLegalInlines,
  getLegalTocSections,
  legalEmail,
  paragraph,
  unorderedList,
} from "@/legal/legalDocument";
import { LEGAL_ENTITY } from "@/legal/legalEntity";

describe("legalDocument helpers — RC-LEGAL-DOCS-GOLIVE-1", () => {
  it("flattens email inlines from LEGAL_ENTITY", () => {
    expect(flattenLegalInlines(["Fale com ", legalEmail(), "."])).toBe(
      `Fale com ${LEGAL_ENTITY.contactEmail}.`,
    );
  });

  it("builds toc labels from section label or title", () => {
    expect(
      getLegalTocSections({
        sections: [
          { id: "a", title: "1. Introdução", label: "Introdução", blocks: [] },
          { id: "b", title: "2. Contato", blocks: [] },
        ],
      }),
    ).toEqual([
      { id: "a", label: "Introdução" },
      { id: "b", label: "2. Contato" },
    ]);
  });

  it("flattens paragraphs and lists", () => {
    const text = flattenLegalDocument({
      title: "Doc",
      version: "1.1",
      lastUpdated: "hoje",
      sections: [
        {
          id: "s",
          title: "1. Seção",
          blocks: [
            paragraph("Primeiro parágrafo."),
            unorderedList(["item um", "item dois"]),
          ],
        },
      ],
    });

    expect(text).toContain("Primeiro parágrafo.");
    expect(text).toContain("item um");
    expect(text).toContain("item dois");
  });
});
