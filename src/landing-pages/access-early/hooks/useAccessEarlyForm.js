import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ACCESS_EARLY_SUCCESS_PATH } from "../config";
import { submitPrelaunchLead } from "../services/prelaunchLeadService";
import { getPrelaunchAttribution } from "../utils/getPrelaunchAttribution";
import { formatBrazilPhoneMask } from "../utils/formatBrazilPhoneMask";
import { validateAccessEarlyForm } from "../utils/validateAccessEarlyForm";

/** @typedef {"idle" | "submitting" | "error"} AccessEarlyFormStatus */

const INITIAL_VALUES = {
  name: "",
  email: "",
  phone: "",
  professionId: "",
  professionOther: "",
  marketingConsent: false,
};

/**
 * Estado e submit do formulário de acesso antecipado.
 * Sucesso/duplicidade → navega para página dedicada (sem success inline).
 */
export function useAccessEarlyForm() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(/** @type {AccessEarlyFormStatus} */ ("idle"));
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */ ({}));
  const [submitError, setSubmitError] = useState("");
  const submittingRef = useRef(false);

  const setField = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setSubmitError("");
    setStatus((prev) => (prev === "error" ? "idle" : prev));
  }, []);

  const setPhone = useCallback(
    (raw) => {
      setField("phone", formatBrazilPhoneMask(raw));
    },
    [setField],
  );

  const resetToForm = useCallback(() => {
    setStatus("idle");
    setSubmitError("");
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event?.preventDefault?.();

      if (submittingRef.current) {
        return;
      }

      const validation = validateAccessEarlyForm(values);

      if (!validation.valid) {
        setErrors(validation.errors);
        setStatus("idle");
        return;
      }

      submittingRef.current = true;
      setStatus("submitting");
      setErrors({});
      setSubmitError("");

      try {
        const attribution = getPrelaunchAttribution();
        const result = await submitPrelaunchLead({
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          profession: validation.profession,
          marketingConsent: values.marketingConsent === true,
          attribution,
        });

        navigate(ACCESS_EARLY_SUCCESS_PATH, {
          replace: true,
          state: {
            alreadyRegistered: result.alreadyRegistered === true,
          },
        });
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          const message = err instanceof Error ? err.message : String(err);
          // eslint-disable-next-line no-console
          console.error("[Prelaunch] submit failed", message);
        }

        setSubmitError(
          "Não foi possível realizar seu pré-cadastro agora. Tente novamente em alguns instantes.",
        );
        setStatus("error");
      } finally {
        submittingRef.current = false;
      }
    },
    [navigate, values],
  );

  return {
    status,
    values,
    errors,
    submitError,
    isSubmitting: status === "submitting",
    showForm: true,
    setField,
    setPhone,
    handleSubmit,
    resetToForm,
  };
}
