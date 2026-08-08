/**
 * Alias de PublicAlwaysRoute para a Home institucional (/).
 *
 * Antes (RC-LP-ROUTING-1): redirecionava autenticados para /dashboard.
 * Agora: PUBLIC_ALWAYS — autenticado e visitante permanecem na Home.
 *
 * @see PublicAlwaysRoute
 */
export { PublicAlwaysRoute as LandingRoute } from "./PublicAlwaysRoute";
