/**
 * Decisões das auth route guards — RC-BUG-001 / RC-LP-ROUTING-1
 *
 * Três conceitos explícitos de rota:
 *
 * - PUBLIC_ALWAYS (`resolvePublicAlwaysRoute`):
 *   Acessível autenticado ou não. Nunca redireciona por sessão.
 *   Exemplos: /, /lp/*, /share/*, /embed/*, /u/*, /termos, /privacidade
 *
 * - GUEST_ONLY (`resolveGuestRoute` / `resolvePublicRoute`):
 *   Páginas de autenticação. Autenticado → /dashboard.
 *   Exemplos: /login, /register, /forgot-password
 *
 * - PRIVATE (`resolveProtectedRoute`):
 *   Exige sessão (+ e-mail verificado quando aplicável).
 *   Exemplos: /dashboard, /projects/*, /settings, /plan
 *
 * Lógica pura (sem Firebase). A regra de verificação espelha
 * `needsEmailVerification` em authService.
 */

/**
 * @param {{ usesPasswordAuth?: boolean, emailVerified?: boolean } | null | undefined} user
 */
function needsEmailVerification(user) {
  return Boolean(user?.usesPasswordAuth && !user.emailVerified);
}

/**
 * PUBLIC_ALWAYS — sempre renderiza o conteúdo.
 * Não depende de loading de auth nem de perfil Firestore.
 *
 * @param {{ user?: unknown, loading?: boolean, signUpInProgress?: boolean }} [_state]
 * @returns {"children"}
 */
export function resolvePublicAlwaysRoute(_state) {
  return "children";
}

/**
 * GUEST_ONLY — visitantes veem a página; autenticados vão ao dashboard.
 *
 * @param {{ user: unknown, loading: boolean, signUpInProgress?: boolean }} state
 * @returns {"loading" | "dashboard" | "children"}
 */
export function resolveGuestRoute(state) {
  if (state.loading) {
    return "loading";
  }

  if (state.user && !state.signUpInProgress) {
    return "dashboard";
  }

  return "children";
}

/**
 * @deprecated Preferir `resolveGuestRoute` (GUEST_ONLY). Mantido por compatibilidade.
 * @param {{ user: unknown, loading: boolean, signUpInProgress?: boolean }} state
 * @returns {"loading" | "dashboard" | "children"}
 */
export function resolvePublicRoute(state) {
  return resolveGuestRoute(state);
}

/**
 * PRIVATE — exige autenticação (e verificação de e-mail quando aplicável).
 *
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
