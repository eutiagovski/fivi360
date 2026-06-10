/**
 * Operações de arquivos no Firebase Storage.
 */

import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/config/firebase";

/**
 * @param {unknown} error
 * @returns {boolean}
 */
function isStorageObjectNotFoundError(error) {
  const code = /** @type {{ code?: string }} */ (error)?.code;
  return code === "storage/object-not-found";
}

/** Campos do documento de imagem que podem conter paths no Storage. */
export const IMAGE_STORAGE_PATH_FIELDS = [
  "storagePath",
  "originalStoragePath",
  "previewStoragePath",
];

/**
 * Coleta paths únicos de Storage a partir dos campos conhecidos de uma imagem.
 *
 * @param {Record<string, unknown>} imageData
 * @returns {string[]}
 */
export function collectImageStoragePaths(imageData) {
  const paths = new Set();

  for (const field of IMAGE_STORAGE_PATH_FIELDS) {
    const value = imageData?.[field];
    if (typeof value === "string" && value.trim()) {
      paths.add(value.trim());
    }
  }

  return [...paths];
}

/**
 * Remove vários arquivos do Storage sem interromper o fluxo (ex.: exclusão em cascata).
 * Falhas são registradas em desenvolvimento; não lança exceção.
 *
 * @param {string[]} storagePaths
 * @returns {Promise<void>}
 */
export async function deleteImageFilesTolerant(storagePaths) {
  for (const storagePath of storagePaths) {
    const result = await deleteImageFile(storagePath);

    if (!result.success && process.env.NODE_ENV === "development") {
      console.warn(
        "[deleteImageFilesTolerant] Falha ao excluir arquivo — continuando:",
        storagePath,
        result.error,
      );
    }
  }
}

/**
 * Copia um arquivo de imagem para um novo path no Storage e remove o antigo.
 * Falha no upload impede a operação; falha na exclusão do arquivo antigo é tolerada.
 *
 * @param {string} sourceUrl
 * @param {string} newStoragePath
 * @param {string} [oldStoragePath]
 * @returns {Promise<{ downloadUrl: string, storagePath: string }>}
 */
export async function relocateImageFile(
  sourceUrl,
  newStoragePath,
  oldStoragePath = "",
) {
  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error("Não foi possível obter o arquivo da imagem.");
  }

  const blob = await response.blob();
  const storageRef = ref(storage, newStoragePath);

  await uploadBytes(storageRef, blob, { contentType: "image/webp" });
  const downloadUrl = await getDownloadURL(storageRef);

  if (oldStoragePath && oldStoragePath !== newStoragePath) {
    const deleteResult = await deleteImageFile(oldStoragePath);

    if (!deleteResult.success && process.env.NODE_ENV === "development") {
      console.warn(
        "[relocateImageFile] Falha ao remover arquivo antigo — realocação mantida:",
        oldStoragePath,
        deleteResult.error,
      );
    }
  }

  return { downloadUrl, storagePath: newStoragePath };
}

/**
 * Remove um arquivo de imagem do Storage pelo path persistido no Firestore.
 *
 * @param {string} storagePath
 * @returns {Promise<{ success: boolean, skipped?: boolean, error?: unknown }>}
 */
export async function deleteImageFile(storagePath) {
  if (!storagePath) {
    console.warn("[deleteImageFile] storagePath ausente — exclusão do Storage ignorada.");
    return { success: true, skipped: true };
  }

  console.log("[deleteImageFile] storagePath:", storagePath);

  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    console.log("[deleteImageFile] Storage excluído com sucesso:", storagePath);
    return { success: true };
  } catch (error) {
    if (isStorageObjectNotFoundError(error)) {
      console.warn(
        "[deleteImageFile] Arquivo não encontrado no Storage — prosseguindo:",
        storagePath,
      );
      return { success: true, skipped: true };
    }

    console.error("[deleteImageFile] Falha ao excluir do Storage:", storagePath, error);
    return { success: false, error };
  }
}
