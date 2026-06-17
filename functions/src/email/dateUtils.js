/**
 * Normaliza valores de data vindos do Firestore, Stripe ou payloads serializados.
 *
 * @param {unknown} value
 * @returns {Date | null}
 */
function normalizeToDate(value) {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const milliseconds = value > 1e12 ? value : value * 1000;
    const date = new Date(milliseconds);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "string" && value.trim()) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "object" && value !== null) {
    if (typeof value.toDate === "function") {
      const date = value.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
    }

    const seconds =
      typeof value.seconds === "number"
        ? value.seconds
        : typeof value._seconds === "number"
          ? value._seconds
          : null;

    if (seconds !== null && Number.isFinite(seconds)) {
      const nanoseconds =
        typeof value.nanoseconds === "number"
          ? value.nanoseconds
          : typeof value._nanoseconds === "number"
            ? value._nanoseconds
            : 0;

      const date = new Date(seconds * 1000 + Math.floor(nanoseconds / 1e6));
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  return null;
}

/**
 * @param {unknown} value
 * @param {{ includeTime?: boolean }} [options]
 * @returns {string | null}
 */
function formatBillingDatePtBr(value, options = {}) {
  const date = normalizeToDate(value);

  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    ...(options.includeTime ? { timeStyle: "short" } : {}),
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

module.exports = {
  normalizeToDate,
  formatBillingDatePtBr,
};
