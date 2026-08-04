import { SETTINGS_SECTIONS } from '@/components/settings/settingsSections';
import { cn } from '@/lib/utils';

/**
 * Navegação interna: sidebar no desktop, tabs horizontais roláveis no mobile.
 *
 * @param {{
 *   activeSection: string,
 *   onSectionChange: (sectionId: string) => void,
 *   variant?: 'mobile' | 'desktop' | 'both',
 * }} props
 */
export function SettingsNav({
  activeSection,
  onSectionChange,
  variant = 'both',
}) {
  const showMobile = variant === 'mobile' || variant === 'both';
  const showDesktop = variant === 'desktop' || variant === 'both';

  return (
    <nav aria-label="Seções de configurações" data-testid="settings-nav">
      {showMobile ? (
        <div
          className={cn(
            '-mx-1 overflow-x-auto pb-1',
            variant === 'both' && 'lg:hidden',
          )}
          data-testid="settings-nav-mobile"
        >
          <div
            role="tablist"
            aria-label="Seções de configurações"
            className="flex w-max min-w-full gap-1 px-1"
          >
            {SETTINGS_SECTIONS.map((section) => {
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  role="tab"
                  id={`settings-tab-${section.id}`}
                  aria-selected={isActive}
                  aria-controls={`settings-panel-${section.id}`}
                  data-testid={`settings-nav-${section.id}`}
                  data-active={isActive ? 'true' : 'false'}
                  onClick={() => onSectionChange(section.id)}
                  className={cn(
                    'shrink-0 rounded-full px-4 py-2 text-sm transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
                    isActive
                      ? 'bg-white text-black font-medium'
                      : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:border-zinc-700',
                  )}
                >
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {showDesktop ? (
        <ul
          className={cn(
            'flex flex-col gap-1',
            variant === 'both' && 'hidden lg:flex',
          )}
          data-testid="settings-nav-desktop"
        >
          {SETTINGS_SECTIONS.map((section) => {
            const isActive = activeSection === section.id;

            return (
              <li key={section.id}>
                <button
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  data-testid={`settings-nav-desktop-${section.id}`}
                  data-active={isActive ? 'true' : 'false'}
                  onClick={() => onSectionChange(section.id)}
                  className={cn(
                    'w-full rounded-xl px-4 py-2.5 text-left text-sm transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
                    isActive
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200',
                  )}
                >
                  {section.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </nav>
  );
}
