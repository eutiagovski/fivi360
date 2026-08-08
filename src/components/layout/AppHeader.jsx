import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HelpCircle, LogOut, Menu, Settings, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getUser } from '@/services/users/userService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BrandLogo } from '@/components/common/BrandLogo';

function getNameInitial(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return '?';
  }
  return trimmed.charAt(0).toUpperCase();
}

function UserAvatar({ name, imageUrl, size = 'default' }) {
  const sizeClass = size === 'sm' ? 'h-9 w-9' : 'h-10 w-10';
  const textClass = size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <Avatar className={`${sizeClass} border border-zinc-700`}>
      {imageUrl ? (
        <AvatarImage src={imageUrl} alt={name || 'Usuário'} className="object-cover" />
      ) : null}
      <AvatarFallback
        className={`bg-zinc-900 text-white font-medium ${textClass}`}
        data-testid="app-header-avatar-fallback"
      >
        {getNameInitial(name)}
      </AvatarFallback>
    </Avatar>
  );
}

export const AppHeader = ({ onMenuClick, isMenuOpen = false }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setProfile(null);
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const data = await getUser(user.uid);
        if (!cancelled) {
          setProfile(data);
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const displayName = useMemo(() => {
    const fromProfile = profile?.displayName?.trim();
    if (fromProfile) {
      return fromProfile;
    }
    const fromAuth = user?.displayName?.trim();
    if (fromAuth) {
      return fromAuth;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Usuário';
  }, [profile?.displayName, user?.displayName, user?.email]);

  const companyDisplay = profile?.companyName?.trim() || 'Meu escritório';
  const avatarImageUrl = profile?.companyLogo?.trim() || '';

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <header
      className="sticky top-0 z-20 flex h-14 lg:h-16 shrink-0 items-center justify-between gap-3 border-b border-zinc-800 bg-[#050505] px-4 lg:px-6"
      data-testid="app-header"
    >
      <div className="lg:hidden min-w-0">
        <Link
          to="/dashboard"
          className="inline-flex items-center"
          data-testid="app-header-logo"
        >
          <BrandLogo className="h-7" />
        </Link>
      </div>

      <div className="hidden lg:block flex-1" aria-hidden="true" />

      <div className="flex items-center gap-2 lg:gap-3 ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 rounded-xl p-1 -m-1 text-left outline-none transition-colors hover:bg-zinc-900/80 focus-visible:ring-2 focus-visible:ring-zinc-600"
              data-testid="app-header-user-trigger"
            >
              <div className="hidden lg:block text-right min-w-0 max-w-[200px] xl:max-w-xs">
                <p
                  className="text-sm font-medium text-white truncate"
                  data-testid="app-header-user-name"
                >
                  {displayName}
                </p>
                <p
                  className="text-xs text-zinc-500 truncate"
                  data-testid="app-header-company-name"
                >
                  {companyDisplay}
                </p>
              </div>
              <UserAvatar name={displayName} imageUrl={avatarImageUrl} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-52 rounded-xl border-zinc-800 bg-[#121212] p-1 text-zinc-300 shadow-xl"
            data-testid="app-header-user-menu"
          >
            <div className="px-3 py-2 lg:hidden border-b border-zinc-800 mb-1">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-zinc-500 truncate">{companyDisplay}</p>
            </div>
            <DropdownMenuItem
              asChild
              className="rounded-lg cursor-pointer focus:bg-zinc-900 focus:text-white"
            >
              <Link to="/settings" data-testid="app-header-menu-settings">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="rounded-lg cursor-pointer focus:bg-zinc-900 focus:text-white"
            >
              <Link to="/help" data-testid="app-header-menu-help">
                <HelpCircle className="mr-2 h-4 w-4" />
                Ajuda
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              disabled={isLoggingOut}
              onSelect={(event) => {
                event.preventDefault();
                handleLogout();
              }}
              className="rounded-lg cursor-pointer text-red-400 focus:bg-zinc-900 focus:text-red-300"
              data-testid="app-header-menu-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? 'Saindo...' : 'Sair'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl bg-[#121212] border border-zinc-800 text-white hover:bg-zinc-900 transition-colors"
          aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          data-testid="mobile-menu-button"
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
};
