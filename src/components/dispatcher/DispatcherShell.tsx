import React, { useState } from 'react';
import { useSurplusLink } from '../../context/SurplusLinkContext';
import { runAllPlannerRuleTests, RuleTestResult } from '../../utils/plannerRuleTests';
import { generateCollectionPlan } from '../../utils/collectionPlanner';
import { CollectionPlan } from '../../types/surplusLink';
import { NgoMap } from '../NgoMap';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { StatusChip } from '../shared/StatusChip';
import {
  Compass,
  Play,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Sliders,
  Zap,
  MapPin,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '../shared/Toast';

export const DispatcherShell: React.FC = () => {
  const {
    ngo,
    providers,
    donations,
    loadScenario,
    resetAllData,
    plannerConfig,
  } = useSurplusLink();

  const toast = useToast();
  const [testResults, setTestResults] = useState<RuleTestResult[] | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [simulatedPlan, setSimulatedPlan] = useState<CollectionPlan | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState<'map_engine' | 'rule_tests' | 'scenarios'>('map_engine');

  // Trigger automated test runner
  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await runAllPlannerRuleTests(providers, ngo);
      setTestResults(results);
      const passedCount = results.filter((r) => r.passed).length;
      toast.success(`Ran all tests: ${passedCount}/${results.length} passed!`);
    } catch (err: any) {
      toast.error('Test suite failed: ' + err.message);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Run live algorithm simulation on current confirmed donations
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const confirmed = donations.filter((d) => d.status === 'Confirmed');
      const plan = await generateCollectionPlan(confirmed, providers, ngo, plannerConfig);
      setSimulatedPlan(plan);
      toast.success(`Simulation complete: ${plan.trips.length} circuit(s) planned, ${plan.totalDistanceSavedKm} km saved!`);
    } catch (err: any) {
      toast.error('Simulation error: ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  const confirmedDonations = donations.filter((d) => d.status === 'Confirmed');

  return (
    <div className="space-y-6">
      {/* Dispatcher Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <Compass className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-bold tracking-tight">
                Dispatcher & Algorithmic Router Console
              </h2>
              <span className="text-[11px] font-mono bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                HGS-Router v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              Inspect multi-stop greedy batching, evaluate van capacity limits (60 portions), verify food-safety arrival deadlines, and run automated rule test suites.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              icon={<Play className="h-3.5 w-3.5" />}
              onClick={handleRunSimulation}
              isLoading={isSimulating}
            >
              Run Batch Solver
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw className="h-3.5 w-3.5" />}
              onClick={resetAllData}
              className="!bg-slate-800 !text-slate-200 !border-slate-700 hover:!bg-slate-700"
            >
              Reset State
            </Button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 pt-5 border-t border-slate-800 mt-5">
          <button
            onClick={() => setActiveTab('map_engine')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'map_engine'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Campus Map & Engine
          </button>
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'scenarios'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Scenario Presets (1-Click)
          </button>
          <button
            onClick={() => setActiveTab('rule_tests')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'rule_tests'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Automated Rule Tests
          </button>
        </div>
      </div>

      {/* TAB 1: Campus Map & Engine */}
      {activeTab === 'map_engine' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* 1.5 km Campus Grid Map */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span className="font-semibold text-slate-900">1.5 km College Radius Network View</span>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">
                  {providers.length} Providers • {confirmedDonations.length} Active Donations
                </span>
              </div>
              <div className="h-[460px] w-full">
                <NgoMap
                  ngo={ngo}
                  providers={providers}
                  confirmedDonations={confirmedDonations}
                  trips={simulatedPlan ? simulatedPlan.trips : []}
                />
              </div>
            </div>

            {/* Provider Nodes Inspector */}
            <div className="lg:col-span-4 space-y-4">
              <Card
                title="Cluster Provider Nodes (15)"
                subtitle="Within 1.5 km of MIET Madurai"
              >
                <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 pr-1 text-xs">
                  {providers.map((p) => {
                    const activeDonation = donations.find(
                      (d) => d.providerId === p.id && d.status === 'Confirmed'
                    );
                    return (
                      <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="capitalize">{p.type.replace('_', ' ')}</span>
                            <span>•</span>
                            <span>{p.distanceKmFromCollege} km away</span>
                          </div>
                        </div>
                        <div>
                          {activeDonation ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[11px]">
                              {activeDonation.confirmedPortions}p
                            </span>
                          ) : p.isSkippedTonight ? (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[11px]">
                              Skipped
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded text-[11px]">
                              Idle
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>

          {/* Algorithmic Execution Breakdown */}
          {simulatedPlan && (
            <Card
              title="Algorithmic Batching Output"
              subtitle="Step-by-step optimization decisions computed across active candidate donations"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Portions</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">{simulatedPlan.totalPortions}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Circuit Distance</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">{simulatedPlan.totalDistanceKm} km</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-950">
                    <span className="text-emerald-700 block text-[10px] uppercase font-bold">Distance Saved</span>
                    <span className="text-lg font-bold text-emerald-800 font-mono">
                      {simulatedPlan.totalDistanceSavedKm} km ({simulatedPlan.totalDistanceSavedPercent}%)
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Trips Planned</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">{simulatedPlan.trips.length}</span>
                  </div>
                </div>

                {/* Excluded Donations (Safety / Timing) */}
                {simulatedPlan.excludedDonations.length > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                    <div className="font-bold text-amber-900 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-amber-700" />
                      <span>Excluded by Food-Safety Rules ({simulatedPlan.excludedDonations.length})</span>
                    </div>
                    <div className="divide-y divide-amber-200/60">
                      {simulatedPlan.excludedDonations.map((ex) => (
                        <div key={ex.donationId} className="py-2 flex items-center justify-between">
                          <div>
                            <strong className="text-amber-950">{ex.providerName}</strong>: {ex.reasonLabel}
                            <span className="block text-slate-600 text-[11px]">{ex.detail}</span>
                          </div>
                          <span className="font-mono text-amber-800 font-bold">{ex.portions} portions</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: Scenario Presets */}
      {activeTab === 'scenarios' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Scenario 1 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Capacity Splitting (65 Meals)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Loads 5 confirmed food donors totaling 65 portions. Since van capacity is 60, the solver must split the stops into 2 separate multi-stop circuits.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => {
                loadScenario(1);
                toast.success('Loaded Scenario 1: Capacity Splitting');
                setActiveTab('map_engine');
              }}
            >
              Load Scenario 1
            </Button>
          </div>

          {/* Scenario 2 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Safety Window Expiry
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Loads donors where one dairy sweet item has an ultra-tight 10-minute expiry deadline. Demonstrates Rule 2 safety audit filtering out uncollectible items.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => {
                loadScenario(2);
                toast.success('Loaded Scenario 2: Safety Window Expiry');
                setActiveTab('map_engine');
              }}
            >
              Load Scenario 2
            </Button>
          </div>

          {/* Scenario 3 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Sub-Threshold Hold (15 Meals)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Loads a single 15-meal surplus below the 20-meal economic dispatch threshold. Enforces Rule 1 holding the trip until evening kitchen closures add more.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => {
                loadScenario(3);
                toast.success('Loaded Scenario 3: Sub-Threshold Hold');
                setActiveTab('map_engine');
              }}
            >
              Load Scenario 3
            </Button>
          </div>
        </div>
      )}

      {/* TAB 3: Automated Rule Tests */}
      {activeTab === 'rule_tests' && (
        <Card
          title="Automated Business Rule Test Suite"
          subtitle="Verifies mathematical correctness of Rule 1, Rule 2, and Vehicle Capacity constraints"
          action={
            <Button
              variant="primary"
              size="sm"
              icon={<Play className="h-3.5 w-3.5" />}
              onClick={handleRunTests}
              isLoading={isRunningTests}
            >
              Run All Tests
            </Button>
          }
        >
          <div className="space-y-4">
            {!testResults ? (
              <div className="text-center py-8 text-xs text-slate-400 space-y-2">
                <Zap className="h-8 w-8 text-slate-300 mx-auto" />
                <p>Click "Run All Tests" to execute the 4-part automated verification suite.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {testResults.map((t) => (
                  <div
                    key={t.id}
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      t.passed ? 'bg-emerald-50/40 border-emerald-200' : 'bg-red-50/40 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {t.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                      </div>
                      <StatusChip variant={t.passed ? 'done' : 'failed'}>
                        {t.passed ? 'PASS' : 'FAIL'}
                      </StatusChip>
                    </div>
                    <p className="text-slate-600 text-xs">{t.description}</p>
                    <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/80 font-mono text-[11px] space-y-1">
                      <div><strong className="text-slate-700">Expected:</strong> {t.expected}</div>
                      <div><strong className="text-slate-700">Actual:</strong> {t.actual}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
