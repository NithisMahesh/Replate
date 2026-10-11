import React, { useState, useEffect } from 'react';
import { useSurplusLink } from '../../context/SurplusLinkContext';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { useToast } from '../shared/Toast';
import { DEFAULT_PLANNER_CONFIG } from '../../config/plannerConfig';
import { ShieldCheck, Clock, RotateCcw, Check, MapPin, AlertCircle } from 'lucide-react';
import { DonationQrCard } from './DonationQrCard';

export const NgoSettingsTab: React.FC = () => {
  const { ngo, updateNgoSettings, plannerConfig, updatePlannerConfig } = useSurplusLink();
  const toast = useToast();

  const [serviceRadiusKm, setServiceRadiusKm] = useState(ngo.serviceRadiusKm ?? 5.0);
  const [minViablePortions, setMinViablePortions] = useState(plannerConfig.minViablePortions);
  const [handlingTime, setHandlingTime] = useState(plannerConfig.handlingTimePerStopMins);
  const [handoverBuffer, setHandoverBuffer] = useState(plannerConfig.finalHandoverBufferMins);
  const [trafficSpeed, setTrafficSpeed] = useState(plannerConfig.cityTrafficSpeedKmh);
  const [vanCapacity, setVanCapacity] = useState(plannerConfig.vanCapacityPortions);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setServiceRadiusKm(ngo.serviceRadiusKm ?? 5.0);
  }, [ngo.serviceRadiusKm]);

  // Inline Validation while typing
  const radiusError =
    serviceRadiusKm < 0.5 || serviceRadiusKm > 50
      ? 'Radius must be between 0.5 and 50 km. Enter a valid distance.'
      : null;
  const minViableError =
    minViablePortions < 5 || minViablePortions > 100
      ? 'Threshold must be between 5 and 100 portions. Adjust quantity.'
      : null;
  const handlingError =
    handlingTime < 1 || handlingTime > 60
      ? 'Handling time must be between 1 and 60 minutes.'
      : null;
  const bufferError =
    handoverBuffer < 5 || handoverBuffer > 120
      ? 'Safety buffer must be between 5 and 120 minutes.'
      : null;
  const speedError =
    trafficSpeed < 5 || trafficSpeed > 60
      ? 'Traffic speed must be between 5 and 60 km/h.'
      : null;
  const capacityError =
    vanCapacity < 10 || vanCapacity > 200
      ? 'Van capacity must be between 10 and 200 portions.'
      : null;

  const hasErrors = Boolean(
    radiusError || minViableError || handlingError || bufferError || speedError || capacityError
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasErrors || isSaving) return;
    setIsSaving(true);
    try {
      updateNgoSettings({ serviceRadiusKm });
      updatePlannerConfig({
        minViablePortions,
        handlingTimePerStopMins: handlingTime,
        finalHandoverBufferMins: handoverBuffer,
        cityTrafficSpeedKmh: trafficSpeed,
        vanCapacityPortions: vanCapacity,
      });
      toast.success('Updated NGO collection planner and service radius settings!');
    } finally {
      setTimeout(() => setIsSaving(false), 300);
    }
  };

  const handleReset = () => {
    setServiceRadiusKm(5.0);
    updateNgoSettings({ serviceRadiusKm: 5.0 });
    setMinViablePortions(DEFAULT_PLANNER_CONFIG.minViablePortions);
    setHandlingTime(DEFAULT_PLANNER_CONFIG.handlingTimePerStopMins);
    setHandoverBuffer(DEFAULT_PLANNER_CONFIG.finalHandoverBufferMins);
    setTrafficSpeed(DEFAULT_PLANNER_CONFIG.cityTrafficSpeedKmh);
    setVanCapacity(DEFAULT_PLANNER_CONFIG.vanCapacityPortions);
    updatePlannerConfig(DEFAULT_PLANNER_CONFIG);
    toast.info('Reset planner and radius settings to defaults');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Public QR Flow Card */}
      <DonationQrCard />

      <Card
        title="Collection Planner & Business Rule Settings"
        subtitle="Configurable thresholds enforced across all automated collection circuits"
        action={
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={handleReset}
          >
            Reset Defaults
          </Button>
        }
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* NGO Hub & Service Area Settings */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <label htmlFor="service-radius" className="text-sm font-semibold text-slate-900">
                NGO Service Radius (serviceRadiusKm)
              </label>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              The NGO serves as the center hub ({ngo.name}). Donors within this radius are eligible for collection routing. Donors outside this radius are marked as &ldquo;Out of range&rdquo; and excluded.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <input
                id="service-radius"
                type="number"
                min="0.5"
                max="50"
                step="0.5"
                value={serviceRadiusKm}
                onChange={(e) => setServiceRadiusKm(parseFloat(e.target.value) || 0)}
                className={`w-32 px-3 py-2 text-sm font-bold bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 ${
                  radiusError ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
                aria-invalid={Boolean(radiusError)}
              />
              <span className="text-xs font-medium text-slate-600">km radius (default: 5 km)</span>
            </div>
            {radiusError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 pt-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{radiusError}</span>
              </div>
            )}
          </div>

          {/* RULE 1: Minimum Viable Quantity */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <label htmlFor="min-viable" className="text-sm font-semibold text-slate-900">
                Rule 1: Minimum Viable Quantity (MIN_VIABLE_PORTIONS)
              </label>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              A collection trip may be dispatched only if its grouped donations total at least this many meals. Trips below this threshold are held on hold until more donations arrive.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <input
                id="min-viable"
                type="number"
                min="1"
                max="100"
                value={minViablePortions}
                onChange={(e) => setMinViablePortions(parseInt(e.target.value) || 0)}
                className={`w-32 px-3 py-2 text-sm font-bold bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 ${
                  minViableError ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
                aria-invalid={Boolean(minViableError)}
              />
              <span className="text-xs font-medium text-slate-600">meals per trip (default: 20)</span>
            </div>
            {minViableError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 pt-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{minViableError}</span>
              </div>
            )}
          </div>

          {/* RULE 2: Food Safety Timing Parameters */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <h4 className="text-sm font-semibold text-slate-900">
                Rule 2: Food Safety & Travel Timing Parameters
              </h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Used to compute arrivalAtNgo = trip start + travel to stop + handling + remaining route to NGO + handover buffer.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Handling Time per Stop
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={handlingTime}
                    onChange={(e) => setHandlingTime(parseInt(e.target.value) || 0)}
                    className={`w-24 px-3 py-2 text-sm font-bold bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 ${
                      handlingError ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  />
                  <span className="text-xs text-slate-500">min (default: 5)</span>
                </div>
                {handlingError && (
                  <p className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {handlingError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Final Handover Buffer at NGO
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={handoverBuffer}
                    onChange={(e) => setHandoverBuffer(parseInt(e.target.value) || 0)}
                    className={`w-24 px-3 py-2 text-sm font-bold bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 ${
                      bufferError ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  />
                  <span className="text-xs text-slate-500">min (default: 10)</span>
                </div>
                {bufferError && (
                  <p className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {bufferError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Fallback City Traffic Speed
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={trafficSpeed}
                    onChange={(e) => setTrafficSpeed(parseInt(e.target.value) || 0)}
                    className={`w-24 px-3 py-2 text-sm font-bold bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 ${
                      speedError ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  />
                  <span className="text-xs text-slate-500">km/h (default: 25)</span>
                </div>
                {speedError && (
                  <p className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {speedError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Cargo Van Capacity
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={vanCapacity}
                    onChange={(e) => setVanCapacity(parseInt(e.target.value) || 0)}
                    className={`w-24 px-3 py-2 text-sm font-bold bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 ${
                      capacityError ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  />
                  <span className="text-xs text-slate-500">portions (default: 60)</span>
                </div>
                {capacityError && (
                  <p className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {capacityError}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
            {hasErrors && (
              <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Fix highlighted parameters above</span>
              </span>
            )}
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={hasErrors || isSaving}
              isLoading={isSaving}
              icon={<Check className="h-4 w-4" />}
              className="min-h-[44px] cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
