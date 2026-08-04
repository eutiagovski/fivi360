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
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { SettingsNav } from '@/components/settings/SettingsNav';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsCard } from '@/components/settings/SettingsCard';
import { SettingsSaveActions } from '@/components/settings/SettingsSaveActions';
import {
  SETTINGS_SECTIONS,
  resolveSettingsSection,
} from '@/components/settings/settingsSections';
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
import { cn } from '@/lib/utils';

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

const inputClassName =
  'w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white transition-all disabled:opacity-50';

const fieldMax = 'max-w-xl';
const textareaMax = 'max-w-2xl';
const formMax = 'max-w-3xl';

export const Settings = () => {
  const { user } = useAuth();
  const { publicPortfolioEnabled } = usePlanLimits();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSectionState] = useState(() =>
    resolveSettingsSection(searchParams.get('section')),
  );
  const [formData, setFormData] = useState(initialFormData);
  const [companyLogo, setCompanyLogo] = useState('');
  const [savedSlug, setSavedSlug] = useState('');
  const [savedPortfolioEnabled, setSavedPortfolioEnabled] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [slugAvailability, setSlugAvailability] = useState(null);
  const [portfolioPremiumModalOpen, setPortfolioPremiumModalOpen] = useState(false);
  const [whatsappBrazilLocal, setWhatsappBrazilLocal] = useState(true);
  const contentRef = useRef(null);

  useEffect(() => {
    setActiveSectionState(resolveSettingsSection(searchParams.get('section')));
  }, [searchParams]);

  const setActiveSection = (sectionId) => {
    const next = resolveSettingsSection(sectionId);
    setActiveSectionState(next);
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (next === 'profile') {
          params.delete('section');
        } else {
          params.set('section', next);
        }
        return params;
      },
      { replace: true },
    );
    if (typeof contentRef.current?.scrollTo === 'function') {
      contentRef.current.scrollTo({ top: 0 });
    } else if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

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
        setCompanyLogo(profile?.companyLogo ?? '');
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

  const portfolioStatusLabel = formData.portfolioEnabled ? 'Ativo' : 'Inativo';
  const portfolioStatusHint = formData.portfolioEnabled
    ? 'Portfólio público habilitado'
    : 'Portfólio público desabilitado';

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden p-6 sm:p-8 md:px-12 md:pt-10 md:pb-6 lg:px-16 lg:pt-12 fade-in"
      data-testid="settings-page"
    >
      <header
        className="shrink-0 min-w-0"
        data-testid="settings-page-header"
      >
        <PageHeader
          title="Configurações"
          subtitle="Gerencie suas informações, preferências e presença pública no FIVI360."
          dataTestId="settings-title"
          className="mb-4 sm:mb-5"
        />
        <div className="lg:hidden pb-4">
          <SettingsNav
            variant="mobile"
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        </div>
      </header>

      {isLoadingProfile ? (
        <div
          className="flex min-h-0 flex-1 items-center justify-center"
          data-testid="settings-loading"
        >
          <Loader2
            className="h-8 w-8 animate-spin text-zinc-400"
            aria-label="Carregando configurações"
          />
        </div>
      ) : (
        <SettingsLayout
          contentRef={contentRef}
          nav={
            <SettingsNav
              variant="desktop"
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
          }
        >
          <form
            onSubmit={handleSubmit}
            className="space-y-8 pb-8"
            data-testid="settings-form"
          >
            {loadError && (
              <div
                role="alert"
                className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300"
                data-testid="settings-load-error"
              >
                {loadError}
              </div>
            )}

            {SETTINGS_SECTIONS.map((section) => {
              const isHidden = activeSection !== section.id;

              if (section.id === 'profile') {
                return (
                  <SettingsSection
                    key={section.id}
                    id={section.id}
                    title={section.title}
                    description={section.description}
                    hidden={isHidden}
                  >
                    <SettingsCard data-testid="settings-card-profile">
                      <div className={cn('space-y-5', formMax)}>
                        <div className={fieldMax}>
                          <label
                            htmlFor="name"
                            className="mb-2 block text-sm font-medium text-zinc-400"
                          >
                            <span className="flex items-center gap-2">
                              <User size={16} aria-hidden="true" />
                              Nome completo
                            </span>
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            data-testid="input-name"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={isSaving}
                            className={inputClassName}
                          />
                        </div>

                        <div className={fieldMax}>
                          <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-medium text-zinc-400"
                          >
                            <span className="flex items-center gap-2">
                              <Mail size={16} aria-hidden="true" />
                              E-mail
                            </span>
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            data-testid="input-email"
                            value={formData.email}
                            readOnly
                            disabled
                            className={cn(
                              inputClassName,
                              'text-zinc-500 cursor-not-allowed',
                            )}
                          />
                        </div>
                      </div>
                    </SettingsCard>
                  </SettingsSection>
                );
              }

              if (section.id === 'office') {
                return (
                  <SettingsSection
                    key={section.id}
                    id={section.id}
                    title={section.title}
                    description={section.description}
                    hidden={isHidden}
                  >
                    <SettingsCard
                      title="Identidade do escritório"
                      description="Logo, nome e descrição usados na presença pública."
                      data-testid="settings-card-office-identity"
                    >
                      <div className={cn('space-y-5', formMax)}>
                        <div>
                          <p className="mb-3 text-sm font-medium text-zinc-400">
                            Logo do escritório
                          </p>
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div
                              className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800"
                              data-testid="settings-logo-preview"
                            >
                              {companyLogo ? (
                                <img
                                  src={companyLogo}
                                  alt="Logo do escritório"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Upload
                                  className="text-zinc-600"
                                  size={32}
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                            <div className="space-y-2">
                              <button
                                type="button"
                                data-testid="upload-logo-btn"
                                className="inline-flex px-5 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl hover:bg-zinc-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                              >
                                {companyLogo ? 'Alterar logo' : 'Fazer upload'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <label
                              htmlFor="companyName"
                              className="mb-2 block text-sm font-medium text-zinc-400"
                            >
                              <span className="flex items-center gap-2">
                                <Building2 size={16} aria-hidden="true" />
                                Nome do escritório
                              </span>
                            </label>
                            <input
                              type="text"
                              id="companyName"
                              name="companyName"
                              data-testid="input-office-name"
                              value={formData.companyName}
                              onChange={handleChange}
                              disabled={isSaving}
                              className={inputClassName}
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="websiteUrl"
                              className="mb-2 block text-sm font-medium text-zinc-400"
                            >
                              <span className="flex items-center gap-2">
                                <Globe size={16} aria-hidden="true" />
                                Website
                              </span>
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
                        </div>

                        <div className={textareaMax}>
                          <label
                            htmlFor="companyBio"
                            className="mb-2 block text-sm font-medium text-zinc-400"
                          >
                            Descrição
                          </label>
                          <textarea
                            id="companyBio"
                            name="companyBio"
                            data-testid="input-company-bio"
                            value={formData.companyBio}
                            onChange={handleChange}
                            rows={5}
                            disabled={isSaving}
                            placeholder="Conte um pouco sobre o seu escritório..."
                            className={cn(inputClassName, 'resize-none')}
                          />
                        </div>
                      </div>
                    </SettingsCard>
                  </SettingsSection>
                );
              }

              return (
                <SettingsSection
                  key={section.id}
                  id={section.id}
                  title={section.title}
                  description={section.description}
                  hidden={isHidden}
                >
                  <SettingsCard
                    title="Presença pública"
                    description="Status, endereço e redes exibidas no portfólio."
                    data-testid="settings-card-portfolio"
                  >
                    <div className={cn('space-y-6', formMax)}>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-sm font-medium text-zinc-400">Status</p>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-semibold',
                            formData.portfolioEnabled
                              ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-300'
                              : 'border-zinc-700 bg-zinc-900 text-zinc-400',
                          )}
                          data-testid="portfolio-status-badge"
                          title={portfolioStatusHint}
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              formData.portfolioEnabled
                                ? 'bg-emerald-400'
                                : 'bg-zinc-500',
                            )}
                            aria-hidden="true"
                          />
                          {portfolioStatusLabel}
                        </span>
                        <span className="sr-only">{portfolioStatusHint}</span>
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-medium text-zinc-400">
                          Endereço
                        </p>
                        <div
                          className="flex flex-col gap-2 sm:flex-row"
                          data-testid="slug-preview-url"
                        >
                          <input
                            type="text"
                            readOnly
                            value={portfolioPreviewUrl}
                            data-testid="slug-preview-url-input"
                            aria-label="Link público do portfólio"
                            className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleCopyPortfolioUrl}
                            data-testid="slug-copy-url"
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                          >
                            <Copy size={16} aria-hidden="true" />
                            Copiar link
                          </button>
                        </div>
                      </div>

                      <div className={fieldMax}>
                        <label
                          htmlFor="publicSlug"
                          className="mb-2 block text-sm font-medium text-zinc-400"
                        >
                          <span className="flex items-center gap-2">
                            <Globe size={16} aria-hidden="true" />
                            Slug
                          </span>
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
                          className={inputClassName}
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
                        {normalizedSlugPreview &&
                          slugAvailability === 'unavailable' && (
                            <p
                              className="mt-2 text-sm text-red-400"
                              data-testid="slug-availability-unavailable"
                            >
                              Indisponível
                            </p>
                          )}
                      </div>

                      {!publicPortfolioEnabled && (
                        <UpgradePrompt
                          compact
                          showUpgradeButton={false}
                          message="O portfólio público está disponível nos planos Professional e Studio."
                        />
                      )}

                      <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">
                            Portfólio público
                          </p>
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
                  </SettingsCard>

                  <SettingsCard
                    title="Redes sociais"
                    description="Links exibidos no topo do portfólio público."
                    data-testid="settings-card-social"
                  >
                    <div
                      className={cn(
                        'grid gap-5 sm:grid-cols-1 md:grid-cols-2',
                        formMax,
                      )}
                    >
                      <div>
                        <label
                          htmlFor="instagramUrl"
                          className="mb-2 block text-sm font-medium text-zinc-400"
                        >
                          <span className="flex items-center gap-2">
                            <Instagram size={16} aria-hidden="true" />
                            Instagram
                          </span>
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
                          className="mb-2 block text-sm font-medium text-zinc-400"
                        >
                          <span className="flex items-center gap-2">
                            <Youtube size={16} aria-hidden="true" />
                            YouTube
                          </span>
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
                          className="mb-2 block text-sm font-medium text-zinc-400"
                        >
                          <span className="flex items-center gap-2">
                            <Linkedin size={16} aria-hidden="true" />
                            LinkedIn
                          </span>
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
                          className="mb-2 block text-sm font-medium text-zinc-400"
                        >
                          <span className="flex items-center gap-2">
                            <MessageCircle size={16} aria-hidden="true" />
                            WhatsApp
                          </span>
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
                          placeholder={
                            whatsappBrazilLocal ? '11987654321' : '14155551234'
                          }
                          inputMode="tel"
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  </SettingsCard>
                </SettingsSection>
              );
            })}

            <SettingsSaveActions
              isSaving={isSaving}
              disabled={slugAvailability === 'unavailable'}
            />
          </form>
        </SettingsLayout>
      )}

      <PremiumFeatureModal
        open={portfolioPremiumModalOpen}
        onOpenChange={setPortfolioPremiumModalOpen}
        feature="portfolio"
      />
    </div>
  );
};
