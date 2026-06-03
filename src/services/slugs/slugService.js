/**
 * Serviço da coleção `slugs/{slug}` — registro único de slugs públicos.
 *
 * Estrutura do documento:
 * ```js
 * { uid, createdAt }
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

  if (newSlug) {
    const slugRef = doc(db, "slugs", newSlug);
    const slugSnap = await transaction.get(slugRef);

    if (slugSnap.exists() && slugSnap.data().uid !== userId) {
      throw new SlugTakenError();
    }

    if (!slugSnap.exists()) {
      transaction.set(slugRef, {
        uid: userId,
        createdAt: serverTimestamp(),
      });
    }
  }

  if (oldSlug && oldSlug !== newSlug) {
    const oldSlugRef = doc(db, "slugs", oldSlug);
    const oldSlugSnap = await transaction.get(oldSlugRef);

    if (oldSlugSnap.exists() && oldSlugSnap.data().uid === userId) {
      transaction.delete(oldSlugRef);
    }
  }
}
