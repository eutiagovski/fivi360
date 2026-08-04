import { useEffect, useId, useRef } from "react";
import {
  getVisibilityOptionsForPlan,
  VISIBILITY_OPTIONS,
} from "@/utils/visibility";

export const EMPTY_PROJECT_FORM_VALUES = {
  title: "",
  clientName: "",
  description: "",
  visibility: "private",
};

/**
 * @param {Partial<import("@/services/projects/projectService").Project> | null | undefined} project
 */
export function projectToFormValues(project) {
  return {
    title: project?.title ?? "",
    clientName: project?.clientName ?? "",
    description: project?.description ?? "",
    visibility: project?.visibility ?? "private",
  };
}

/**
 * Formulário compartilhado de criação/edição de informações cadastrais do projeto.
 * Visibilidade básica permanece aqui (comportamento atual); link/Embed ficam no ShareProjectDialog.
 *
 * @param {{
 *   mode: 'create' | 'edit',
 *   values: typeof EMPTY_PROJECT_FORM_VALUES,
 *   onChange: (next: typeof EMPTY_PROJECT_FORM_VALUES) => void,
 *   errors?: { title?: string, form?: string },
 *   disabled?: boolean,
 *   publicVisibilityEnabled?: boolean,
 *   autoFocusTitle?: boolean,
 * }} props
 */
export function ProjectForm({
  mode,
  values,
  onChange,
  errors = {},
  disabled = false,
  publicVisibilityEnabled = true,
  autoFocusTitle = true,
}) {
  const reactId = useId();
  const titleRef = useRef(null);
  const titleId = `${reactId}-title`;
  const clientId = `${reactId}-client`;
  const descriptionId = `${reactId}-description`;
  const titleErrorId = `${reactId}-title-error`;
  const formErrorId = `${reactId}-form-error`;
  const visibilityGroupId = `${reactId}-visibility`;

  const visibilityOptions = getVisibilityOptionsForPlan(publicVisibilityEnabled);
  const selectedVisibility = VISIBILITY_OPTIONS.find(
    (option) => option.value === values.visibility,
  );

  useEffect(() => {
    if (!autoFocusTitle || disabled) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      titleRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [autoFocusTitle, disabled, mode]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    onChange({
      ...values,
      [name]: value,
    });
  };

  return (
    <div
      className="space-y-5"
      data-testid={mode === "create" ? "create-project-form" : "edit-project-form"}
    >
      {errors.form ? (
        <p
          id={formErrorId}
          role="alert"
          className="text-sm text-red-400"
          data-testid="project-form-error"
        >
          {errors.form}
        </p>
      ) : null}

      <div>
        <label htmlFor={titleId} className="block text-sm font-medium text-zinc-400 mb-2">
          Nome do projeto *
        </label>
        <input
          ref={titleRef}
          type="text"
          id={titleId}
          name="title"
          data-testid="input-project-name"
          value={values.title}
          onChange={handleFieldChange}
          disabled={disabled}
          required
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? titleErrorId : undefined}
          placeholder="Ex: Residência Moderna"
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white transition-all disabled:opacity-50"
        />
        {errors.title ? (
          <p
            id={titleErrorId}
            role="alert"
            className="mt-1.5 text-xs text-red-400"
            data-testid="project-title-error"
          >
            {errors.title}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor={clientId} className="block text-sm font-medium text-zinc-400 mb-2">
          Nome do cliente
        </label>
        <input
          type="text"
          id={clientId}
          name="clientName"
          data-testid="input-project-client"
          value={values.clientName}
          onChange={handleFieldChange}
          disabled={disabled}
          placeholder="Ex: João Silva"
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white transition-all disabled:opacity-50"
        />
      </div>

      <div>
        <label
          htmlFor={descriptionId}
          className="block text-sm font-medium text-zinc-400 mb-2"
        >
          Descrição
        </label>
        <textarea
          id={descriptionId}
          name="description"
          data-testid="input-project-description"
          value={values.description}
          onChange={handleFieldChange}
          disabled={disabled}
          rows={4}
          placeholder="Descreva seu projeto..."
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white transition-all resize-none disabled:opacity-50"
        />
      </div>

      <div>
        <p
          id={visibilityGroupId}
          className="block text-sm font-medium text-zinc-400 mb-3"
        >
          Visibilidade
        </p>
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-2"
          role="radiogroup"
          aria-labelledby={visibilityGroupId}
        >
          {visibilityOptions.map((option) => {
            const selected = values.visibility === option.value;

            return (
              <label
                key={option.value}
                data-testid={`status-option-${option.value}`}
                className={`
                  relative flex items-center justify-center p-3 rounded-xl cursor-pointer transition-all text-sm
                  ${
                    selected
                      ? "bg-white text-black border-2 border-white"
                      : "bg-zinc-800 text-zinc-300 border-2 border-zinc-700 hover:border-zinc-600"
                  }
                  ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={option.value}
                  checked={selected}
                  onChange={handleFieldChange}
                  disabled={disabled}
                  className="sr-only"
                />
                <span className="font-medium">{option.label}</span>
              </label>
            );
          })}
        </div>
        {selectedVisibility ? (
          <p className="text-xs text-zinc-500 mt-2">{selectedVisibility.description}</p>
        ) : null}
      </div>
    </div>
  );
}
