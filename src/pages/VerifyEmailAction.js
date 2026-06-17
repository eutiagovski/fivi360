import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import {
  applyEmailVerificationCode,
  logout,
  reloadCurrentUser,
} from "@/services/auth/authService";
import { getActionCodeErrorMessage } from "@/utils/authErrors";

const CONSUMED_ACTION_CODE_ERRORS = new Set([
  "auth/invalid-action-code",
  "auth/expired-action-code",
]);

export const VerifyEmailAction = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasProcessedRef = useRef(false);

  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (hasProcessedRef.current) {
      return;
    }
    hasProcessedRef.current = true;

    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");

    const completeSuccess = async () => {
      try {
        await logout();
      } catch {
        // Mantém sucesso mesmo se o signOut falhar.
      }

      setStatus("success");
    };

    const tryTreatAsAlreadyVerified = async () => {
      const refreshedUser = await reloadCurrentUser();

      if (!refreshedUser?.emailVerified) {
        return false;
      }

      await completeSuccess();
      return true;
    };

    (async () => {
      if (mode !== "verifyEmail" || !oobCode) {
        if (await tryTreatAsAlreadyVerified()) {
          return;
        }

        setStatus("error");
        setErrorMessage("Este link expirou ou já foi utilizado.");
        return;
      }

      try {
        await applyEmailVerificationCode(oobCode);
        await completeSuccess();
      } catch (err) {
        if (CONSUMED_ACTION_CODE_ERRORS.has(err?.code)) {
          if (await tryTreatAsAlreadyVerified()) {
            return;
          }

          setStatus("error");
          setErrorMessage("Este link expirou ou já foi utilizado.");
          return;
        }

        setStatus("error");
        setErrorMessage(getActionCodeErrorMessage(err));
      }
    })();
  }, [searchParams]);

  const handleContinue = () => {
    navigate("/login", { replace: true });
  };

  return (
    <AuthLayout pageTestId="verify-email-action-page" logoTestId="verify-email-action-logo">
      <AuthCard title="Verificação de e-mail" titleTestId="verify-email-action-title">
        {status === "loading" && (
          <p className="text-center text-zinc-400" data-testid="verify-email-action-loading">
            Confirmando seu e-mail...
          </p>
        )}

        {status === "success" && (
          <div className="space-y-6 text-center">
            <CheckCircle2
              className="mx-auto h-12 w-12 text-green-400"
              aria-hidden
            />
            <div className="space-y-2">
              <p className="text-zinc-300" data-testid="verify-email-action-success">
                E-mail confirmado com sucesso.
              </p>
              <p className="text-zinc-400 text-sm">
                Entre na sua conta para concluir a ativação.
              </p>
            </div>
            <button
              type="button"
              onClick={handleContinue}
              data-testid="verify-email-action-continue"
              className="w-full px-4 py-3 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 transition-all"
            >
              Ir para login
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6 text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-400" aria-hidden />
            <div className="space-y-2">
              <p
                role="alert"
                className="text-red-300 text-sm"
                data-testid="verify-email-action-error"
              >
                {errorMessage}
              </p>
              <p className="text-zinc-400 text-sm">
                Entre na sua conta e solicite um novo link de confirmação.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-block w-full px-4 py-3 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 transition-all text-center"
              data-testid="verify-email-action-login"
            >
              Ir para login
            </Link>
          </div>
        )}
      </AuthCard>
    </AuthLayout>
  );
};
