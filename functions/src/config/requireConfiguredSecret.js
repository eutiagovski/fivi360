/**
 * Lazy validation for defineSecret values.
 * Call inside a handler (or client factory), never at module import time,
 * so unrelated Functions can still load when one secret is missing.
 *
 * @param {{ value: () => string }} secretParam  firebase-functions defineSecret param
 * @param {string} name  env / Secret Manager name (for error messages only)
 * @returns {string}
 */
function requireConfiguredSecret(secretParam, name) {
  let value;
  try {
    value = secretParam.value();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const wrapped = new Error(
      `${name} is not configured (secret unavailable). Check functions/.secret.local locally or Secret Manager in production.`,
    );
    wrapped.code = "secret-not-configured";
    wrapped.cause = message;
    throw wrapped;
  }

  if (typeof value !== "string" || !value.trim()) {
    const missing = new Error(
      `${name} is not configured. Set it in functions/.secret.local (emulator) or Secret Manager (production).`,
    );
    missing.code = "secret-not-configured";
    throw missing;
  }

  return value.trim();
}

module.exports = {
  requireConfiguredSecret,
};
