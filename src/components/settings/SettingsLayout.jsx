import { cn } from '@/lib/utils';

/**
 * Layout em duas áreas: sidebar desktop + painel de conteúdo rolável.
 * Largura acompanha a área disponível; scroll fica no painel de conteúdo.
 *
 * @param {{
 *   nav: React.ReactNode,
 *   children: React.ReactNode,
 *   className?: string,
 *   contentRef?: React.Ref<HTMLDivElement>,
 * }} props
 */
export function SettingsLayout({ nav, children, className, contentRef }) {
  return (
    <div
      className={cn(
        'flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-8 xl:gap-10',
        className,
      )}
      data-testid="settings-layout"
    >
      <aside
        className="hidden w-[240px] shrink-0 lg:block"
        data-testid="settings-nav-aside"
      >
        {nav}
      </aside>
      <div
        ref={contentRef}
        className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
        data-testid="settings-content"
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}
