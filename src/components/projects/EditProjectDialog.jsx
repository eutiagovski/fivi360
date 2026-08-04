import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppModal } from "@/components/common/AppModal";
import {
  EMPTY_PROJECT_FORM_VALUES,
  ProjectForm,
  projectToFormValues,
} from "@/components/projects/ProjectForm";
import { toast } from "@/hooks/use-toast";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { updateProject } from "@/services/projects/projectService";
import { showPlanLimitToast } from "@/utils/planToast";

/**
 * Modal de edição das informações cadastrais básicas do projeto.
 *
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   project: import("@/services/projects/projectService").Project | null,
 *   onUpdated?: (updates: {
 *     title: string,
 *     clientName: string,
 *     description: string,
 *     visibility: string,
 *   }) => void | Promise<void>,
 * }} props
 */
export function EditProjectDialog({
  open,
  onOpenChange,
  project,
  onUpdated,
}) {
  const { publicVisibilityEnabled } = usePlanLimits();
  const submitLockRef = useRef(false);
  const [values, setValues] = useState(EMPTY_PROJECT_FORM_VALUES);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && project) {
      setValues(projectToFormValues(project));
      setErrors({});
      setIsSaving(false);
      submitLockRef.current = false;
    }

    if (!open) {
      setValues(EMPTY_PROJECT_FORM_VALUES);
      setErrors({});
      setIsSaving(false);
      submitLockRef.current = false;
    }
  }, [open, project]);

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen && isSaving) {
      return;
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitLockRef.current || isSaving || !project?.id) {
      return;
    }

    const title = values.title.trim();
    if (!title) {
      setErrors({ title: "Informe o nome do projeto." });
      return;
    }

    const updates = {
      title,
      clientName: values.clientName.trim(),
      description: values.description.trim(),
      visibility: values.visibility,
    };

    submitLockRef.current = true;
    setIsSaving(true);
    setErrors({});

    try {
      await updateProject(project.id, updates);

      toast({
        title: "Projeto atualizado com sucesso.",
      });

      onOpenChange(false);
      await onUpdated?.(updates);
    } catch (error) {
      if (!showPlanLimitToast(error, toast)) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Não foi possível atualizar o projeto.";
        setErrors({ form: message });
        toast({
          title: "Erro ao salvar",
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
      title="Editar projeto"
      description="Atualize as informações básicas deste projeto."
      size="lg"
      testId="edit-project-dialog"
      dismissLocked={isSaving}
      footer={
        <>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
            data-testid="cancel-edit-project-btn"
            className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl font-medium btn-scale hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="edit-project-form-submit"
            disabled={isSaving}
            data-testid="save-project-btn"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium btn-scale hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
            Salvar alterações
          </button>
        </>
      }
    >
      <form id="edit-project-form-submit" onSubmit={handleSubmit} noValidate>
        <ProjectForm
          mode="edit"
          values={values}
          onChange={setValues}
          errors={errors}
          disabled={isSaving}
          publicVisibilityEnabled={publicVisibilityEnabled}
          autoFocusTitle={open && Boolean(project)}
        />
      </form>
    </AppModal>
  );
}
