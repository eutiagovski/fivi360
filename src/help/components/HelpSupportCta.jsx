import { HELP_CONTACT_EMAIL } from "@/help/config/help";

export function HelpSupportCta() {
  return (
    <section
      className="mt-12 rounded-2xl border border-zinc-800 bg-[#0c0c0c] px-5 py-6"
      data-testid="help-support-cta"
    >
      <h2 className="text-base font-light text-white">
        Não encontrou o que precisava?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        Escreva para{" "}
        <a
          href={`mailto:${HELP_CONTACT_EMAIL}`}
          className="text-white underline underline-offset-4 hover:text-zinc-200"
          data-testid="help-support-email"
        >
          {HELP_CONTACT_EMAIL}
        </a>
        . Respondemos pelo e-mail institucional.
      </p>
    </section>
  );
}
