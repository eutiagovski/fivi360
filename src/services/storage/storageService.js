/**
 * Operações de arquivos no Firebase Storage.
 */

import { deleteObject, ref } from "firebase/storage";
import { storage } from "@/config/firebase";

/**
 * @param {unknown} error
 * @returns {boolean}
 */
function isStorageObjectNotFoundError(error) {
  const code = /** @type {{ code?: string }} */ (error)?.code;
  return code === "storage/object-not-found";
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
