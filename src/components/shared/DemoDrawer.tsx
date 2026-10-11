import React, { useState } from 'react';
import { useSurplusLink } from '../../context/SurplusLinkContext';
import { runDataIntegrityChecks, DataIntegrityResult } from '../../selectors';
import {
  X,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Building2,
  Store,
  HeartHandshake,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from './Toast';

interface DemoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoDrawer: React.FC<DemoDrawerProps> = ({ isOpen, onClose }) => {
  const {
    state,
    session,
    switchDemoAccount,
    providers,
    approveProvider,
    loadScenario,
    resetAllData,
  } = useSurplusLink();

  const [checkResult, setCheckResult] = useState<DataIntegrityResult | null>(null);
  const toast = useToast();

  if (!isOpen) return null;

  const handleSwitch = (email: string) => {
    switchDemoAccount(email);
    toast.success(`Switched session to ${email}`);
    onClose();
  };

  const handleApprove = (providerId: string, name: string) => {
    approveProvider(providerId);
    toast.success(`Approved "${name}"! Donations now enabled.`);
  };

  const handleRunChecks = () => {
    const result = runDataIntegrityChecks(state);
    setCheckResult(result);
    if (result.passed) {
      toast.success('All data integrity checks passed! State is consistent.');
    } else {
      toast.error('Integrity checks detected inconsistencies in state.');
    }
  };

  const pendingProviders = providers.filter((p) => p.isApproved === false);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm sm:max-w-md bg-white h-full shadow-2xl flex flex-col p-6 space-y-5 overflow-y-auto animate-in slide-in-from-right duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              DT
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Presenter Demo Tools</h3>
              <p className="text-[11px] text-slate-500">Quick role switcher & judge admin controls</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Active Session */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Currently Logged In As
          </span>
          {session ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">{session.entityName}</div>
                <div className="text-slate-500 font-mono text-[11px]">{session.email}</div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  session.role === 'provider'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {session.role}
              </span>
            </div>
          ) : (
            <div className="text-slate-500 italic">No active session (Signed out)</div>
          )}
        </div>

        {/* 1. Fast Demo Account Switcher */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Switch Demo Account:
          </span>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => handleSwitch('bakery@demo.com')}
              className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                session?.email === 'bakery@demo.com'
                  ? 'border-amber-400 bg-amber-50/80 ring-1 ring-amber-400 shadow-2xs'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                  <Store className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">Sri Krishna Bakes</div>
                  <div className="text-[11px] text-slate-500 font-mono">bakery@demo.com</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                Provider
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitch('mess@demo.com')}
              className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                session?.email === 'mess@demo.com'
                  ? 'border-amber-400 bg-amber-50/80 ring-1 ring-amber-400 shadow-2xs'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">Kaveri Boys Hostel Mess</div>
                  <div className="text-[11px] text-slate-500 font-mono">mess@demo.com</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                Provider
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitch('ngo@demo.com')}
              className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                session?.email === 'ngo@demo.com'
                  ? 'border-emerald-500 bg-emerald-50/80 ring-1 ring-emerald-500 shadow-2xs'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <HeartHandshake className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">Annam Seva Trust Depot</div>
                  <div className="text-[11px] text-slate-500 font-mono">ngo@demo.com</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                NGO Hub
              </span>
            </button>
          </div>
        </div>

        {/* 2. Admin Provider Approvals */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Business Approvals:
            </span>
            {pendingProviders.length > 0 && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                {pendingProviders.length} Pending
              </span>
            )}
          </div>

          {pendingProviders.length === 0 ? (
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>All registered providers are approved.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingProviders.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-900 truncate">{p.name}</div>
                    <div className="text-[10px] text-amber-800">Pending Admin Approval</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApprove(p.id, p.name)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Scenario Presets */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Load Test Scenarios:
          </span>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                loadScenario(1);
                toast.info('Loaded Scenario 1: 65 meals (splits trip)');
                onClose();
              }}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold text-slate-700 text-center cursor-pointer"
            >
              <div className="font-bold text-slate-900">Scenario 1</div>
              <div className="text-[10px] text-slate-500">65 Meals Cap</div>
            </button>
            <button
              type="button"
              onClick={() => {
                loadScenario(2);
                toast.info('Loaded Scenario 2: Expiry filter');
                onClose();
              }}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold text-slate-700 text-center cursor-pointer"
            >
              <div className="font-bold text-slate-900">Scenario 2</div>
              <div className="text-[10px] text-slate-500">Expiry Filter</div>
            </button>
            <button
              type="button"
              onClick={() => {
                loadScenario(3);
                toast.info('Loaded Scenario 3: Sub-threshold hold');
                onClose();
              }}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold text-slate-700 text-center cursor-pointer"
            >
              <div className="font-bold text-slate-900">Scenario 3</div>
              <div className="text-[10px] text-slate-500">15m On Hold</div>
            </button>
          </div>
        </div>

        {/* 4. Data Integrity Guard (Dev-only) */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Data Integrity Guard:
            </span>
            {checkResult && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  checkResult.passed
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {checkResult.passed ? 'ALL CHECKS PASS' : 'CHECKS FAILED'}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleRunChecks}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Run Data Checks
          </button>

          {checkResult && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-[11px]">No double collection bookings</span>
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      checkResult.checks.noDoubleBookings.passed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {checkResult.checks.noDoubleBookings.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-[11px]">No scheduled surplus in plan pool</span>
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      checkResult.checks.noScheduledInPool.passed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {checkResult.checks.noScheduledInPool.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-[11px]">Non-negative & valid lifecycle</span>
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      checkResult.checks.quantitiesValid.passed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {checkResult.checks.quantitiesValid.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-[11px]">Totals equal sum of their parts</span>
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      checkResult.checks.totalsBalanced.passed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {checkResult.checks.totalsBalanced.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>

              {!checkResult.passed && checkResult.errors && checkResult.errors.length > 0 && (
                <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                    <span>Failures ({checkResult.errors.length}):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-rose-800 max-h-36 overflow-y-auto">
                    {checkResult.errors.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Reset All Demo Data */}
        <div className="pt-auto border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => {
              resetAllData();
              toast.info('Reset demo data to initial state');
              onClose();
            }}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4 text-slate-500" />
            Reset State to Initial Defaults
          </button>
        </div>
      </div>
    </div>
  );
};
