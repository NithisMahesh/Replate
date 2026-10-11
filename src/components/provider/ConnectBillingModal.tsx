import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, FileSpreadsheet, Terminal, Cpu, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../shared/Button';

interface ConnectBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (connectorName: string) => void;
}

type ConnectStep = 'choose' | 'authorize' | 'success';

interface ConnectorOption {
  id: string;
  name: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
}

const CONNECTORS: ConnectorOption[] = [
  {
    id: 'demo_pos',
    name: 'Demo POS',
    badge: 'Simulated POS',
    description: 'Simulated counter register with mock menu items, timestamps, and portions sold.',
    icon: <Terminal className="w-5 h-5 text-emerald-600" />,
  },
  {
    id: 'generic_csv',
    name: 'Generic CSV upload',
    badge: 'File Import',
    description: 'Upload daily batch sales data exported from your existing cash register or software.',
    icon: <FileSpreadsheet className="w-5 h-5 text-sky-600" />,
  },
  {
    id: 'other_custom',
    name: 'Other (request integration)',
    badge: 'Custom Bridge',
    description: 'Simulate API webhook integration for proprietary and unlisted POS systems.',
    icon: <Cpu className="w-5 h-5 text-purple-600" />,
  },
];

export const ConnectBillingModal: React.FC<ConnectBillingModalProps> = ({
  isOpen,
  onClose,
  onConnect,
}) => {
  const [selectedConnector, setSelectedConnector] = useState<string>('demo_pos');
  const [step, setStep] = useState<ConnectStep>('choose');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  if (!isOpen) return null;

  const currentConnector = CONNECTORS.find((c) => c.id === selectedConnector) || CONNECTORS[0];

  const handleStartAuthorize = () => {
    setStep('authorize');
  };

  const handlePerformAuthorize = () => {
    setIsAuthorizing(true);
    setTimeout(() => {
      setIsAuthorizing(false);
      setStep('success');
    }, 800);
  };

  const handleFinish = () => {
    onConnect(currentConnector.name);
    setStep('choose');
    onClose();
  };

  const handleModalClose = () => {
    setStep('choose');
    setIsAuthorizing(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-billing-modal-title"
    >
      <div
        className="bg-white rounded-2xl border border-slate-200/90 shadow-xl max-w-lg w-full overflow-hidden transition-all duration-150 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 id="connect-billing-modal-title" className="text-lg font-bold text-slate-900">
              {step === 'choose' && 'Connect Billing Software'}
              {step === 'authorize' && 'Authorize Demo Connection'}
              {step === 'success' && 'Connection Established'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === 'choose' && 'Select a demo connector to simulate sales syncing'}
              {step === 'authorize' && 'Simulate handshake and authentication'}
              {step === 'success' && 'Your software is ready to sync daily data'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Step 1: Choose connector */}
          {step === 'choose' && (
            <div className="space-y-3">
              <div className="space-y-2.5" role="radiogroup">
                {CONNECTORS.map((connector) => {
                  const isSelected = selectedConnector === connector.id;
                  return (
                    <div
                      key={connector.id}
                      onClick={() => setSelectedConnector(connector.id)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                          {connector.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-slate-900">{connector.name}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {connector.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {connector.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-800">
                Notice: All connectors listed here are simulation bridges. Replate does not require direct credentials for proprietary vendors.
              </div>
            </div>
          )}

          {/* Step 2: Authorize */}
          {step === 'authorize' && (
            <div className="py-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 mx-auto flex items-center justify-center">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="text-base font-bold text-slate-900">
                  Authorize {currentConnector.name}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Allow Replate to securely read sales logs and portion counts to auto-fill your daily surplus calculation.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 max-w-sm mx-auto">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Connector:</span>
                  <span className="font-semibold text-slate-800">{currentConnector.name}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Scope:</span>
                  <span className="font-semibold text-slate-800">Read portions sold (read-only)</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Simulation status:</span>
                  <span className="font-semibold text-emerald-700">Sandbox Verified</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="py-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-in zoom-in-75">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="text-base font-bold text-slate-900">
                  Successfully Connected!
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your account is now linked to <strong>{currentConnector.name}</strong>. Daily sold portions can sync directly into your surplus math.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-left flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Automatic sync is armed. You can sync anytime from Today or Billing.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {step === 'choose' && (
            <>
              <button
                type="button"
                onClick={handleModalClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <Button
                type="button"
                id="btn-continue-billing-connector"
                variant="primary"
                size="md"
                onClick={handleStartAuthorize}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Continue
              </Button>
            </>
          )}

          {step === 'authorize' && (
            <>
              <button
                type="button"
                onClick={() => setStep('choose')}
                disabled={isAuthorizing}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <Button
                type="button"
                id="btn-authorize-billing-connection"
                variant="primary"
                size="md"
                disabled={isAuthorizing}
                onClick={handlePerformAuthorize}
                icon={isAuthorizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              >
                {isAuthorizing ? 'Authorizing...' : 'Authorize & Connect'}
              </Button>
            </>
          )}

          {step === 'success' && (
            <div className="w-full flex justify-end">
              <Button
                type="button"
                id="btn-finish-billing-connection"
                variant="primary"
                size="md"
                onClick={handleFinish}
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
