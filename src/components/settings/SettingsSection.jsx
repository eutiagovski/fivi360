import { cn } from '@/lib/utils';

/**
 * Cabeçalho de seção (título + descrição curta). Não repete o título da página.
 *
 * @param {{
 *   id: string,
 *   title: string,
 *   description?: string,
 *   children: React.ReactNode,
 *   hidden?: boolean,
 *   className?: string,
 * }} props
 */
export function SettingsSection({
  id,
  title,
  description,
  children,
  hidden = false,
  className,
}) {
  return (
    <section
      id={`settings-panel-${id}`}
      role="tabpanel"
      aria-labelledby={`settings-tab-${id}`}
      hidden={hidden}
      aria-hidden={hidden}
      className={cn(hidden ? 'hidden' : 'space-y-6', className)}
      data-testid={`settings-section-${id}`}
    >
      <header className="space-y-1.5">
        <h2 className="text-xl font-light tracking-tight text-white">{title}</h2>
        {description ? (
          <p className="text-sm text-zinc-500 max-w-2xl">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
