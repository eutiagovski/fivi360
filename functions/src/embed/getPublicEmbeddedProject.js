/**
 * HTTP pública — dados mínimos do projeto para o Viewer Embed (RC-PROJECT-EMBED-1).
 *
 * GET ?projectId=... ou path /getPublicEmbeddedProject?projectId=
 *
 * Respostas:
 * - 200 + EmbeddedProjectDTO
 * - 404 genérico (desativado, plano inelegível, inexistente)
 * - 500 genérico (erro interno)
 */

const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const {
  resolvePublicEmbeddedProject,
} = require("./resolvePublicEmbeddedProject");

if (getApps().length === 0) {
  initializeApp();
}

function setCors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

exports.getPublicEmbeddedProject = onRequest(
  {
    region: "southamerica-east1",
    cors: true,
  },
  async (req, res) => {
    setCors(res);

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "GET") {
      res.status(405).json({ error: "method_not_allowed" });
      return;
    }

    const projectId =
      typeof req.query.projectId === "string"
        ? req.query.projectId.trim()
        : "";

    if (!projectId) {
      res.status(404).json({ error: "unavailable" });
      return;
    }

    try {
      const db = getFirestore();
      const result = await resolvePublicEmbeddedProject(db, projectId);

      if (!result.ok) {
        res.status(404).json({ error: "unavailable" });
        return;
      }

      res.status(200).json(result.project);
    } catch (err) {
      logger.error("getPublicEmbeddedProject failed", {
        projectId,
        message: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({ error: "load_failed" });
    }
  },
);
