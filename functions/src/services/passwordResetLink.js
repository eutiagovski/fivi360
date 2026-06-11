const { getAuth } = require("firebase-admin/auth");
const { logger } = require("firebase-functions");
const { APP_BASE_URL } = require("../config/app");
const { sanitizeLinkForLog } = require("./verificationLink");

/**
 * Converte o link retornado pelo Admin SDK em URL direta do app com oobCode intacto.
 *
 * @param {string} firebaseLink
 * @returns {string}
 */
function buildAppPasswordResetUrl(firebaseLink) {
  const generatedUrl = new URL(firebaseLink);

  let oobCode = generatedUrl.searchParams.get("oobCode");
  const continueUrl = generatedUrl.searchParams.get("continueUrl");

  if (!oobCode && continueUrl) {
    const continueParsed = new URL(continueUrl);
    oobCode = continueParsed.searchParams.get("oobCode");
  }

  if (!oobCode) {
    throw new Error("Firebase password reset link is missing oobCode");
  }

  const appUrl = new URL(`${APP_BASE_URL}/reset-password/action`);
  appUrl.searchParams.set("mode", "resetPassword");
  appUrl.searchParams.set("oobCode", oobCode);

  return appUrl.toString();
}

/**
 * Gera link de redefinição de senha apontando diretamente para o handler do app.
 *
 * @param {string} email
 * @returns {Promise<string>}
 */
async function generatePasswordResetLink(email) {
  const actionCodeSettings = {
    url: `${APP_BASE_URL}/reset-password/action`,
    handleCodeInApp: true,
  };

  const firebaseLink = await getAuth().generatePasswordResetLink(
    email,
    actionCodeSettings,
  );

  const appPasswordResetUrl = buildAppPasswordResetUrl(firebaseLink);

  logger.info("passwordResetLink: built app password reset URL", {
    firebaseLinkSanitized: sanitizeLinkForLog(firebaseLink),
    appPasswordResetUrlSanitized: sanitizeLinkForLog(appPasswordResetUrl),
    usesFirebaseAuthHandler: firebaseLink.includes("/__/auth/action"),
  });

  return appPasswordResetUrl;
}

module.exports = {
  generatePasswordResetLink,
  buildAppPasswordResetUrl,
};
