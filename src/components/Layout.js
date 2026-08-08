import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, Image, CreditCard, Settings, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/layout/AppHeader';
import { BrandLogo } from '@/components/common/BrandLogo';
import { TooltipProvider } from '@/components/ui/tooltip';

export const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Imagens', path: '/images', icon: Image },
    { name: 'Projetos', path: '/projects', icon: FolderOpen },
    { name: 'Plano', path: '/plan', icon: CreditCard },
    { name: 'Configurações', path: '/settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await signOut();
      setSidebarOpen(false);
      navigate('/login', { replace: true });
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-[#050505]">
      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky inset-y-0 left-0 z-40 top-0
          lg:h-dvh lg:flex lg:flex-col lg:flex-shrink-0
          w-64 bg-[#050505] border-r border-zinc-800
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-full flex flex-col p-6">
          {/* Logo */}
          <div className="mb-12 flex-shrink-0">
            <BrandLogo testId="app-logo" className="h-7" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2" data-testid="sidebar-nav">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200
                    ${active 
                      ? 'bg-white text-black' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex-shrink-0 border-t border-zinc-800 pt-4">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              data-testid="nav-logout"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut size={20} />
              <span className="font-medium">{isLoggingOut ? 'Saindo...' : 'Sair'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main column: header + page content (altura viewport; scroll no main ou na página) */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader
          onMenuClick={() => setSidebarOpen((open) => !open)}
          isMenuOpen={sidebarOpen}
        />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
    </TooltipProvider>
  );
};