/**
 * Fronteira de conversão de datas Firebase ↔ aplicação.
 *
 * Padrão da app: `Date | null` nos DTOs públicos.
 * Writes no Firestore continuam usando `serverTimestamp()` nos services.
 */

import { Timestamp } from "firebase/firestore";

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isUnresolvedServerTimestamp(value) {
  if (value == null) {
    return false;
  }

  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    return (
      normalized === "server_timestamp"
      || normalized === "server-timestamp"
      || normalized === "servertimestamp"
    );
  }

  if (typeof value !== "object") {
    return false;
  }

  const record = /** @type {Record<string, unknown>} */ (value);

  if (record._methodName === "serverTimestamp") {
    return true;
  }

  if (record.type === "serverTimestamp") {
    return true;
  }

  // FieldValue / sentinel sem seconds (ainda não resolvido pelo servidor)
  if (
    typeof record.seconds !== "number"
    && typeof record.toDate !== "function"
    && typeof record.toMillis !== "function"
    && (typeof record.isEqual === "function" || "operand" in record)
  ) {
    return true;
  }

  return false;
}

/**
 * Converte qualquer valor de data persistido/legado para `Date | null`.
 *
 * Aceita: Timestamp, Date, ISO string, epoch ms, `{ seconds }`, null/undefined.
 * Sentinels `serverTimestamp` não resolvidos → `null`.
 *
 * @param {unknown} value
 * @returns {Date | null}
 */
export function toAppDate(value) {
  if (value == null) {
    return null;
  }

  if (isUnresolvedServerTimestamp(value)) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "object") {
    const record = /** @type {Record<string, unknown>} */ (value);

    if (typeof record.toDate === "function") {
      try {
        const date = record.toDate();
        if (date instanceof Date && !Number.isNaN(date.getTime())) {
          return date;
        }
      } catch {
        return null;
      }
    }

    if (typeof record.toMillis === "function") {
      try {
        const ms = record.toMillis();
        if (typeof ms === "number" && Number.isFinite(ms)) {
          const date = new Date(ms);
          return Number.isNaN(date.getTime()) ? null : date;
        }
      } catch {
        return null;
      }
    }

    if (typeof record.seconds === "number") {
      const nanos =
        typeof record.nanoseconds === "number" ? record.nanoseconds : 0;
      const date = new Date(record.seconds * 1000 + Math.floor(nanos / 1e6));
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/**
 * Epoch ms para ordenação/comparação. `0` quando ausente/inválido.
 *
 * @param {unknown} value
 * @returns {number}
 */
export function toMillis(value) {
  const date = toAppDate(value);
  return date ? date.getTime() : 0;
}

/**
 * Converte `Date` da app para Timestamp Firestore (writes explícitos).
 * Preferir `serverTimestamp()` para createdAt/updatedAt em creates/updates online.
 *
 * @param {Date | null | undefined} value
 * @returns {import("firebase/firestore").Timestamp | null}
 */
export function toFirestoreDate(value) {
  if (value == null) {
    return null;
  }

  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return null;
  }

  return Timestamp.fromDate(value);
}

/**
 * Cursor de paginação serializável (sem QueryDocumentSnapshot).
 *
 * @typedef {Object} PaginationCursor
 * @property {string} id — document id do último item da página
 * @property {number | null} sortValue — epoch ms do campo de ordenação (updatedAt)
 */

/**
 * @param {string} id
 * @param {unknown} sortFieldValue
 * @returns {PaginationCursor}
 */
export function buildPaginationCursor(id, sortFieldValue) {
  const ms = toMillis(sortFieldValue);
  return {
    id,
    sortValue: ms > 0 ? ms : null,
  };
}

/**
 * @param {unknown} cursor
 * @returns {cursor is PaginationCursor}
 */
export function isPaginationCursor(cursor) {
  return (
    cursor != null
    && typeof cursor === "object"
    && typeof /** @type {PaginationCursor} */ (cursor).id === "string"
    && /** @type {PaginationCursor} */ (cursor).id.length > 0
  );
}
