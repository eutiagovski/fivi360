/** @type {Map<string, number>} */
const recentViewKeys = new Map();

const VIEW_DEDUP_MS = 3000;

/**
 * Evita disparos duplicados no mesmo carregamento (ex.: React StrictMode).
 * Permite nova contagem após a janela de deduplicação ou com chave diferente.
 *
 * @param {string} viewKey — chave interna; não enviada ao analytics.
 * @returns {boolean}
 */
export function shouldRecordViewOnce(viewKey) {
  if (!viewKey) {
    return false;
  }

  const now = Date.now();
  const lastRecordedAt = recentViewKeys.get(viewKey);

  if (lastRecordedAt != null && now - lastRecordedAt < VIEW_DEDUP_MS) {
    return false;
  }

  recentViewKeys.set(viewKey, now);
  return true;
}

/**
 * Limpa o registro de deduplicação (útil em testes).
 *
 * @param {string} [viewKey]
 */
export function resetRecordedViews(viewKey) {
  if (viewKey) {
    recentViewKeys.delete(viewKey);
    return;
  }

  recentViewKeys.clear();
}
