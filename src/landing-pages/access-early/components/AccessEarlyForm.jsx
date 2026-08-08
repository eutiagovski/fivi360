import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACCESS_EARLY_PROFESSIONS,
  ACCESS_EARLY_PROFESSION_OTHER_ID,
} from "../config";

const fieldClass =
  "w-full min-w-0 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-zinc-600 disabled:opacity-60";

const labelClass = "block text-sm font-medium text-zinc-400 mb-2";

const errorClass = "mt-1.5 text-sm text-red-400";

/**
 * @param {{
 *   id: string,
 *   label: string,
 *   error?: string,
 *   children: import("react").ReactNode,
 * }} props
 */
function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className={errorClass} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Formulário apresentacional — estado via `useAccessEarlyForm` no container.
 *
 * @param {{
 *   form: {
 *     values: object,
 *     errors: Record<string, string>,
 *     submitError: string,
 *     isSubmitting: boolean,
 *     setField: (field: string, value: unknown) => void,
 *     setPhone: (raw: string) => void,
 *     handleSubmit: (event?: { preventDefault?: () => void }) => void | Promise<void>,
 *   },
 * }} props
 */
export function AccessEarlyForm({ form }) {
  const {
    values,
    errors,
    submitError,
    isSubmitting,
    setField,
    setPhone,
    handleSubmit,
  } = form;

  const isOther = values.professionId === ACCESS_EARLY_PROFESSION_OTHER_ID;

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full text-left space-y-5"
      data-testid="access-early-form"
      noValidate
    >
      <Field id="access-early-name" label="Nome" error={errors.name}>
        <input
          id="access-early-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Seu nome"
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "access-early-name-error" : undefined}
          className={fieldClass}
          data-testid="access-early-name-input"
        />
      </Field>

      <Field id="access-early-email" label="E-mail" error={errors.email}>
        <input
          id="access-early-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="voce@exemplo.com"
          value={values.email}
          onChange={(e) => setField("email", e.target.value)}
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "access-early-email-error" : undefined}
          className={fieldClass}
          data-testid="access-early-email-input"
        />
      </Field>

      <Field id="access-early-phone" label="WhatsApp" error={errors.phone}>
        <input
          id="access-early-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="(21) 99999-9999"
          value={values.phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "access-early-phone-error" : undefined}
          className={fieldClass}
          data-testid="access-early-phone-input"
        />
      </Field>

      <Field
        id="access-early-profession"
        label="Profissão"
        error={errors.professionId}
      >
        <Select
          value={values.professionId || undefined}
          onValueChange={(value) => setField("professionId", value)}
          disabled={isSubmitting}
        >
          <SelectTrigger
            id="access-early-profession"
            aria-invalid={Boolean(errors.professionId)}
            aria-describedby={
              errors.professionId ? "access-early-profession-error" : undefined
            }
            className="w-full min-w-0 h-auto px-4 py-3 bg-zinc-900 border-zinc-800 rounded-xl text-white focus:ring-white data-[placeholder]:text-zinc-600"
            data-testid="access-early-profession-select"
          >
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
            {ACCESS_EARLY_PROFESSIONS.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {isOther ? (
        <Field
          id="access-early-profession-other"
          label="Qual a sua profissão?"
          error={errors.professionOther}
        >
          <input
            id="access-early-profession-other"
            name="professionOther"
            type="text"
            placeholder="Sua profissão"
            value={values.professionOther}
            onChange={(e) => setField("professionOther", e.target.value)}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.professionOther)}
            aria-describedby={
              errors.professionOther
                ? "access-early-profession-other-error"
                : undefined
            }
            className={fieldClass}
            data-testid="access-early-profession-other-input"
          />
        </Field>
      ) : null}

      <div className="flex items-start gap-3">
        <Checkbox
          id="access-early-marketing"
          checked={values.marketingConsent}
          onCheckedChange={(checked) =>
            setField("marketingConsent", checked === true)
          }
          disabled={isSubmitting}
          data-testid="access-early-marketing-checkbox"
          className="mt-0.5 shrink-0 border-zinc-600 data-[state=checked]:bg-white data-[state=checked]:text-black"
        />
        <label
          htmlFor="access-early-marketing"
          className="text-sm text-zinc-400 leading-relaxed cursor-pointer select-none break-words"
        >
          Quero receber novidades, conteúdos e promoções do FIVI360 por e-mail.
        </label>
      </div>

      {submitError ? (
        <div
          className="rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 space-y-2"
          role="alert"
          data-testid="access-early-submit-error"
        >
          <p className="text-sm text-red-300">{submitError}</p>
          <button
            type="submit"
            className="text-sm text-white underline underline-offset-2 hover:text-zinc-200"
            data-testid="access-early-retry-btn"
            disabled={isSubmitting}
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-white text-black rounded-full px-6 py-3.5 font-medium hover:bg-zinc-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        data-testid="access-early-submit-btn"
      >
        {isSubmitting ? "Enviando..." : "Quero acesso antecipado"}
      </button>

      <p
        className="text-xs text-zinc-500 leading-relaxed text-center"
        data-testid="access-early-privacy-note"
      >
        Ao enviar, você concorda com o uso dos dados para gerenciar seu acesso
        antecipado, conforme nossa{" "}
        <Link
          to="/privacidade"
          className="text-zinc-400 underline underline-offset-2 hover:text-white"
          data-testid="access-early-privacy-link"
        >
          Política de Privacidade
        </Link>
        .
      </p>
    </form>
  );
}
