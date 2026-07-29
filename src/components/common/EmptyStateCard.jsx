import { Link } from 'react-router-dom';
import { PlanLimitButton } from '@/components/plans/PlanLimitButton';
import { cn } from '@/lib/utils';

const SECONDARY_ACTION_CLASSNAME =
  'inline-flex items-center gap-2 px-6 py-3 border border-zinc-700 bg-zinc-800/40 text-zinc-300 rounded-full font-medium btn-scale transition-colors hover:bg-zinc-800/70 hover:text-white hover:border-zinc-600 w-fit shrink-0 max-w-full';

/**
 * Empty state padronizado: card centralizado com CTA secundário opcional.
 *
 * @param {{
 *   icon?: React.ReactNode,
 *   title: string,
 *   description?: string,
 *   actionLabel?: string,
 *   actionIcon?: React.ReactNode,
 *   onAction?: () => void,
 *   actionHref?: string,
 *   actionDisabled?: boolean,
 *   actionDisabledReason?: string,
 *   className?: string,
 *   dataTestId?: string,
 *   actionDataTestId?: string,
 * }} props
 */
export function EmptyStateCard({
  icon,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  actionHref,
  actionDisabled = false,
  actionDisabledReason = 'Limite do plano atingido',
  className,
  dataTestId,
  actionDataTestId,
}) {
  const showAction = Boolean(actionLabel);

  const actionContent = (
    <>
      {actionIcon}
      {actionLabel}
    </>
  );

  const renderAction = () => {
    if (actionHref && !actionDisabled) {
      return (
        <Link
          to={actionHref}
          data-testid={actionDataTestId}
          className={SECONDARY_ACTION_CLASSNAME}
        >
          {actionContent}
        </Link>
      );
    }

    return (
      <PlanLimitButton
        variant="secondary"
        className="w-fit shrink-0 max-w-full"
        disabled={actionDisabled}
        limitTooltip={actionDisabledReason}
        onClick={onAction}
        dataTestId={actionDataTestId}
      >
        {actionContent}
      </PlanLimitButton>
    );
  };

  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-col items-center text-center',
        'px-4 py-12 sm:px-6 sm:py-16',
        'bg-zinc-900/50 border border-zinc-800 rounded-2xl',
        className,
      )}
      data-testid={dataTestId}
    >
      {icon ? (
        <div className="mb-4 flex shrink-0 items-center justify-center text-zinc-500">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-medium text-white mb-2">{title}</h3>
      {description ? (
        <p
          className={cn(
            'text-sm text-zinc-400 max-w-md',
            showAction ? 'mb-3' : null,
          )}
        >
          {description}
        </p>
      ) : null}
      {showAction ? renderAction() : null}
    </div>
  );
}
