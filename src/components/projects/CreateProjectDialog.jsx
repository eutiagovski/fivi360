import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppModal } from "@/components/common/AppModal";
import {
  EMPTY_PROJECT_FORM_VALUES,
  ProjectForm,
} from "@/components/projects/ProjectForm";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { trackEvent } from "@/services/analytics/analyticsService";
import { createProject } from "@/services/projects/projectService";
import { showPlanLimitToast } from "@/utils/planToast";

/**
 * Modal de criação de projeto (informações cadastrais básicas).
 *
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   onCreated?: (projectId: string) => void | Promise<void>,
 *   navigateOnSuccess?: boolean,
 * }} props
 */
export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreated,
  navigateOnSuccess = true,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { publicVisibilityEnabled } = usePlanLimits();
  const submitLockRef = useRef(false);
  const [values, setValues] = useState(EMPTY_PROJECT_FORM_VALUES);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues({ ...EMPTY_PROJECT_FORM_VALUES });
      setErrors({});
      setIsSaving(false);
      submitLockRef.current = false;
    }
  }, [open]);

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen && isSaving) {
      return;
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitLockRef.current || isSaving) {
      return;
    }

    const title = values.title.trim();
    if (!title) {
      setErrors({ title: "Informe o nome do projeto." });
      return;
    }

    if (!user?.uid) {
      setErrors({ form: "Sessão expirada. Faça login novamente." });
      return;
    }

    submitLockRef.current = true;
    setIsSaving(true);
    setErrors({});

    try {
      const projectId = await createProject(user.uid, {
        title,
        clientName: values.clientName,
        description: values.description,
        visibility: values.visibility,
      });

      trackEvent("create_project", {
        has_description: Boolean(values.description.trim()),
      });

      toast({
        title: "Projeto criado com sucesso.",
      });

      onOpenChange(false);
      await onCreated?.(projectId);

      if (navigateOnSuccess) {
        navigate(`/projects/${projectId}`);
      }
    } catch (error) {
      if (!showPlanLimitToast(error, toast)) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Não foi possível salvar o projeto. Tente novamente.";
        setErrors({ form: message });
        toast({
          title: "Erro ao criar projeto",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
      submitLockRef.current = false;
    }
  };

  return (
    <AppModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Criar projeto"
      description="Adicione as informações básicas para começar um novo projeto."
      size="lg"
      testId="create-project-dialog"
      dismissLocked={isSaving}
      footer={
        <>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
            data-testid="cancel-create-project-btn"
            className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl font-medium btn-scale hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="create-project-form-submit"
            disabled={isSaving}
            data-testid="create-project-submit-btn"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium btn-scale hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
            Criar projeto
          </button>
        </>
      }
    >
      <form id="create-project-form-submit" onSubmit={handleSubmit} noValidate>
        <ProjectForm
          mode="create"
          values={values}
          onChange={setValues}
          errors={errors}
          disabled={isSaving}
          publicVisibilityEnabled={publicVisibilityEnabled}
          autoFocusTitle={open}
        />
      </form>
    </AppModal>
  );
}
