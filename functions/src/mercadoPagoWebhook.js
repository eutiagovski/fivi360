const crypto = require("crypto");
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { mpAccessToken } = require("./mercadoPago/client");
const {
  identifyMercadoPagoEventType,
  processMercadoPagoEvent,
} = require("./mercadoPago/processEvent");

if (getApps().length === 0) {
  initializeApp();
}

/**
 * Normaliza headers/query para gravação no Firestore (sem arrays aninhados).
 * @param {Record<string, unknown>} record
 * @returns {Record<string, string>}
 */
function recordToFirestoreMap(record) {
  const result = {};

  for (const [key, value] of Object.entries(record ?? {})) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      result[key] = value.map(String).join(", ");
      continue;
    }

    result[key] = String(value);
  }

  return result;
}

/**
 * @param {import("firebase-functions/v2/https").Request} req
 * @returns {unknown}
 */
function resolveWebhookBody(req) {
  if (req.body !== undefined && req.body !== null && req.body !== "") {
    if (typeof req.body === "object") {
      return req.body;
    }

    if (typeof req.body === "string" && req.body.trim()) {
      try {
        return JSON.parse(req.body);
      } catch {
        return { _raw: req.body };
      }
    }
  }

  if (req.rawBody?.length) {
    const rawText = req.rawBody.toString("utf8");

    try {
      return JSON.parse(rawText);
    } catch {
      return { _raw: rawText };
    }
  }

  return null;
}

/**
 * Campos top-level indexáveis do payload MP para billingWebhookEvents.
 * @param {unknown} body
 * @returns {{
 *   mpEventId: string | null,
 *   action: string | null,
 *   entity: string | null,
 *   liveMode: boolean | null,
 *   mpUserId: string | null,
 * }}
 */
function extractMercadoPagoEventMetadata(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      mpEventId: null,
      action: null,
      entity: null,
      liveMode: null,
      mpUserId: null,
    };
  }

  const payload = /** @type {Record<string, unknown>} */ (body);

  return {
    mpEventId:
      typeof payload.id === "string" || typeof payload.id === "number"
        ? String(payload.id)
        : null,
    action: typeof payload.action === "string" ? payload.action : null,
    entity: typeof payload.entity === "string" ? payload.entity : null,
    liveMode: typeof payload.live_mode === "boolean" ? payload.live_mode : null,
    mpUserId:
      typeof payload.user_id === "string" || typeof payload.user_id === "number"
        ? String(payload.user_id)
        : null,
  };
}

/**
 * Busca evento já processado com o mesmo mpEventId (notification ID do MP).
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} mpEventId
 * @param {string} excludeEventId
 * @returns {Promise<string | null>}
 */
async function findProcessedWebhookEventId(db, mpEventId, excludeEventId) {
  const snapshot = await db
    .collection("billingWebhookEvents")
    .where("mpEventId", "==", mpEventId)
    .where("status", "==", "processed")
    .limit(5)
    .get();

  const original = snapshot.docs.find((doc) => doc.id !== excludeEventId);
  return original?.id ?? null;
}

/**
 * Extrai campos úteis do payload MP para logs.
 * @param {unknown} body
 * @returns {Record<string, unknown>}
 */
function summarizeMercadoPagoPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { bodyKind: typeof body };
  }

  const payload = /** @type {Record<string, unknown>} */ (body);

  return {
    type: payload.type ?? null,
    action: payload.action ?? null,
    entity: payload.entity ?? null,
    apiVersion: payload.api_version ?? null,
    liveMode: payload.live_mode ?? null,
    mpEventId: payload.id ?? null,
    dataId: payload.data && typeof payload.data === "object"
      ? /** @type {{ id?: unknown }} */ (payload.data).id ?? null
      : null,
    userId: payload.user_id ?? null,
    dateCreated: payload.date_created ?? null,
  };
}

/**
 * Webhook Mercado Pago — persiste evento e processa billing interno.
 */
exports.mercadoPagoWebhook = onRequest(
  {
    region: "southamerica-east1",
    invoker: "public",
    secrets: [mpAccessToken, "MP_PLAN_PROFESSIONAL", "MP_PLAN_ENTERPRISE"],
  },
  async (req, res) => {
    const eventId = crypto.randomUUID();
    const headers = recordToFirestoreMap(req.headers);
    const query = recordToFirestoreMap(req.query);
    const body = resolveWebhookBody(req);
    const payloadSummary = summarizeMercadoPagoPayload(body);
    const eventMetadata = extractMercadoPagoEventMetadata(body);
    const eventType = identifyMercadoPagoEventType(body);
    const db = getFirestore();

    logger.info("mercadoPagoWebhook: incoming request", {
      eventId,
      method: req.method,
      path: req.path,
      ip: req.ip,
      contentType: headers["content-type"] ?? null,
      userAgent: headers["user-agent"] ?? null,
      xRequestId: headers["x-request-id"] ?? null,
      xSignature: headers["x-signature"] ? "[present]" : null,
      query,
      payloadSummary,
      bodyPreview: JSON.stringify(body)?.slice(0, 2000) ?? null,
    });

    const eventDoc = {
      provider: "mercado_pago",
      headers,
      query,
      body,
      mpEventId: eventMetadata.mpEventId,
      action: eventMetadata.action,
      entity: eventMetadata.entity,
      liveMode: eventMetadata.liveMode,
      mpUserId: eventMetadata.mpUserId,
      receivedAt: FieldValue.serverTimestamp(),
      processed: false,
      status: "received",
      eventType,
      resourceId: payloadSummary.dataId ?? null,
    };

    try {
      await db.collection("billingWebhookEvents").doc(eventId).set(eventDoc);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      logger.error("mercadoPagoWebhook: failed to persist event", {
        eventId,
        error: message,
        payloadSummary,
      });

      res.status(500).json({ received: false, error: "persist_failed" });
      return;
    }

    if (eventMetadata.mpEventId) {
      let duplicateOf = null;

      try {
        duplicateOf = await findProcessedWebhookEventId(
          db,
          eventMetadata.mpEventId,
          eventId,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);

        logger.error("mercadoPagoWebhook: duplicate check failed", {
          eventId,
          mpEventId: eventMetadata.mpEventId,
          error: message,
        });
      }

      if (duplicateOf) {
        try {
          await db.collection("billingWebhookEvents").doc(eventId).set(
            {
              status: "duplicate",
              processed: true,
              skippedProcessing: true,
              duplicateOf,
              processedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);

          logger.error("mercadoPagoWebhook: failed to mark duplicate event", {
            eventId,
            duplicateOf,
            error: message,
          });
        }

        logger.info("mercadoPagoWebhook: duplicate skipped", {
          eventId,
          mpEventId: eventMetadata.mpEventId,
          duplicateOf,
        });

        res.status(200).json({
          received: true,
          eventId,
          status: "duplicate",
          duplicateOf,
          skippedProcessing: true,
        });
        return;
      }
    }

    const accessToken = mpAccessToken.value()?.trim() ?? "";
    const processingResult = await processMercadoPagoEvent({
      db,
      accessToken,
      body,
      source: "webhook",
    });

    const isKnownEvent = Boolean(eventType);

    try {
      await db.collection("billingWebhookEvents").doc(eventId).set(
        {
          mpEventId: eventMetadata.mpEventId,
          action: eventMetadata.action,
          entity: eventMetadata.entity,
          liveMode: eventMetadata.liveMode,
          mpUserId: eventMetadata.mpUserId,
          processed: processingResult.status === "processed",
          status: processingResult.status,
          processedAt: FieldValue.serverTimestamp(),
          processingError:
            processingResult.status === "failed" ? processingResult.message ?? "processing_failed" : null,
          resolvedUserId: processingResult.resolvedUserId,
          eventType: processingResult.eventType ?? eventType,
          resourceId: processingResult.resourceId ?? payloadSummary.dataId ?? null,
          processingDetails: processingResult.details ?? null,
        },
        { merge: true },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      logger.error("mercadoPagoWebhook: failed to update event status", {
        eventId,
        error: message,
        processingResult,
      });
    }

    logger.info("mercadoPagoWebhook: event handled", {
      eventId,
      status: processingResult.status,
      resolvedUserId: processingResult.resolvedUserId,
      payloadSummary,
    });

    if (isKnownEvent) {
      res.status(200).json({
        received: true,
        eventId,
        status: processingResult.status,
      });
      return;
    }

    res.status(200).json({
      received: true,
      eventId,
      status: processingResult.status,
      ignored: true,
    });
  },
);
