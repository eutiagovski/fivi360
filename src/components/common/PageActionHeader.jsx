import { Link } from 'react-router-dom';
import { PlanLimitButton } from '@/components/plans/PlanLimitButton';
import { cn } from '@/lib/utils';

const ACTION_CLASSNAME =
  'flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium btn-scale hover:bg-zinc-200 transition-colors w-full sm:w-auto justify-center sm:justify-start shrink-0';

/**
 * Header de página com título, subtítulo e ação principal em card.
 *
 * @param {{
 *   title: string,
 *   subtitle?: string,
 *   actionLabel?: string,
 *   actionHref?: string,
 *   onAction?: () => void,
 *   actionDisabled?: boolean,
 *   actionDisabledReason?: string,
 *   actionIcon?: React.ReactNode,
 *   className?: string,
 *   dataTestId?: string,
 *   actionDataTestId?: string,
 * }} props
 */
export function PageActionHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
  onAction,
  actionDisabled = false,
  actionDisabledReason = 'Limite do plano atingido',
  actionIcon,
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
          className={ACTION_CLASSNAME}
        >
          {actionContent}
        </Link>
      );
    }

    return (
      <PlanLimitButton
        disabled={actionDisabled}
        limitTooltip={actionDisabledReason}
        onClick={onAction}
        dataTestId={actionDataTestId}
        className="w-full sm:w-auto justify-center sm:justify-start shrink-0"
      >
        {actionContent}
      </PlanLimitButton>
    );
  };

  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tighter text-white mb-2"
          data-testid={dataTestId}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="text-base text-zinc-400">{subtitle}</p>
        ) : null}
      </div>
      {showAction ? (
        <div className="w-full sm:w-auto shrink-0 [&_button]:w-full sm:[&_button]:w-auto [&_a]:w-full sm:[&_a]:w-auto [&>span]:block [&>span]:w-full sm:[&>span]:w-auto sm:[&>span]:inline-block">
          {renderAction()}
        </div>
      ) : null}
    </div>
  );
}
