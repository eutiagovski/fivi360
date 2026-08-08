/**
 * PUBLIC_ALWAYS — rotas acessíveis autenticado ou não.
 *
 * Não aguarda loading de auth, não redireciona, não aplica LegalConsentGate.
 * Usado por Home (/), Landing Pages (/lp/*) e superfícies públicas equivalentes
 * que optam por um wrapper explícito (share/embed/portfolio já ficam sem wrapper).
 *
 * @see resolvePublicAlwaysRoute
 */
export function PublicAlwaysRoute({ children }) {
  return children;
}
