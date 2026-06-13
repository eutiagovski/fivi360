/**
 * Serviço central de Firebase Analytics (GA4).
 *
 * Responsabilidade:
 * - Inicializar Analytics apenas quando seguro (browser, measurementId, sem emulador)
 * - Expor API única para eventos e page views
 * - Normalizar nomes, filtrar dados sensíveis e falhar silenciosamente
 *
 * @see docs/firebase-foundation.md
 */

import { getAnalytics, isSupported, logEvent, setUserId, setUserProperties } from "firebase/analytics";
import app from "@/config/firebase";

const isBrowser = typeof window !== "undefined";
const isDevelopment = process.env.NODE_ENV === "development";
const useEmulator = process.env.REACT_APP_USE_FIREBASE_EMULATORS === "true";
const measurementId = process.env.REACT_APP_FIREBASE_MEASUREMENT_ID?.trim();

/** @type {import("firebase/analytics").Analytics | null} */
let analyticsInstance = null;

/** @type {boolean} */
let initAttempted = false;

/** @type {Promise<import("firebase/analytics").Analytics | null> | null} */
let initPromise = null;

const SENSITIVE_PARAM_KEYS = new Set([
  "email",
  "password",
  "name",
  "display_name",
  "phone",
  "phone_number",
  "token",
  "access_token",
  "refresh_token",
  "api_key",
  "secret",
  "credit_card",
  "card_number",
  "cvv",
  "cpf",
  "cnpj",
  "address",
  "ip_address",
]);

/**
 * @returns {boolean}
 */
export function isAnalyticsEnabled() {
  return isBrowser && Boolean(measurementId) && !useEmulator;
}

/**
 * @param {string} value
 * @returns {string}
 */
export function normalizeAnalyticsKey(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

/**
 * @returns {Promise<import("firebase/analytics").Analytics | null>}
 */
async function resolveAnalyticsInstance() {
  if (!isAnalyticsEnabled()) {
    return null;
  }

  if (analyticsInstance) {
    return analyticsInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    initAttempted = true;

    try {
      const supported = await isSupported();
      if (!supported) {
        return null;
      }

      analyticsInstance = getAnalytics(app);
      return analyticsInstance;
    } catch {
      return null;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * @param {Record<string, unknown> | undefined | null} params
 * @returns {Record<string, string | number | boolean>}
 */
function sanitizeParams(params) {
  if (!params || typeof params !== "object") {
    return {};
  }

  /** @type {Record<string, string | number | boolean>} */
  const sanitized = {};

  for (const [rawKey, rawValue] of Object.entries(params)) {
    const key = normalizeAnalyticsKey(rawKey);

    if (!key || SENSITIVE_PARAM_KEYS.has(key)) {
      continue;
    }

    if (rawValue == null) {
      continue;
    }

    const valueType = typeof rawValue;

    if (valueType === "string") {
      const value = rawValue.trim();
      if (!value || value.includes("@")) {
        continue;
      }
      sanitized[key] = value.slice(0, 100);
      continue;
    }

    if (valueType === "number" || valueType === "boolean") {
      sanitized[key] = rawValue;
    }
  }

  return sanitized;
}

/**
 * Mapeia visibilidade do app para o parâmetro analytics de compartilhamento.
 *
 * @param {string} visibility
 * @returns {"public" | "private" | "link"}
 */
export function toShareVisibilityParam(visibility) {
  if (visibility === "shared") {
    return "link";
  }

  if (visibility === "public") {
    return "public";
  }

  return "private";
}

/**
 * @param {string} name
 * @param {Record<string, unknown>} [params]
 */
export function trackEvent(name, params = {}) {
  const eventName = normalizeAnalyticsKey(name);

  if (!eventName) {
    return;
  }

  const payload = sanitizeParams(params);

  void resolveAnalyticsInstance()
    .then((analytics) => {
      if (!analytics) {
        if (isDevelopment) {
          console.debug("[FIVI360 Analytics]", eventName, payload);
        }
        return;
      }

      logEvent(analytics, eventName, payload);
    })
    .catch(() => {
      // Falha silenciosa — analytics nunca deve quebrar o app.
    });
}

/**
 * @param {string} path
 * @param {string} [title]
 */
export function trackPageView(path, title) {
  const pagePath = typeof path === "string" ? path : "/";
  const pageTitle =
    typeof title === "string" && title.trim()
      ? title.trim()
      : isBrowser
        ? document.title
        : "";

  trackEvent("page_view", {
    page_path: pagePath,
    page_title: pageTitle,
  });
}

/**
 * @param {{ uid?: string, planId?: string } | null | undefined} user
 */
export function setAnalyticsUser(user) {
  void resolveAnalyticsInstance()
    .then((analytics) => {
      if (!analytics) {
        return;
      }

      if (user?.uid) {
        setUserId(analytics, user.uid);

        if (user.planId) {
          setUserProperties(analytics, {
            plan_id: String(user.planId),
          });
        }
        return;
      }

      setUserId(analytics, null);
    })
    .catch(() => {
      // Falha silenciosa
    });
}

export const analyticsConfig = {
  measurementId,
  useEmulator,
  initAttempted: () => initAttempted,
  isEnabled: isAnalyticsEnabled,
};
