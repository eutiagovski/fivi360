import { useCallback, useEffect, useState } from 'react';
import { Link2, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PageActionHeader } from '@/components/common/PageActionHeader';
import { SectionHeader } from '@/components/common/SectionHeader';
import { StatCard } from '@/components/common/StatCard';
import { AuthLoadingScreen } from '@/components/auth/ProtectedRoute';
import {
  appAlertContentClassName,
  APP_MODAL_FOOTER_CLASSES,
} from '@/components/common/AppModal';
import { BillingHistorySection } from '@/components/plans/BillingHistorySection';
import { CurrentPlanBanner } from '@/components/plans/CurrentPlanBanner';
import { ManageSubscriptionSection } from '@/components/plans/ManageSubscriptionSection';
import { UpgradePlanModal } from '@/components/plans/UpgradePlanModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { canCancelStripeSubscription, canStartStripeCheckoutForPlan, CHECKOUT_ALREADY_SUBSCRIBED_MESSAGE, normalizeCheckoutRequestedPlanId, normalizeCheckoutSessionId, PAYMENTS_COMING_SOON_MESSAGE } from '@/config/billing';
import { isPlanAtOrAbove, PLAN_IDS } from '@/config/planLimits';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useCheckoutSuccessSync } from '@/hooks/useCheckoutSuccessSync';
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';
import { isBillingUpgradePlanId } from '@/utils/billingPlanFlow';
import { cancelSubscription, requestUpgrade } from '@/services/billing/billingService';
import { trackEvent } from '@/services/analytics/analyticsService';

export const Plan = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const upgradeFromQuery = searchParams.get('upgrade');
  const checkoutStatus = searchParams.get('checkout');
  const sessionId = normalizeCheckoutSessionId(searchParams.get('session_id'));
  const requestedPlanId = normalizeCheckoutRequestedPlanId(searchParams.get('plan'));
  const isCheckoutSuccess = checkoutStatus === 'success';
  const {
    loading,
    planId,
    planSource,
    limits,
    usageStats,
    billing,
    refresh,
    refreshSilent,
  } = usePlanLimits();
  const { projects, loading: projectsLoading } = useProjects();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [highlightedPlanId, setHighlightedPlanId] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [invoiceReloadSignal, setInvoiceReloadSignal] = useState(0);

  const reloadInvoices = useCallback(() => {
    setInvoiceReloadSignal((current) => current + 1);
  }, []);

  const { confirming, confirmMessage } = useCheckoutSuccessSync({
    checkoutStatus,
    sessionId,
    requestedPlanId,
    refreshPlan: refreshSilent,
    onInvoicesReload: reloadInvoices,
    toast,
  });

  const openUpgradeModal = (planToHighlight = null) => {
    if (planToHighlight && isBillingUpgradePlanId(planToHighlight)) {
      setHighlightedPlanId(planToHighlight);
    }
    setUpgradeModalOpen(true);
  };

  useEffect(() => {
    if (isBillingUpgradePlanId(upgradeFromQuery)) {
      setHighlightedPlanId(upgradeFromQuery);
      setUpgradeModalOpen(true);
    }
  }, [upgradeFromQuery]);

  const isStarter = planId === PLAN_IDS.STARTER;
  const canOpenUpgrade = planId !== PLAN_IDS.ENTERPRISE;
  const showCancelSubscriptionButton = canCancelStripeSubscription(billing, {
    planSource,
  });

  const sharedLinksCount = projects.filter(
    (p) => p.visibility !== 'private',
  ).length;

  const handleCancelSubscription = async () => {
    setCancelingSubscription(true);

    try {
      const result = await cancelSubscription();

      if (!result.ok) {
        toast({
          title: 'Assinatura',
          description: result.message,
          variant: 'destructive',
        });
        return;
      }

      await refresh();
      setCancelDialogOpen(false);
      toast({
        title: 'Assinatura',
        description: result.message,
      });
    } finally {
      setCancelingSubscription(false);
    }
  };

  const handleSubscribe = async (selectedPlanId) => {
    if (!canStartStripeCheckoutForPlan(selectedPlanId, planId)) {
      toast({
        title: 'Assinatura',
        description: isPlanAtOrAbove(planId, selectedPlanId)
          ? CHECKOUT_ALREADY_SUBSCRIBED_MESSAGE
          : PAYMENTS_COMING_SOON_MESSAGE,
        variant: 'destructive',
      });
      return;
    }

    const result = await requestUpgrade(selectedPlanId);

    if (!result.ok) {
      toast({
        title: 'Assinatura',
        description: result.message,
        variant: 'destructive',
      });
      return;
    }

    trackEvent('begin_checkout', { plan_id: selectedPlanId });
    window.location.assign(result.checkoutUrl);
  };

  if ((loading || projectsLoading) && !isCheckoutSuccess) {
    return <AuthLoadingScreen />;
  }

  return (
    <div className="p-8 md:p-12 lg:p-16 fade-in">
      <PageActionHeader
        title="Plano"
        subtitle="Acompanhe seu plano atual e o consumo da conta"
        actionLabel={canOpenUpgrade ? 'Fazer upgrade' : undefined}
        onAction={() => openUpgradeModal()}
        dataTestId="plan-title"
        actionDataTestId="plan-upgrade-btn"
      />

      {(confirming || confirmMessage) && (
        <aside
          className="mb-8 w-full min-w-0 rounded-xl border border-sky-500/25 bg-sky-500/[0.07] px-5 py-4 sm:px-6 sm:py-5"
          data-testid="checkout-confirming-banner"
          role="status"
        >
          <div className="flex items-start gap-3 min-w-0">
            {confirming ? (
              <Loader2
                size={20}
                className="flex-shrink-0 animate-spin text-sky-400/90 mt-0.5"
                aria-hidden
              />
            ) : null}
            <p className="text-sm text-zinc-300 leading-relaxed">
              {confirmMessage}
            </p>
          </div>
        </aside>
      )}

      {/* <CurrentPlanBanner
        planId={planId}
        onViewProBenefits={() => openUpgradeModal()}
        className="mb-12"
      /> */}

      <SectionHeader title="Seu consumo atual" dataTestId="usage-title" />
      <p className="text-sm text-zinc-500 mb-6 -mt-4">
        Uso em tempo real dos recursos da conta
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard
          variant="usage"
          label="Projetos"
          current={String(usageStats.projects.current)}
          limit={usageStats.projects.limitLabel}
          percentage={usageStats.projects.percentage}
          unlimited={usageStats.projects.unlimited}
          dataTestId="usage-projects"
        />
        <StatCard
          variant="usage"
          label="Imagens"
          current={String(usageStats.images.current)}
          limit={usageStats.images.limitLabel}
          percentage={usageStats.images.percentage}
          unlimited={usageStats.images.unlimited}
          dataTestId="usage-images"
        />
        <StatCard
          variant="metric"
          icon={<Link2 size={20} className="text-zinc-400" />}
          label="Links compartilhados"
          value={String(sharedLinksCount)}
          dataTestId="usage-shared-links"
        />
        <StatCard
          variant="usage"
          label="Armazenamento"
          current={usageStats.storage.currentLabel}
          limit={`/ ${usageStats.storage.limitLabel}`}
          percentage={usageStats.storage.percentage}
          unlimited={false}
          dataTestId="usage-storage"
        />
      </div>

      <div className="mt-12">
        <SectionHeader
          title="Gerenciar assinatura"
          dataTestId="manage-subscription-title"
          actions={
            !isStarter ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => openUpgradeModal()}
                  data-testid="manage-subscription-change-plan-btn"
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-medium border border-zinc-700 bg-zinc-800/40 text-zinc-300 btn-scale transition-colors hover:bg-zinc-800/70 hover:text-white hover:border-zinc-600"
                >
                  Alterar plano
                </button>
                {showCancelSubscriptionButton && (
                  <button
                    type="button"
                    onClick={() => setCancelDialogOpen(true)}
                    data-testid="manage-subscription-cancel-btn"
                    className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-medium border border-zinc-700 bg-transparent text-zinc-400 transition-colors hover:bg-red-950/25 hover:border-red-900/40 hover:text-red-300/90"
                  >
                    Cancelar assinatura
                  </button>
                )}
              </div>
            ) : undefined
          }
        />
        <ManageSubscriptionSection
          planId={planId}
          planSource={planSource}
          limits={limits}
          billing={billing}
          onUpgrade={() => openUpgradeModal()}
        />
      </div>

      <div className="mt-12">
        <SectionHeader
          title="Histórico de cobrança"
          dataTestId="billing-history-title"
        />
        <BillingHistorySection invoiceReloadSignal={invoiceReloadSignal} />
      </div>

      <UpgradePlanModal
        open={upgradeModalOpen}
        onOpenChange={(open) => {
          setUpgradeModalOpen(open);
          if (!open) {
            setHighlightedPlanId(null);
          }
        }}
        highlightedPlanId={highlightedPlanId ?? upgradeFromQuery}
        currentPlanId={planId}
        onSubscribe={handleSubscribe}
      />

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className={appAlertContentClassName('md')}>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>Cancelar assinatura</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Sua assinatura permanecerá ativa até o fim do período atual. Depois
              disso, sua conta voltará ao plano Starter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={APP_MODAL_FOOTER_CLASSES}>
            <AlertDialogCancel
              disabled={cancelingSubscription}
              className="rounded-full border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              Manter assinatura
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelingSubscription}
              onClick={(event) => {
                event.preventDefault();
                handleCancelSubscription();
              }}
              data-testid="manage-subscription-cancel-confirm-btn"
              className="rounded-full bg-red-600 text-white hover:bg-red-500"
            >
              {cancelingSubscription ? 'Cancelando...' : 'Confirmar cancelamento'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
