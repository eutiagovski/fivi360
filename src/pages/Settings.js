import {
  User,
  Mail,
  Building2,
  Upload,
  Globe,
  Loader2,
  Instagram,
  Youtube,
  Linkedin,
  MessageCircle,
  Copy,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { PremiumFeatureModal } from '@/components/plans/PremiumFeatureModal';
import { UpgradePrompt } from '@/components/plans/UpgradePrompt';
import { useAuth } from '@/hooks/useAuth';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { checkSlugAvailability } from '@/services/slugs/slugService';
import {
  getUser,
  saveUserSettings,
  SlugTakenError,
  SlugValidationError,
} from '@/services/users/userService';
import { SocialPrefixedInput } from '@/components/settings/SocialPrefixedInput';
import { showPlanLimitToast } from '@/utils/planToast';
import {
  isBrazilWhatsappStored,
  normalizeInstagramForSave,
  normalizeLinkedinForSave,
  normalizeWebsiteForSave,
  normalizeWhatsappForSave,
  normalizeYoutubeForSave,
  parseInstagramForDisplay,
  parseLinkedinForDisplay,
  parseWebsiteForDisplay,
  parseWhatsappForDisplay,
  parseYoutubeForDisplay,
  SOCIAL_LINK_PREFIXES,
} from '@/utils/socialLinks';
import { trackEvent } from '@/services/analytics/analyticsService';
import { buildPortfolioUrl, normalizeSlug } from '@/utils/slug';

const initialFormData = {
  name: '',
  email: '',
  companyName: '',
  companyBio: '',
  websiteUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  linkedinUrl: '',
  whatsappUrl: '',
  publicSlug: '',
  portfolioEnabled: false,
};

const SLUG_CHECK_DEBOUNCE_MS = 400;

export const Settings = () => {
  const { user } = useAuth();
  const { publicPortfolioEnabled } = usePlanLimits();
  const [formData, setFormData] = useState(initialFormData);
  const [savedSlug, setSavedSlug] = useState('');
  const [savedPortfolioEnabled, setSavedPortfolioEnabled] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [slugAvailability, setSlugAvailability] = useState(null);
  const [portfolioPremiumModalOpen, setPortfolioPremiumModalOpen] = useState(false);
  const [whatsappBrazilLocal, setWhatsappBrazilLocal] = useState(true);

  const normalizedSlugPreview = useMemo(
    () => normalizeSlug(formData.publicSlug),
    [formData.publicSlug],
  );

  const portfolioPreviewUrl = useMemo(
    () => buildPortfolioUrl(normalizedSlugPreview),
    [normalizedSlugPreview],
  );

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      setIsLoadingProfile(true);
      setLoadError(null);

      try {
        const profile = await getUser(user.uid);

        if (cancelled) {
          return;
        }

        const publicSlug = profile?.publicSlug ?? '';
        const socialLinks = profile?.socialLinks ?? {};
        const storedWhatsappUrl = socialLinks.whatsapp ?? '';

        setWhatsappBrazilLocal(isBrazilWhatsappStored(storedWhatsappUrl));
        setFormData({
          name: profile?.displayName ?? user.displayName ?? '',
          email: profile?.email ?? user.email ?? '',
          companyName: profile?.companyName ?? '',
          companyBio: profile?.bio ?? '',
          websiteUrl: parseWebsiteForDisplay(socialLinks.website),
          instagramUrl: parseInstagramForDisplay(socialLinks.instagram),
          youtubeUrl: parseYoutubeForDisplay(socialLinks.youtube),
          linkedinUrl: parseLinkedinForDisplay(socialLinks.linkedin),
          whatsappUrl: parseWhatsappForDisplay(storedWhatsappUrl),
          publicSlug,
          portfolioEnabled: profile?.portfolioEnabled ?? false,
        });
        setSavedSlug(publicSlug);
        setSavedPortfolioEnabled(profile?.portfolioEnabled ?? false);
      } catch {
        if (!cancelled) {
          setLoadError('Não foi possível carregar suas configurações.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.displayName, user?.email]);

  useEffect(() => {
    if (!user?.uid || isLoadingProfile) {
      return;
    }

    if (!normalizedSlugPreview) {
      setSlugAvailability(null);
      return;
    }

    let cancelled = false;
    setSlugAvailability('checking');

    const timeoutId = window.setTimeout(async () => {
      try {
        const result = await checkSlugAvailability(normalizedSlugPreview, user.uid);

        if (!cancelled) {
          setSlugAvailability(result.available ? 'available' : 'unavailable');
        }
      } catch {
        if (!cancelled) {
          setSlugAvailability(null);
        }
      }
    }, SLUG_CHECK_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [normalizedSlugPreview, user?.uid, isLoadingProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePortfolioToggle = (checked) => {
    if (checked && !publicPortfolioEnabled) {
      setPortfolioPremiumModalOpen(true);
      return;
    }

    setFormData((current) => ({
      ...current,
      portfolioEnabled: checked,
    }));
  };

  const handleCopyPortfolioUrl = async () => {
    try {
      await navigator.clipboard.writeText(portfolioPreviewUrl);
      toast({
        title: 'Link copiado',
        description: 'O link do portfólio foi copiado.',
      });
    } catch {
      toast({
        title: 'Link do portfólio',
        description: portfolioPreviewUrl,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.uid) {
      return;
    }

    if (slugAvailability === 'unavailable') {
      toast({
        variant: 'destructive',
        title: 'Endereço indisponível',
        description: 'Este endereço já está em uso.',
      });
      return;
    }

    setIsSaving(true);

    try {
      const normalizedWhatsappUrl = normalizeWhatsappForSave(formData.whatsappUrl, {
        assumeBrazilLocal: whatsappBrazilLocal,
      });

      const { publicSlug } = await saveUserSettings(
        user.uid,
        {
          displayName: formData.name,
          companyName: formData.companyName,
          bio: formData.companyBio,
          publicSlug: formData.publicSlug,
          portfolioEnabled: formData.portfolioEnabled,
          socialLinks: {
            website: normalizeWebsiteForSave(formData.websiteUrl),
            instagram: normalizeInstagramForSave(formData.instagramUrl),
            youtube: normalizeYoutubeForSave(formData.youtubeUrl),
            linkedin: normalizeLinkedinForSave(formData.linkedinUrl),
            whatsapp: normalizedWhatsappUrl,
          },
        },
        savedSlug,
      );

      setWhatsappBrazilLocal(isBrazilWhatsappStored(normalizedWhatsappUrl));

      setFormData((current) => ({
        ...current,
        publicSlug,
      }));
      setSavedSlug(publicSlug);

      if (formData.portfolioEnabled && !savedPortfolioEnabled) {
        trackEvent('publish_portfolio', { enabled: true });
      }

      setSavedPortfolioEnabled(formData.portfolioEnabled);

      toast({
        title: 'Configurações salvas',
        description: 'Suas alterações foram salvas com sucesso.',
      });
    } catch (error) {
      if (showPlanLimitToast(error, toast)) {
        return;
      }

      if (error instanceof SlugTakenError) {
        toast({
          variant: 'destructive',
          title: 'Endereço indisponível',
          description: error.message,
        });
        return;
      }

      if (error instanceof SlugValidationError) {
        toast({
          variant: 'destructive',
          title: 'Formato inválido',
          description: error.message,
        });
        return;
      }

      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar suas alterações. Tente novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 md:p-12 lg:p-16 fade-in">
      <PageHeader
        title="Configurações"
        subtitle="Gerencie suas informações pessoais e do escritório"
        dataTestId="settings-title"
      />

      <div className="w-full mx-auto flex gap-4">
        {isLoadingProfile ? (
          <div
            className="flex items-center justify-center py-24"
            data-testid="settings-loading"
          >
            <Loader2
              className="h-8 w-8 animate-spin text-zinc-400"
              aria-label="Carregando configurações"
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 flex-1">
            {loadError && (
              <div
                role="alert"
                className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300"
                data-testid="settings-load-error"
              >
                {loadError}
              </div>
            )}

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 md:p-8">
              <h2 className="text-2xl font-light tracking-tight text-white mb-6">Perfil</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-3">
                  Logo do escritório
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center overflow-hidden">
                    <Upload className="text-zinc-600" size={32} />
                  </div>
                  <button
                    type="button"
                    data-testid="upload-logo-btn"
                    className="px-6 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl hover:bg-zinc-700 transition-colors"
                  >
                    Fazer upload
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="name" className="block text-sm font-medium text-zinc-400 mb-2">
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    Nome completo
                  </div>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  data-testid="input-name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white transition-all disabled:opacity-50"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-2">
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    Email
                  </div>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  data-testid="input-email"
                  value={formData.email}
                  readOnly
                  disabled
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 md:p-8">
              <h2 className="text-2xl font-light tracking-tight text-white mb-2">
                Informações públicas
              </h2>
              <p className="text-sm text-zinc-500 mb-6">
                Exibidas no topo do seu portfólio público
              </p>

              <div className="mb-6">
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-zinc-400 mb-2"
                >
                  <div className="flex items-center gap-2">
                    <Building2 size={16} />
                    Nome do escritório
                  </div>
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  data-testid="input-office-name"
                  value={formData.companyName}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white transition-all disabled:opacity-50"
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="companyBio"
                  className="block text-sm font-medium text-zinc-400 mb-2"
                >
                  Bio / descrição curta
                </label>
                <textarea
                  id="companyBio"
                  name="companyBio"
                  data-testid="input-company-bio"
                  value={formData.companyBio}
                  onChange={handleChange}
                  rows={10}
                  disabled={isSaving}
                  placeholder="Conte um pouco sobre o seu escritório..."
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white transition-all disabled:opacity-50 resize-none"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="websiteUrl"
                    className="block text-sm font-medium text-zinc-400 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <Globe size={16} />
                      Site
                    </div>
                  </label>
                  <SocialPrefixedInput
                    id="websiteUrl"
                    name="websiteUrl"
                    testId="input-website-url"
                    value={formData.websiteUrl}
                    onChange={handleChange}
                    prefix={SOCIAL_LINK_PREFIXES.website}
                    placeholder="seusite.com.br"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label
                    htmlFor="instagramUrl"
                    className="block text-sm font-medium text-zinc-400 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <Instagram size={16} />
                      Instagram
                    </div>
                  </label>
                  <SocialPrefixedInput
                    id="instagramUrl"
                    name="instagramUrl"
                    testId="input-instagram-url"
                    value={formData.instagramUrl}
                    onChange={handleChange}
                    prefix={SOCIAL_LINK_PREFIXES.instagram}
                    placeholder="seuusuario"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label
                    htmlFor="youtubeUrl"
                    className="block text-sm font-medium text-zinc-400 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <Youtube size={16} />
                      YouTube
                    </div>
                  </label>
                  <SocialPrefixedInput
                    id="youtubeUrl"
                    name="youtubeUrl"
                    testId="input-youtube-url"
                    value={formData.youtubeUrl}
                    onChange={handleChange}
                    prefix={SOCIAL_LINK_PREFIXES.youtube}
                    placeholder="@seucanal"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label
                    htmlFor="linkedinUrl"
                    className="block text-sm font-medium text-zinc-400 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <Linkedin size={16} />
                      LinkedIn
                    </div>
                  </label>
                  <SocialPrefixedInput
                    id="linkedinUrl"
                    name="linkedinUrl"
                    testId="input-linkedin-url"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    prefix={SOCIAL_LINK_PREFIXES.linkedin}
                    placeholder="seu-perfil"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label
                    htmlFor="whatsappUrl"
                    className="block text-sm font-medium text-zinc-400 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <MessageCircle size={16} />
                      WhatsApp
                    </div>
                  </label>
                  <SocialPrefixedInput
                    id="whatsappUrl"
                    name="whatsappUrl"
                    testId="input-whatsapp-url"
                    value={formData.whatsappUrl}
                    onChange={handleChange}
                    prefix={
                      whatsappBrazilLocal ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span aria-hidden="true">🇧🇷</span>
                          <span>+55</span>
                        </span>
                      ) : (
                        '+'
                      )
                    }
                    placeholder={whatsappBrazilLocal ? '11987654321' : '14155551234'}
                    inputMode="tel"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 md:p-8">
              <h2 className="text-2xl font-light tracking-tight text-white mb-6">Portfólio</h2>

              <div className="mb-6">
                <label
                  htmlFor="publicSlug"
                  className="block text-sm font-medium text-zinc-400 mb-2"
                >
                  <div className="flex items-center gap-2">
                    <Globe size={16} />
                    Slug público
                  </div>
                </label>
                <input
                  type="text"
                  id="publicSlug"
                  name="publicSlug"
                  data-testid="input-public-slug"
                  value={formData.publicSlug}
                  onChange={handleChange}
                  placeholder="meu-estudio"
                  disabled={isSaving}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white transition-all disabled:opacity-50"
                />
                {normalizedSlugPreview && slugAvailability === 'checking' && (
                  <p
                    className="mt-2 text-sm text-zinc-500"
                    data-testid="slug-availability-checking"
                  >
                    Verificando disponibilidade...
                  </p>
                )}
                {normalizedSlugPreview && slugAvailability === 'available' && (
                  <p
                    className="mt-2 text-sm text-emerald-400"
                    data-testid="slug-availability-available"
                  >
                    Disponível
                  </p>
                )}
                {normalizedSlugPreview && slugAvailability === 'unavailable' && (
                  <p
                    className="mt-2 text-sm text-red-400"
                    data-testid="slug-availability-unavailable"
                  >
                    Indisponível
                  </p>
                )}
                <div className="mt-2" data-testid="slug-preview-url">
                  <p className="text-sm text-zinc-500 mb-2">
                    Seu portfólio ficará disponível em:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={portfolioPreviewUrl}
                      data-testid="slug-preview-url-input"
                      className="flex-1 min-w-0 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-300 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPortfolioUrl}
                      data-testid="slug-copy-url"
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white hover:bg-zinc-700 transition-colors shrink-0"
                    >
                      <Copy size={16} />
                      Copiar
                    </button>
                  </div>
                </div>
              </div>

              {!publicPortfolioEnabled && (
                <UpgradePrompt
                  compact
                  showUpgradeButton={false}
                  message="O portfólio público está disponível no plano Professional."
                  className="mb-4"
                />
              )}

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">Portfólio público</p>
                  <p className="text-sm text-zinc-500">
                    Exibir seus projetos públicos em uma página dedicada
                  </p>
                </div>
                <Switch
                  id="portfolioEnabled"
                  data-testid="input-portfolio-enabled"
                  checked={formData.portfolioEnabled}
                  onCheckedChange={handlePortfolioToggle}
                  disabled={isSaving}
                  className="data-[state=checked]:bg-white data-[state=unchecked]:bg-zinc-700"
                />
              </div>
            </div>

           <div className="flex justify-end">
           <button
              type="submit"
              data-testid="save-settings-btn"
              disabled={isSaving || slugAvailability === 'unavailable'}
              className="px-8 py-3 bg-white text-black rounded-full font-medium btn-scale hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Salvando...' : 'Salvar alterações'}
            </button>

           </div>
          </form>
        )}
      </div>

      <PremiumFeatureModal
        open={portfolioPremiumModalOpen}
        onOpenChange={setPortfolioPremiumModalOpen}
        feature="portfolio"
      />
    </div>
  );
};
