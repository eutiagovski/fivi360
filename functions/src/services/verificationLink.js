const { getAuth } = require("firebase-admin/auth");
const { logger } = require("firebase-functions");
const { APP_BASE_URL } = require("../config/app");

/**
 * @param {string} url
 * @returns {string}
 */
function sanitizeLinkForLog(url) {
  try {
    const parsed = new URL(url);
    const oobCode = parsed.searchParams.get("oobCode");

    if (oobCode) {
      const masked =
        oobCode.length > 8 ? `${oobCode.slice(0, 4)}…${oobCode.slice(-4)}` : "…";
      parsed.searchParams.set("oobCode", masked);
    }

    return parsed.toString();
  } catch {
    return "[invalid-url]";
  }
}

/**
 * Converte o link retornado pelo Admin SDK em URL direta do app com oobCode intacto.
 *
 * O Firebase pode retornar um link para /__/auth/action que consumiria o código
 * antes do handler customizado do FIVI360.
 *
 * @param {string} firebaseLink
 * @returns {string}
 */
function buildAppVerificationUrl(firebaseLink) {
  const generatedUrl = new URL(firebaseLink);

  let oobCode = generatedUrl.searchParams.get("oobCode");
  const continueUrl = generatedUrl.searchParams.get("continueUrl");

  if (!oobCode && continueUrl) {
    const continueParsed = new URL(continueUrl);
    oobCode = continueParsed.searchParams.get("oobCode");
  }

  if (!oobCode) {
    throw new Error("Firebase verification link is missing oobCode");
  }

  const appUrl = new URL(`${APP_BASE_URL}/verify-email/action`);
  appUrl.searchParams.set("mode", "verifyEmail");
  appUrl.searchParams.set("oobCode", oobCode);

  return appUrl.toString();
}

/**
 * Gera link de verificação de e-mail apontando diretamente para o handler do app.
 *
 * @param {string} email
 * @returns {Promise<string>}
 */
async function generateVerificationLink(email) {
  const actionCodeSettings = {
    url: `${APP_BASE_URL}/verify-email/action`,
    handleCodeInApp: true,
  };

  const firebaseLink = await getAuth().generateEmailVerificationLink(
    email,
    actionCodeSettings,
  );

  const appVerificationUrl = buildAppVerificationUrl(firebaseLink);

  logger.info("verificationLink: built app verification URL", {
    firebaseLinkSanitized: sanitizeLinkForLog(firebaseLink),
    appVerificationUrlSanitized: sanitizeLinkForLog(appVerificationUrl),
    usesFirebaseAuthHandler: firebaseLink.includes("/__/auth/action"),
  });

  return appVerificationUrl;
}

module.exports = {
  generateVerificationLink,
  buildAppVerificationUrl,
  sanitizeLinkForLog,
};
