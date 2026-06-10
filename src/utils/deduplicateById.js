/**
 * Anexa itens novos à lista existente, ignorando IDs já presentes.
 *
 * @template {{ id: string }} T
 * @param {T[]} existing
 * @param {T[]} incoming
 * @returns {T[]}
 */
export function deduplicateMergeById(existing, incoming) {
  const seen = new Set(existing.map((item) => item.id));
  const unique = incoming.filter((item) => !seen.has(item.id));
  return [...existing, ...unique];
}
