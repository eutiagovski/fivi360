/**
 * URL base do aplicativo (rotas /embed, prévia e snippet de incorporação).
 *
 * Preferência:
 * 1. REACT_APP_APP_BASE_URL (produção / override explícito)
 * 2. window.location.origin (desenvolvimento, preview, homologação)
 *
 * Não usa REACT_APP_PUBLIC_URL — essa variável é do site/marketing e
 * quebrava a prévia local apontando para o domínio público.
 *
 * @returns {string}
 */
export function getAppBaseUrl() {
  const configured = process.env.REACT_APP_APP_BASE_URL?.trim() || "";

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  return "";
}

/**
 * Destino da marca Powered by FIVI360.
 * @returns {string}
 */
export function getMarketingArchitectsUrl() {
  const configured = process.env.REACT_APP_MARKETING_ARCHITECTS_URL?.trim();

  if (configured) {
    return configured;
  }

  return "https://fivi360.com.br";
}

/**
 * URL pública do Viewer Embed.
 *
 * @param {string} projectId
 * @param {{ imageId?: string | null }} [options]
 * @returns {string}
 */
export function buildEmbedProjectUrl(projectId, options = {}) {
  if (!projectId) {
    return "";
  }

  const base = getAppBaseUrl();
  if (!base) {
    return "";
  }

  const id = encodeURIComponent(projectId);

  if (options.imageId) {
    return `${base}/embed/${id}/image/${encodeURIComponent(options.imageId)}`;
  }

  return `${base}/embed/${id}`;
}

/**
 * Escapa atributos HTML em títulos do iframe.
 *
 * @param {string} value
 * @returns {string}
 */
export function escapeHtmlAttribute(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Gera o snippet responsivo de incorporação.
 * Usa a mesma origem de `buildEmbedProjectUrl` (ambiente atual).
 *
 * @param {string} projectId
 * @param {{ projectName?: string | null }} [options]
 * @returns {string}
 */
export function buildEmbedSnippet(projectId, options = {}) {
  const src = buildEmbedProjectUrl(projectId);
  if (!src) {
    return "";
  }

  const name =
    typeof options.projectName === "string" && options.projectName.trim()
      ? options.projectName.trim()
      : "";
  const title = name
    ? `Visualização 360° — ${name}`
    : "Visualização 360° do projeto";
  const safeTitle = escapeHtmlAttribute(title);

  return `<div style="position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;">
  <iframe
    src="${src}"
    title="${safeTitle}"
    style="position:absolute;inset:0;width:100%;height:100%;border:0;"
    loading="lazy"
    allow="fullscreen"
    allowfullscreen
  ></iframe>
</div>`;
}
