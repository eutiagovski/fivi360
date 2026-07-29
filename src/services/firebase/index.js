/**
 * Utilitários compartilhados Firebase (fronteira SDK ↔ domínio).
 *
 * @see docs/firebase-foundation.md
 * @see docs/RC-INDEXEDDB-P0-PREP-1.md
 */

export {
  toAppDate,
  toMillis,
  toFirestoreDate,
  buildPaginationCursor,
  isPaginationCursor,
} from "./dates";
