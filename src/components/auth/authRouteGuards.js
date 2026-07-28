/**
 * Decisões das auth route guards — RC-BUG-001
 *
 * Lógica pura (sem Firebase) usada por PublicRoute / ProtectedRoute / VerifyEmailRoute.
 * A regra de verificação espelha `needsEmailVerification` em authService.
 */

/**
 * @param {{ usesPasswordAuth?: boolean, emailVerified?: boolean } | null | undefined} user
 */
function needsEmailVerification(user) {
  return Boolean(user?.usesPasswordAuth && !user.emailVerified);
}

/**
 * @param {{ user: unknown, loading: boolean, signUpInProgress?: boolean }} state
 * @returns {"loading" | "dashboard" | "children"}
 */
export function resolvePublicRoute(state) {
  if (state.loading) {
    return "loading";
  }

  if (state.user && !state.signUpInProgress) {
    return "dashboard";
  }

  return "children";
}

/**
 * @param {{
 *   user: { usesPasswordAuth?: boolean, emailVerified?: boolean } | null,
 *   loading: boolean,
 *   signUpInProgress?: boolean,
 * }} state
 * @returns {"loading" | "login" | "verify-email" | "children"}
 */
export function resolveProtectedRoute(state) {
  if (state.loading || state.signUpInProgress) {
    return "loading";
  }

  if (!state.user) {
    return "login";
  }

  if (needsEmailVerification(state.user)) {
    return "verify-email";
  }

  return "children";
}

/**
 * @param {{
 *   user: { usesPasswordAuth?: boolean, emailVerified?: boolean } | null,
 *   loading: boolean,
 *   signUpInProgress?: boolean,
 * }} state
 * @returns {"loading" | "login" | "dashboard" | "children"}
 */
export function resolveVerifyEmailRoute(state) {
  if (state.loading || state.signUpInProgress) {
    return "loading";
  }

  if (!state.user) {
    return "login";
  }

  if (!needsEmailVerification(state.user)) {
    return "dashboard";
  }

  return "children";
}
