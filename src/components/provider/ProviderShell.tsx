import React, { useState, useMemo, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { useSurplusLink } from '../../context/SurplusLinkContext';
import { donationsForProvider, providerImpact } from '../../selectors';
import { computePickupDeadline } from '../../utils/deadlineUtils';
import {
  getMockPOSTransactions,
  calculatePOSTotals,
  getProviderLast7Donations,
  calculateRollingAverageSurplus,
  getCurrentMealSlot,
  getMealSlotLabel,
} from '../../utils/posAndPredictionUtils';
import { MealSlot } from '../../types/surplusLink';
import { ProviderHeader } from './ProviderHeader';
import { MealProductionSection, MealProductionData } from './MealProductionSection';
import { TonightDonationCard } from './TonightDonationCard';
import { ProgressStrip } from './ProgressStrip';
import { RecentDonationsList } from './RecentDonationsList';
import { AmountStepperSheet } from './AmountStepperSheet';
import { MissingDefaultsSheet } from './MissingDefaultsSheet';
import { DeadlineEditSheet } from './DeadlineEditSheet';
import { ProviderDemoDrawer } from './ProviderDemoDrawer';
import { ProviderImpactTab } from './ProviderImpactTab';
import { MealWindowsCard } from './MealWindowsCard';
import { BillingConnectionSection } from './BillingConnectionSection';
import { ConnectBillingModal } from './ConnectBillingModal';
import { useToast } from '../shared/Toast';

export const ProviderShell: React.FC = () => {
  const toast = useToast();
  const {
    providers,
    selectedProvider,
    setSelectedProviderId,
    donations,
    addDonation,
    updateDonation,
    updateProviderDefaults,
    saveMealProduction,
    updateProviderMealWindows,
    connectBilling,
    disconnectBilling,
    syncBilling,
    toggleAutoFillSoldQty,
    skipTonightDonation,
    unskipTonightDonation,
    resetAllData,
  } = useSurplusLink();

  const [activeMealSlot, setActiveMealSlot] = useState<MealSlot>(() =>
    getCurrentMealSlot(selectedProvider?.mealSlotWindows)
  );
  const [activeTab, setActiveTab] = useState<'today' | 'billing' | 'impact'>('today');
  const [isStepperOpen, setIsStepperOpen] = useState(false);
  const [isMissingDefaultsOpen, setIsMissingDefaultsOpen] = useState(false);
  const [isDeadlineOpen, setIsDeadlineOpen] = useState(false);
  const [isDemoDrawerOpen, setIsDemoDrawerOpen] = useState(false);
  const [isConnectBillingModalOpen, setIsConnectBillingModalOpen] = useState(false);
  const [isPosConnected, setIsPosConnected] = useState(false);
  const [customSurplus, setCustomSurplus] = useState<number | null>(null);
  const [customDeadlineTime, setCustomDeadlineTime] = useState<string | null>(null);
  const [editingSlots, setEditingSlots] = useState<Record<MealSlot, boolean>>({
    morning: false,
    afternoon: false,
    night: false,
  });
  const [soldOverrides, setSoldOverrides] = useState<Partial<Record<MealSlot, number>>>({});
  const [manualSoldValues, setManualSoldValues] = useState<Partial<Record<MealSlot, number>>>({});

  const handleConnectBilling = (connectorName: string) => {
    connectBilling(selectedProvider.id, connectorName);
    setSoldOverrides({});
    setCustomSurplus(null);
    toast.success(`Billing connected to ${connectorName}`);
  };

  const handleDisconnectBilling = () => {
    disconnectBilling(selectedProvider.id);
    setSoldOverrides({});
    setCustomSurplus(null);
    toast.success('Billing software disconnected. Returned to manual mode.');
  };

  const handleSyncBilling = () => {
    syncBilling(selectedProvider.id);
    toast.success('Billing data refreshed');
  };

  // Defaults & Per-Meal Math
  const defaults = selectedProvider.defaults;
  const mealProd = selectedProvider.mealProductions?.[activeMealSlot];

  const defaultPrepForSlot = activeMealSlot === 'morning' ? 60 : activeMealSlot === 'afternoon' ? 90 : (defaults?.usualPreparedQty ?? 80);
  const defaultPrepTimeForSlot = activeMealSlot === 'morning' ? '07:00' : activeMealSlot === 'afternoon' ? '12:30' : (defaults?.preparationTime ?? '18:30');
  const defaultClosingForSlot = activeMealSlot === 'morning' ? '10:00' : activeMealSlot === 'afternoon' ? '15:00' : (selectedProvider.closingTime || defaults?.closingTime || '21:30');

  const savedPrep = mealProd?.preparedQty ?? (activeMealSlot === 'night' ? (selectedProvider.lastProduction?.preparedQty ?? defaultPrepForSlot) : defaultPrepForSlot);
  const savedPrepTime = mealProd?.preparationTime ?? (activeMealSlot === 'night' ? (selectedProvider.lastProduction?.preparationTime ?? defaultPrepTimeForSlot) : defaultPrepTimeForSlot);
  const savedClosingTime = mealProd?.closingTime ?? (activeMealSlot === 'night' ? (selectedProvider.closingTime || defaultClosingForSlot) : defaultClosingForSlot);

  const billingConn = selectedProvider.billingConnection;
  const isBillingConnected = billingConn?.status === 'connected';
  const autoFillEnabled = isBillingConnected && (billingConn?.autoFillSoldQty ?? true);

  const prep = savedPrep;
  const discards = defaults?.usualDiscardQty ?? 2;
  const posTx = useMemo(
    () => getMockPOSTransactions(selectedProvider, activeMealSlot),
    [selectedProvider, activeMealSlot, selectedProvider.mealSlotWindows, billingConn?.lastSyncedAt, billingConn?.syncCount]
  );
  const posTotals = useMemo(
    () => calculatePOSTotals(posTx, activeMealSlot),
    [posTx, activeMealSlot]
  );
  const defaultSoldForSlot = activeMealSlot === 'morning' ? 40 : activeMealSlot === 'afternoon' ? 60 : (defaults?.usualSoldQty ?? 50);

  let sold: number;
  let isAuto = false;
  let isOverridden = false;
  let calculationSource: string;

  if (autoFillEnabled) {
    if (soldOverrides[activeMealSlot] !== undefined) {
      sold = soldOverrides[activeMealSlot]!;
      isAuto = false;
      isOverridden = true;
      calculationSource = `Manual override for ${getMealSlotLabel(activeMealSlot).toLowerCase()}`;
    } else {
      sold = posTotals.totalPortions;
      isAuto = true;
      isOverridden = false;
      calculationSource = `Auto-synced from ${billingConn?.connectorName || 'POS'} (${posTotals.ticketCount} orders)`;
    }
  } else {
    sold = manualSoldValues[activeMealSlot] ?? (isPosConnected ? posTotals.totalPortions : defaultSoldForSlot);
    isAuto = false;
    isOverridden = false;
    calculationSource = isBillingConnected
      ? `Manual mode (Auto-fill turned off)`
      : `Manual entry for ${getMealSlotLabel(activeMealSlot).toLowerCase()}`;
  }

  const handleOverrideSold = (newSold: number) => {
    if (autoFillEnabled) {
      setSoldOverrides((prev) => ({ ...prev, [activeMealSlot]: newSold }));
    } else {
      setManualSoldValues((prev) => ({ ...prev, [activeMealSlot]: newSold }));
    }
    setCustomSurplus(null);
  };

  const handleResetAutoSold = () => {
    setSoldOverrides((prev) => {
      const copy = { ...prev };
      delete copy[activeMealSlot];
      return copy;
    });
    setCustomSurplus(null);
  };

  const calculatedSurplus = Math.max(1, prep - sold - discards);
  const surplusPortions = customSurplus !== null ? customSurplus : calculatedSurplus;

  // Deadline calculation
  const deadlineInfo = useMemo(() => {
    return computePickupDeadline(
      defaults?.category || 'bakery_bread',
      defaults?.storageType || 'room_temp',
      customDeadlineTime || savedClosingTime
    );
  }, [defaults, customDeadlineTime, savedClosingTime]);

  // Missing fields check
  const missingFields = [
    !defaults?.usualFoodItem && 'Food item',
    !defaults?.category && 'Category',
    !defaults?.storageType && 'Storage type',
  ].filter(Boolean) as string[];

  // Provider's donations & Active meal's donation status
  const providerDonations = donationsForProvider({ donations }, selectedProvider.id);
  const tonightDonation = providerDonations.find((d) =>
    (d.mealSlot === activeMealSlot || (!d.mealSlot && activeMealSlot === 'night')) &&
    ['Confirmed', 'Scheduled', 'Collected', 'Received', 'Distributed'].includes(d.status)
  ) || null;

  // Rolling predictions per meal slot
  const history = useMemo(() => getProviderLast7Donations(selectedProvider.id, donations, activeMealSlot), [selectedProvider.id, donations, activeMealSlot]);
  const predicted = useMemo(() => calculateRollingAverageSurplus(history, activeMealSlot, selectedProvider.type), [history, activeMealSlot, selectedProvider.type]);

  // Header status chip
  const isSkipped = Boolean(
    selectedProvider.skippedMealSlots?.[activeMealSlot] ??
    (activeMealSlot === 'night' ? selectedProvider.isSkippedTonight : false)
  );
  let statusText = 'Ready today';
  let statusVariant: 'ready' | 'scheduled' | 'collected' | 'delivered' | 'skipped' | 'idle' = 'idle';

  // Check for exclusion banner from active meal donation or recent exclusion records
  const exclusionBanner = useMemo(() => {
    if (tonightDonation?.exclusionRecord) return tonightDonation.exclusionRecord;
    const withExclusion = providerDonations.find((d) => d.exclusionRecord && (d.mealSlot === activeMealSlot || (!d.mealSlot && activeMealSlot === 'night')));
    if (withExclusion?.exclusionRecord) return withExclusion.exclusionRecord;
    if (tonightDonation?.failureReason) {
      return {
        reasonLabel: 'Pickup Failed / Excluded',
        detail: tonightDonation.failureReason,
      };
    }
    return null;
  }, [tonightDonation, providerDonations, activeMealSlot]);

  if (isSkipped) {
    statusText = 'No surplus today';
    statusVariant = 'skipped';
  } else if (tonightDonation) {
    statusText = tonightDonation.status;
    if (tonightDonation.status === 'Confirmed') statusVariant = 'ready';
    else if (tonightDonation.status === 'Scheduled') statusVariant = 'scheduled';
    else if (tonightDonation.status === 'Collected') statusVariant = 'collected';
    else if (['Received', 'Distributed'].includes(tonightDonation.status)) statusVariant = 'delivered';
  }

  const hasSavedProductionForMeal = Boolean(mealProd || tonightDonation);
  const isMealLocked = Boolean(tonightDonation && ['Scheduled', 'Collected', 'Received', 'Distributed'].includes(tonightDonation.status));
  const isMealSaved = hasSavedProductionForMeal && !editingSlots[activeMealSlot];

  const handleSelectMealSlot = (slot: MealSlot) => {
    setActiveMealSlot(slot);
    setCustomSurplus(null);
    setCustomDeadlineTime(null);
  };

  const handleSaveMealProduction = (data: MealProductionData) => {
    saveMealProduction(selectedProvider.id, data, activeMealSlot);
    setEditingSlots((prev) => ({ ...prev, [activeMealSlot]: false }));
    setCustomSurplus(null);
    setCustomDeadlineTime(null);

    // If donation was already confirmed (and not yet scheduled), update it with new portions and deadline
    if (tonightDonation && tonightDonation.status === 'Confirmed') {
      const newSurplus = Math.max(1, data.preparedQty - sold - discards);
      const newDeadline = computePickupDeadline(
        defaults?.category || 'bakery_bread',
        defaults?.storageType || 'room_temp',
        data.closingTime
      );
      updateDonation(tonightDonation.id, {
        preparedQty: data.preparedQty,
        preparedTime: data.preparationTime,
        confirmedPortions: newSurplus,
        portions: newSurplus,
        collectionDeadline: newDeadline.formatted.replace('Pickup by ', ''),
        deadlineTimestamp: newDeadline.timestamp,
      });
      toast.info(`Updated confirmed ${getMealSlotLabel(activeMealSlot).toLowerCase()} surplus to ${newSurplus} portions`);
    }
  };

  const handleConfirm = () => {
    addDonation({
      providerId: selectedProvider.id,
      providerName: selectedProvider.name,
      providerType: selectedProvider.type,
      mealSlot: activeMealSlot,
      foodItem: defaults?.usualFoodItem || `${getMealSlotLabel(activeMealSlot)} Surplus Meals`,
      category: defaults?.category || 'bakery_bread',
      confirmedPortions: surplusPortions,
      portions: surplusPortions,
      preparedQty: savedPrep,
      soldQty: sold,
      discardQty: discards,
      storageType: defaults?.storageType || 'room_temp',
      preparedTime: savedPrepTime,
      collectionDeadline: deadlineInfo.formatted.replace('Pickup by ', ''),
      deadlineTimestamp: deadlineInfo.timestamp,
      dietary: 'veg',
      notes: `${selectedProvider.name} 1-touch verified ${getMealSlotLabel(activeMealSlot).toLowerCase()} surplus.`,
    });
  };

  const metrics = providerImpact({ donations }, selectedProvider.id);

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-8">
      {/* 1. Header with business name and status chip + 2 tabs */}
      <ProviderHeader
        selectedProvider={selectedProvider}
        statusText={statusText}
        statusVariant={statusVariant}
        onOpenDemoTools={() => setIsDemoDrawerOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isApproved={selectedProvider.isApproved !== false}
      />

      {activeTab === 'today' && (
        <div className="space-y-4">
          {/* Meal Production Section - First thing on provider home screen */}
          <MealProductionSection
            activeMealSlot={activeMealSlot}
            onSelectMealSlot={handleSelectMealSlot}
            mealSlotWindows={selectedProvider.mealSlotWindows}
            lastSavedQuantity={savedPrep}
            lastSavedPrepTime={savedPrepTime}
            lastSavedClosingTime={savedClosingTime}
            isSaved={isMealSaved}
            isLocked={isMealLocked}
            onSave={handleSaveMealProduction}
            onEdit={() => {
              if (!isMealLocked) {
                setEditingSlots((prev) => ({ ...prev, [activeMealSlot]: true }));
              }
            }}
            disabled={selectedProvider.isApproved === false || isSkipped}
            billingConnection={selectedProvider.billingConnection}
            onConnectBilling={() => setIsConnectBillingModalOpen(true)}
            onSyncBilling={handleSyncBilling}
          />

          {/* 2. Primary Card */}
          <TonightDonationCard
            mealSlot={activeMealSlot}
            surplusPortions={surplusPortions}
            missingFields={missingFields}
            pickupDeadlineFormatted={deadlineInfo.formatted}
            onOpenDeadlineSheet={() => setIsDeadlineOpen(true)}
            calculation={{
              prepared: prep,
              sold,
              discards,
              source: calculationSource,
            }}
            soldMode={{
              isBillingConnected,
              isAuto,
              isOverridden,
              onOverride: handleOverrideSold,
              onResetToAuto: handleResetAutoSold,
            }}
            tonightDonation={tonightDonation}
            isSkippedTonight={isSkipped}
            onConfirm={handleConfirm}
            onChangeAmount={() => setIsStepperOpen(true)}
            onNoSurplusTonight={() => skipTonightDonation(selectedProvider.id, activeMealSlot)}
            onUnskip={() => unskipTonightDonation(selectedProvider.id, activeMealSlot)}
            onOpenMissingDetails={() => setIsMissingDefaultsOpen(true)}
            isApproved={selectedProvider.isApproved !== false}
            exclusionBanner={exclusionBanner}
            isProductionSaved={isMealSaved || Boolean(tonightDonation)}
          />

          {/* 3. Three-step progress strip */}
          <ProgressStrip tonightDonation={tonightDonation} mealSlot={activeMealSlot} />

          {/* 4. Recent donations list */}
          <RecentDonationsList donations={providerDonations} />
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-5">
          <BillingConnectionSection
            provider={selectedProvider}
            billingConnection={selectedProvider.billingConnection}
            onOpenConnectModal={() => setIsConnectBillingModalOpen(true)}
            onSyncBilling={handleSyncBilling}
            onDisconnectBilling={handleDisconnectBilling}
            onToggleAutoFill={(enabled) => toggleAutoFillSoldQty(selectedProvider.id, enabled)}
          />

          <MealWindowsCard
            provider={selectedProvider}
            onSave={(newWindows) => {
              updateProviderMealWindows(selectedProvider.id, newWindows);
            }}
          />
        </div>
      )}

      {activeTab === 'impact' && (
        /* Impact Tab */
        <ProviderImpactTab provider={selectedProvider} metrics={metrics} donations={providerDonations} />
      )}

      {/* Sheets & Drawers */}
      <AmountStepperSheet initialAmount={surplusPortions} isOpen={isStepperOpen} onClose={() => setIsStepperOpen(false)} onSave={(amt) => setCustomSurplus(amt)} mealSlot={activeMealSlot} />
      <MissingDefaultsSheet
        isOpen={isMissingDefaultsOpen}
        onClose={() => setIsMissingDefaultsOpen(false)}
        currentDefaults={defaults}
        onSaveDefaults={(d) => updateProviderDefaults(selectedProvider.id, d)}
      />
      <DeadlineEditSheet
        isOpen={isDeadlineOpen}
        onClose={() => setIsDeadlineOpen(false)}
        currentDeadline={deadlineInfo.time24}
        onSaveDeadline={(t) => setCustomDeadlineTime(t)}
      />
      <ProviderDemoDrawer
        isOpen={isDemoDrawerOpen}
        onClose={() => setIsDemoDrawerOpen(false)}
        provider={selectedProvider}
        providers={providers}
        onSelectProvider={setSelectedProviderId}
        isPosConnected={isPosConnected}
        onTogglePos={() => setIsPosConnected(!isPosConnected)}
        posTransactions={posTx}
        posTotalSoldPortions={posTotals.totalPortions}
        predictedSurplus={predicted}
        historyRecords={history}
        onApplyPrediction={(p) => setCustomSurplus(p)}
        tonightDonation={tonightDonation}
        onResetData={resetAllData}
        mealSlot={activeMealSlot}
      />
      <ConnectBillingModal
        isOpen={isConnectBillingModalOpen}
        onClose={() => setIsConnectBillingModalOpen(false)}
        onConnect={handleConnectBilling}
      />
    </div>
  );
};
