/**
 * Serviço da coleção `slugs/{slug}` — registro único de slugs públicos.
 *
 * Estrutura do documento:
 * ```js
 * { uid, type: "user", createdAt, updatedAt }
 * ```
 *
 * O ID do documento é o próprio slug (normalizado).
 * Usado para garantir unicidade e resolver `/u/:slug` → uid.
 *
 * @see docs/architecture.md
 */

import { doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";
import { isValidSlugFormat, normalizeSlug } from "@/utils/slug";

export class SlugTakenError extends Error {
  constructor(message = "Este endereço já está em uso.") {
    super(message);
    this.name = "SlugTakenError";
  }
}

export class SlugValidationError extends Error {
  constructor(message = "O endereço deve conter apenas letras minúsculas, números e hífens.") {
    super(message);
    this.name = "SlugValidationError";
  }
}

/**
 * Verifica disponibilidade de um slug (leitura em tempo real, sem salvar).
 *
 * @param {string} slug — valor bruto ou normalizado
 * @param {string} currentUserId
 * @returns {Promise<{ available: boolean, slug: string, reason?: 'invalid' | 'taken' }>}
 */
/**
 * Resolve um slug público para o uid do proprietário.
 *
 * @param {string} slug — valor bruto ou normalizado
 * @returns {Promise<string | null>}
 */
export async function resolveSlugToUid(slug) {
  const normalized = normalizeSlug(slug);

  if (!normalized || !isValidSlugFormat(normalized)) {
    return null;
  }

  const slugRef = doc(db, "slugs", normalized);
  const snapshot = await getDoc(slugRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data().uid ?? null;
}

export async function checkSlugAvailability(slug, currentUserId) {
  const normalized = normalizeSlug(slug);

  if (!normalized || !isValidSlugFormat(normalized)) {
    return { available: false, slug: normalized, reason: "invalid" };
  }

  const slugRef = doc(db, "slugs", normalized);
  const snapshot = await getDoc(slugRef);

  if (!snapshot.exists()) {
    return { available: true, slug: normalized };
  }

  if (snapshot.data().uid === currentUserId) {
    return { available: true, slug: normalized };
  }

  return { available: false, slug: normalized, reason: "taken" };
}

/**
 * Sincroniza a coleção `slugs` dentro de uma transação Firestore.
 * Não altera o documento do usuário — apenas o registro de slugs.
 *
 * @param {import("firebase/firestore").Transaction} transaction
 * @param {string} userId
 * @param {string} newSlug — slug normalizado (pode ser vazio)
 * @param {string} [previousSlug]
 */
export async function syncSlugRegistryInTransaction(
  transaction,
  userId,
  newSlug,
  previousSlug = "",
) {
  const oldSlug = previousSlug ?? "";

  if (newSlug === oldSlug) {
    return;
  }

  if (newSlug && !isValidSlugFormat(newSlug)) {
    throw new SlugValidationError();
  }

  const newSlugRef = newSlug ? doc(db, "slugs", newSlug) : null;
  const oldSlugRef = oldSlug && oldSlug !== newSlug ? doc(db, "slugs", oldSlug) : null;

  const [newSlugSnap, oldSlugSnap] = await Promise.all([
    newSlugRef ? transaction.get(newSlugRef) : Promise.resolve(null),
    oldSlugRef ? transaction.get(oldSlugRef) : Promise.resolve(null),
  ]);

  if (newSlug) {
    if (newSlugSnap.exists() && newSlugSnap.data().uid !== userId) {
      throw new SlugTakenError();
    }

    if (!newSlugSnap.exists()) {
      transaction.set(newSlugRef, {
        uid: userId,
        type: "user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }

  if (oldSlugRef && oldSlugSnap.exists() && oldSlugSnap.data().uid === userId) {
    transaction.delete(oldSlugRef);
  }
}
