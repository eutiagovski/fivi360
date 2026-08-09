import { PLAN_IDS, isManualPlanSource } from "@/config/planLimits";
import {
  BILLING_PORTAL_COMING_SOON_MESSAGE,
  formatBillingDate,
  getCancelAtPeriodEndAccessMessage,
  getPlanMonthlyPriceLabel,
  getSubscriptionPeriodDisplay,
  getSubscriptionStatusLabel,
  MANUAL_PLAN_ACCESS_STATUS_LABEL,
} from "@/config/billing";
import { useToast } from "@/hooks/use-toast";

/**
 * Seção Gerenciar assinatura (Starter vs planos pagos vs grant manual).
 *
 * @param {{
 *   planId: import("@/config/planLimits").PlanId,
 *   planSource?: string,
 *   limits: import("@/config/planLimits").PlanLimits,
 *   billing: import("@/config/billing").UserBilling,
 *   onUpgrade: () => void,
 * }} props
 */
export function ManageSubscriptionSection({
  planId,
  planSource = "",
  limits,
  billing,
  onUpgrade,
}) {
  const { toast } = useToast();
  const isStarter = planId === PLAN_IDS.STARTER;
  const isManualGrant = !isStarter && isManualPlanSource(planSource);

  const handleManageSubscription = () => {
    toast({
      title: "Gerenciar assinatura",
      description: BILLING_PORTAL_COMING_SOON_MESSAGE,
    });
  };

  return (
    <div
      className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8"
      data-testid="manage-subscription-section"
    >
      {isStarter ? (
        <StarterSubscriptionView
          onUpgrade={onUpgrade}
          onManageSubscription={handleManageSubscription}
        />
      ) : isManualGrant ? (
        <ManualAccessView limits={limits} />
      ) : (
        <PaidSubscriptionView
          limits={limits}
          planId={planId}
          billing={billing}
          onManageSubscription={handleManageSubscription}
        />
      )}
    </div>
  );
}

function ManageSubscriptionButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="manage-subscription-portal-btn"
      className="px-6 py-2.5 rounded-full text-sm font-medium bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300 transition-colors"
      title={BILLING_PORTAL_COMING_SOON_MESSAGE}
    >
      Gerenciar assinatura
    </button>
  );
}

function StarterSubscriptionView({ onUpgrade, onManageSubscription }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="min-w-0">
          <h3
            className="text-lg font-medium text-white mb-2"
            data-testid="manage-subscription-starter-title"
          >
            Você está utilizando o plano Starter
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            Faça upgrade para desbloquear mais armazenamento, hotspots
            interativos, portfólio público e projetos ilimitados.
          </p>
        </div>
        <button
          type="button"
          onClick={onUpgrade}
          data-testid="manage-subscription-upgrade-btn"
          className="shrink-0 px-8 py-3 rounded-full text-sm font-medium bg-white text-black hover:bg-zinc-200 transition-colors btn-scale"
        >
          Fazer upgrade
        </button>
      </div>
      {/* <div className="flex flex-col sm:flex-row gap-3">
        <ManageSubscriptionButton onClick={onManageSubscription} />
        <p className="text-xs text-zinc-500 self-center sm:ml-1">
          {BILLING_PORTAL_COMING_SOON_MESSAGE}
        </p>
      </div> */}
    </div>
  );
}

/**
 * Plano pago concedido sem assinatura Stripe (source=manual).
 * Sem próxima cobrança, preço cobrado ou ações de assinatura.
 */
function ManualAccessView({ limits }) {
  return (
    <div className="space-y-6" data-testid="manage-subscription-manual-view">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <SubscriptionInfoItem
          label="Plano atual"
          value={`Plano ${limits.displayName}`}
          dataTestId="manage-subscription-current-plan"
        />
        <SubscriptionInfoItem
          label="Status"
          value={MANUAL_PLAN_ACCESS_STATUS_LABEL}
          dataTestId="manage-subscription-status"
        />
      </div>
      <p
        className="text-sm text-zinc-500 leading-relaxed max-w-2xl"
        data-testid="manage-subscription-manual-note"
      >
        Este acesso foi concedido à sua conta. Não há assinatura Stripe nem
        cobrança recorrente associada.
      </p>
    </div>
  );
}

function PaidSubscriptionView({ limits, planId, billing, onManageSubscription }) {
  const periodDisplay = getSubscriptionPeriodDisplay(billing);
  const accessMessage = billing.cancelAtPeriodEnd
    ? getCancelAtPeriodEndAccessMessage(
        periodDisplay.periodEnd ? formatBillingDate(periodDisplay.periodEnd) : null,
      )
    : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SubscriptionInfoItem
          label="Plano atual"
          value={`Plano ${limits.displayName}`}
          dataTestId="manage-subscription-current-plan"
        />
        <SubscriptionInfoItem
          label="Status da assinatura"
          value={getSubscriptionStatusLabel(billing.subscriptionStatus)}
          dataTestId="manage-subscription-status"
        />
        {periodDisplay.visible ? (
          <SubscriptionInfoItem
            label={periodDisplay.label}
            value={periodDisplay.value}
            dataTestId="manage-subscription-next-billing"
          />
        ) : null}
        <SubscriptionInfoItem
          label="Valor mensal"
          value={`${getPlanMonthlyPriceLabel(planId)} /mês`}
          dataTestId="manage-subscription-monthly-price"
        />
      </div>

      {billing.cancelAtPeriodEnd && accessMessage ? (
        <p
          className="text-sm text-amber-200/90"
          data-testid="manage-subscription-cancel-pending"
        >
          {accessMessage}
        </p>
      ) : null}

      {/* <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center">
        <ManageSubscriptionButton onClick={onManageSubscription} />
        <span className="text-xs text-zinc-500 hidden sm:inline">
          {BILLING_PORTAL_COMING_SOON_MESSAGE}
        </span>
      </div> */}
    </div>
  );
}

function SubscriptionInfoItem({ label, value, dataTestId }) {
  return (
    <div data-testid={dataTestId}>
      <p className="text-sm text-zinc-400 mb-1">{label}</p>
      <p className="text-base font-light text-white">{value}</p>
    </div>
  );
}
