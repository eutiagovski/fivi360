import { cn } from '@/lib/utils';

/**
 * Ações de salvamento da seção / formulário.
 *
 * @param {{
 *   isSaving: boolean,
 *   disabled?: boolean,
 *   label?: string,
 *   savingLabel?: string,
 *   className?: string,
 * }} props
 */
export function SettingsSaveActions({
  isSaving,
  disabled = false,
  label = 'Salvar alterações',
  savingLabel = 'Salvando...',
  className,
}) {
  return (
    <div
      className={cn(
        'flex justify-stretch sm:justify-end pt-2',
        className,
      )}
      data-testid="settings-save-actions"
    >
      <button
        type="submit"
        data-testid="save-settings-btn"
        disabled={disabled || isSaving}
        className={cn(
          'w-full sm:w-auto px-8 py-3 bg-white text-black rounded-full font-medium',
          'btn-scale hover:bg-zinc-200 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {isSaving ? savingLabel : label}
      </button>
    </div>
  );
}
