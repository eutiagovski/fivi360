/**
 * Hook de autenticação.
 *
 * Responsabilidade:
 * - Consumir AuthContext sem acoplar páginas ao provider diretamente
 *
 * @see src/contexts/AuthContext.jsx
 * @see docs/auth-foundation.md
 */

import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}
