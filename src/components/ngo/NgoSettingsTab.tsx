import React, { useState, useEffect } from 'react';
import { useSurplusLink } from '../../context/SurplusLinkContext';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { useToast } from '../shared/Toast';
import { DEFAULT_PLANNER_CONFIG } from '../../config/plannerConfig';
import { ShieldCheck, Clock, RotateCcw, Check, MapPin } from 'lucide-react';
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

  useEffect(() => {
    setServiceRadiusKm(ngo.serviceRadiusKm ?? 5.0);
  }, [ngo.serviceRadiusKm]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateNgoSettings({ serviceRadiusKm });
    updatePlannerConfig({
      minViablePortions,
      handlingTimePerStopMins: handlingTime,
      finalHandoverBufferMins: handoverBuffer,
      cityTrafficSpeedKmh: trafficSpeed,
      vanCapacityPortions: vanCapacity,
    });
    toast.success('Updated NGO collection planner and service radius settings!');
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
                onChange={(e) => setServiceRadiusKm(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                className="w-32 px-3 py-2 text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
              <span className="text-xs font-medium text-slate-600">km radius (default: 5 km)</span>
            </div>
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
                max="60"
                value={minViablePortions}
                onChange={(e) => setMinViablePortions(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-32 px-3 py-2 text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
              <span className="text-xs font-medium text-slate-600">meals per trip (default: 20)</span>
            </div>
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
                    max="30"
                    value={handlingTime}
                    onChange={(e) => setHandlingTime(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 px-3 py-2 text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                  <span className="text-xs text-slate-500">min (default: 5)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Final Handover Buffer at NGO
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={handoverBuffer}
                    onChange={(e) => setHandoverBuffer(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 px-3 py-2 text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                  <span className="text-xs text-slate-500">min (default: 10)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Fallback City Traffic Speed
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="60"
                    value={trafficSpeed}
                    onChange={(e) => setTrafficSpeed(Math.max(10, parseInt(e.target.value) || 25))}
                    className="w-24 px-3 py-2 text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                  <span className="text-xs text-slate-500">km/h (default: 25)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Cargo Van Capacity
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="20"
                    max="150"
                    value={vanCapacity}
                    onChange={(e) => setVanCapacity(Math.max(20, parseInt(e.target.value) || 60))}
                    className="w-24 px-3 py-2 text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                  <span className="text-xs text-slate-500">portions (default: 60)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Check className="h-4 w-4" />}
            >
              Save Settings
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
