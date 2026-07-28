/**
 * Estado pós-cadastro para a tela pública `/verify-email-sent`.
 * Persistido em sessionStorage para sobreviver a refresh sem depender de sessão Auth.
 */

const STORAGE_KEY = "fivi360.verifyEmailSent";

/**
 * @param {{
 *   email: string,
 *   verificationEmailQueued: boolean,
 * }} state
 */
export function persistVerifyEmailSentState({ email, verificationEmailQueued }) {
  if (typeof sessionStorage === "undefined" || !email) {
    return;
  }

  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      email,
      verificationEmailQueued: Boolean(verificationEmailQueued),
      savedAt: Date.now(),
    }),
  );
}

/**
 * @returns {{ email: string, verificationEmailQueued: boolean } | null}
 */
export function readVerifyEmailSentState() {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (!parsed?.email || typeof parsed.email !== "string") {
      return null;
    }

    return {
      email: parsed.email,
      verificationEmailQueued: Boolean(parsed.verificationEmailQueued),
    };
  } catch {
    return null;
  }
}

export function clearVerifyEmailSentState() {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  sessionStorage.removeItem(STORAGE_KEY);
}
