import { cn } from '@/lib/utils';

/**
 * Card semântico para agrupar campos relacionados.
 *
 * @param {{
 *   title?: string,
 *   description?: string,
 *   children: React.ReactNode,
 *   className?: string,
 *   'data-testid'?: string,
 * }} props
 */
export function SettingsCard({
  title,
  description,
  children,
  className,
  'data-testid': dataTestId,
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6',
        className,
      )}
      data-testid={dataTestId}
    >
      {(title || description) && (
        <div className="mb-5 space-y-1">
          {title ? (
            <h3 className="text-sm font-medium text-white">{title}</h3>
          ) : null}
          {description ? (
            <p className="text-sm text-zinc-500">{description}</p>
          ) : null}
        </div>
      )}
      {children}
    </div>
  );
}
