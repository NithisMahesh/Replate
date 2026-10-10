import React, { useState, useMemo } from 'react';
import { useSurplusLink } from '../../context/SurplusLinkContext';
import { donationsForProvider, providerImpact } from '../../selectors';
import { computePickupDeadline } from '../../utils/deadlineUtils';
import { getMockPOSTransactions, calculatePOSTotals, getProviderLast7Donations, calculateRollingAverageSurplus } from '../../utils/posAndPredictionUtils';
import { ProviderHeader } from './ProviderHeader';
import { TonightDonationCard } from './TonightDonationCard';
import { ProgressStrip } from './ProgressStrip';
import { RecentDonationsList } from './RecentDonationsList';
import { AmountStepperSheet } from './AmountStepperSheet';
import { MissingDefaultsSheet } from './MissingDefaultsSheet';
import { DeadlineEditSheet } from './DeadlineEditSheet';
import { ProviderDemoDrawer } from './ProviderDemoDrawer';
import { ProviderImpactTab } from './ProviderImpactTab';

export const ProviderShell: React.FC = () => {
  const {
    providers,
    selectedProvider,
    setSelectedProviderId,
    donations,
    addDonation,
    updateProviderDefaults,
    skipTonightDonation,
    unskipTonightDonation,
    resetAllData,
  } = useSurplusLink();

  const [activeTab, setActiveTab] = useState<'tonight' | 'impact'>('tonight');
  const [isStepperOpen, setIsStepperOpen] = useState(false);
  const [isMissingDefaultsOpen, setIsMissingDefaultsOpen] = useState(false);
  const [isDeadlineOpen, setIsDeadlineOpen] = useState(false);
  const [isDemoDrawerOpen, setIsDemoDrawerOpen] = useState(false);
  const [isPosConnected, setIsPosConnected] = useState(false);
  const [customSurplus, setCustomSurplus] = useState<number | null>(null);
  const [customDeadlineTime, setCustomDeadlineTime] = useState<string | null>(null);

  // Defaults & Math
  const defaults = selectedProvider.defaults;
  const prep = defaults?.usualPreparedQty ?? 80;
  const discards = defaults?.usualDiscardQty ?? 2;
  const posTx = useMemo(() => getMockPOSTransactions(selectedProvider), [selectedProvider]);
  const posTotals = useMemo(() => calculatePOSTotals(posTx), [posTx]);
  const sold = isPosConnected ? posTotals.totalPortions : (defaults?.usualSoldQty ?? 50);
  const calculatedSurplus = Math.max(1, prep - sold - discards);
  const surplusPortions = customSurplus !== null ? customSurplus : calculatedSurplus;

  // Deadline calculation
  const deadlineInfo = useMemo(() => {
    return computePickupDeadline(
      defaults?.category || 'bakery_bread',
      defaults?.storageType || 'room_temp',
      customDeadlineTime || defaults?.closingTime || selectedProvider.closingTime
    );
  }, [defaults, customDeadlineTime, selectedProvider.closingTime]);

  // Missing fields check
  const missingFields = [
    !defaults?.usualFoodItem && 'Food item',
    !defaults?.category && 'Category',
    !defaults?.storageType && 'Storage type',
  ].filter(Boolean) as string[];

  // Provider's donations & tonight's donation status
  const providerDonations = donationsForProvider({ donations }, selectedProvider.id);
  const tonightDonation = providerDonations.find((d) =>
    ['Confirmed', 'Scheduled', 'Collected', 'Received', 'Distributed'].includes(d.status)
  ) || null;

  // Rolling predictions
  const history = useMemo(() => getProviderLast7Donations(selectedProvider.id, donations), [selectedProvider.id, donations]);
  const predicted = useMemo(() => calculateRollingAverageSurplus(history), [history]);

  // Header status chip
  const isSkipped = Boolean(selectedProvider.isSkippedTonight);
  let statusText = 'Ready tonight';
  let statusVariant: 'ready' | 'scheduled' | 'collected' | 'delivered' | 'skipped' | 'idle' = 'idle';

  // Check for exclusion banner from tonight's donation or recent exclusion records
  const exclusionBanner = useMemo(() => {
    if (tonightDonation?.exclusionRecord) return tonightDonation.exclusionRecord;
    const withExclusion = providerDonations.find((d) => d.exclusionRecord);
    if (withExclusion?.exclusionRecord) return withExclusion.exclusionRecord;
    if (tonightDonation?.failureReason) {
      return {
        reasonLabel: 'Pickup Failed / Excluded',
        detail: tonightDonation.failureReason,
      };
    }
    return null;
  }, [tonightDonation, providerDonations]);

  if (isSkipped) {
    statusText = 'No surplus tonight';
    statusVariant = 'skipped';
  } else if (tonightDonation) {
    statusText = tonightDonation.status;
    if (tonightDonation.status === 'Confirmed') statusVariant = 'ready';
    else if (tonightDonation.status === 'Scheduled') statusVariant = 'scheduled';
    else if (tonightDonation.status === 'Collected') statusVariant = 'collected';
    else if (['Received', 'Distributed'].includes(tonightDonation.status)) statusVariant = 'delivered';
  }

  const handleConfirm = () => {
    addDonation({
      providerId: selectedProvider.id,
      providerName: selectedProvider.name,
      providerType: selectedProvider.type,
      foodItem: defaults?.usualFoodItem || 'Evening Surplus Meals',
      category: defaults?.category || 'bakery_bread',
      confirmedPortions: surplusPortions,
      portions: surplusPortions,
      preparedQty: prep,
      soldQty: sold,
      discardQty: discards,
      storageType: defaults?.storageType || 'room_temp',
      preparedTime: defaults?.closingTime || '21:00',
      collectionDeadline: deadlineInfo.formatted.replace('Pickup by ', ''),
      deadlineTimestamp: deadlineInfo.timestamp,
      dietary: 'veg',
      notes: `${selectedProvider.name} 1-touch verified evening surplus.`,
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

      {activeTab === 'tonight' ? (
        <div className="space-y-4">
          {/* 2. Primary Card */}
          <TonightDonationCard
            surplusPortions={surplusPortions}
            missingFields={missingFields}
            pickupDeadlineFormatted={deadlineInfo.formatted}
            onOpenDeadlineSheet={() => setIsDeadlineOpen(true)}
            calculation={{
              prepared: prep,
              sold,
              discards,
              source: isPosConnected ? 'Mock POS register feed (live)' : 'Saved usual production defaults',
            }}
            tonightDonation={tonightDonation}
            isSkippedTonight={isSkipped}
            onConfirm={handleConfirm}
            onChangeAmount={() => setIsStepperOpen(true)}
            onNoSurplusTonight={() => skipTonightDonation(selectedProvider.id)}
            onUnskip={() => unskipTonightDonation(selectedProvider.id)}
            onOpenMissingDetails={() => setIsMissingDefaultsOpen(true)}
            isApproved={selectedProvider.isApproved !== false}
            exclusionBanner={exclusionBanner}
          />

          {/* 3. Three-step progress strip */}
          <ProgressStrip tonightDonation={tonightDonation} />

          {/* 4. Recent donations list */}
          <RecentDonationsList donations={providerDonations} />
        </div>
      ) : (
        /* Impact Tab */
        <ProviderImpactTab provider={selectedProvider} metrics={metrics} donations={providerDonations} />
      )}

      {/* Sheets & Drawers */}
      <AmountStepperSheet initialAmount={surplusPortions} isOpen={isStepperOpen} onClose={() => setIsStepperOpen(false)} onSave={(amt) => setCustomSurplus(amt)} />
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
      />
    </div>
  );
};
