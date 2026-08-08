import {
  ACCESS_EARLY_PROFESSIONS,
  ACCESS_EARLY_PROFESSION_OTHER_ID,
} from "../config";
import { isPlausibleBrazilPhone } from "./formatBrazilPhoneMask";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param {{
 *   name: string,
 *   email: string,
 *   phone: string,
 *   professionId: string,
 *   professionOther: string,
 * }} values
 * @returns {{
 *   valid: boolean,
 *   errors: Record<string, string>,
 *   profession: string,
 * }}
 */
export function validateAccessEarlyForm(values) {
  /** @type {Record<string, string>} */
  const errors = {};

  const name = (values.name ?? "").trim();
  const email = (values.email ?? "").trim();
  const phone = (values.phone ?? "").trim();
  const professionId = values.professionId ?? "";
  const professionOther = (values.professionOther ?? "").trim();

  if (!name) {
    errors.name = "Informe seu nome.";
  }

  if (!email) {
    errors.email = "Informe seu e-mail.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Informe um e-mail válido.";
  }

  if (!phone) {
    errors.phone = "Informe seu WhatsApp.";
  } else if (!isPlausibleBrazilPhone(phone)) {
    errors.phone = "Informe um WhatsApp válido com DDD.";
  }

  const selected = ACCESS_EARLY_PROFESSIONS.find((item) => item.id === professionId);

  if (!selected) {
    errors.professionId = "Selecione sua profissão.";
  } else if (selected.id === ACCESS_EARLY_PROFESSION_OTHER_ID) {
    if (!professionOther) {
      errors.professionOther = "Descreva sua profissão.";
    }
  }

  let profession = "";

  if (selected) {
    profession =
      selected.id === ACCESS_EARLY_PROFESSION_OTHER_ID
        ? professionOther
        : selected.label;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    profession,
  };
}
