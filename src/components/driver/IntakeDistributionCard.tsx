import React, { useState } from 'react';
import { Collection } from '../../types/surplusLink';
import { CollectionTotals } from '../../selectors';
import { Package, HeartHandshake, CheckCircle2, Info } from 'lucide-react';

interface IntakeDistributionCardProps {
  activeCollection: Collection;
  totals: CollectionTotals;
  onRecordReceived: (collectionId: string, qty: number) => void;
  onRecordDistributed: (collectionId: string, qty: number, notes?: string) => void;
}

export const IntakeDistributionCard: React.FC<IntakeDistributionCardProps> = ({
  activeCollection,
  totals,
  onRecordReceived,
  onRecordDistributed,
}) => {
  const [isReceivedOpen, setIsReceivedOpen] = useState(false);
  const [receivedInput, setReceivedInput] = useState<number>(totals.totalCollectedPortions);
  const [isDistributedOpen, setIsDistributedOpen] = useState(false);
  const [distributedInput, setDistributedInput] = useState<number>(totals.totalReceivedPortions || totals.totalCollectedPortions);
  const [distNotes, setDistNotes] = useState('');

  const hasReceived = totals.totalReceivedPortions > 0;
  const hasDistributed = totals.totalDistributedPortions > 0;
  const undistributedPortions = Math.max(0, totals.totalReceivedPortions - totals.totalDistributedPortions);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Post-Collection Intake & Distribution Audit</h4>
            <p className="text-xs text-slate-500">
              Trip #{activeCollection.tripNumber} • Verify depot arrival & tally community meals served
            </p>
          </div>
        </div>

        {/* Audit Status Tag */}
        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
            hasDistributed
              ? 'bg-emerald-100 text-emerald-800'
              : hasReceived
              ? 'bg-amber-100 text-amber-800'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {hasDistributed ? 'Distributed to Community' : hasReceived ? 'Received at Depot' : 'Awaiting Hub Intake'}
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-lg">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">1. Confirmed</span>
          <span className="text-sm font-bold text-slate-800">{totals.totalConfirmedPortions} portions</span>
        </div>
        <div className="bg-sky-50 border border-sky-200/80 p-3 rounded-lg text-sky-900">
          <span className="text-sky-600 block text-[10px] uppercase font-bold">2. Van Collected</span>
          <span className="text-sm font-bold">{totals.totalCollectedPortions} portions</span>
        </div>
        <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-lg text-amber-900">
          <span className="text-amber-600 block text-[10px] uppercase font-bold">3. Depot Received</span>
          <span className="text-sm font-bold">{totals.totalReceivedPortions} portions</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-200/80 p-3 rounded-lg text-emerald-900">
          <span className="text-emerald-600 block text-[10px] uppercase font-bold">4. Meals Served</span>
          <span className="text-sm font-bold">{totals.totalDistributedPortions} portions</span>
        </div>
      </div>

      {/* Important Policy Note */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-[11px] text-slate-600 flex items-start gap-2">
        <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          <strong>Distribution Policy:</strong> Only portions actually distributed to beneficiaries are tallied as meals served. Undistributed portions ({undistributedPortions} portions) are held in temperature-controlled storage and not counted.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {!hasReceived ? (
          <button
            type="button"
            onClick={() => {
              setReceivedInput(totals.totalCollectedPortions);
              setIsReceivedOpen(true);
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Package className="h-4 w-4" />
            Record Quantity Received at Depot
          </button>
        ) : !hasDistributed ? (
          <button
            type="button"
            onClick={() => {
              setDistributedInput(totals.totalReceivedPortions);
              setIsDistributedOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <HeartHandshake className="h-4 w-4" />
            Record Meals Distributed Tonight
          </button>
        ) : (
          <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Distribution recorded! Providers notified: "Your donation helped provide meals today."
          </div>
        )}
      </div>

      {/* Modal 1: Record Received */}
      {isReceivedOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-slate-900">Record Depot Intake (Quantity Received)</h4>
            <div className="space-y-1.5 text-xs">
              <label className="block font-semibold text-slate-700">Portions Received at NGO Hub</label>
              <input
                type="number"
                min="0"
                value={receivedInput}
                onChange={(e) => setReceivedInput(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
              />
              <p className="text-[11px] text-slate-500">Collected on van: {totals.totalCollectedPortions} portions.</p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReceivedOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onRecordReceived(activeCollection.id, receivedInput);
                  setIsReceivedOpen(false);
                }}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Save Received Count
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Record Distributed */}
      {isDistributedOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-slate-900">Record Community Meals Distributed</h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Meals Served to Beneficiaries</label>
                <input
                  type="number"
                  min="0"
                  max={totals.totalReceivedPortions}
                  value={distributedInput}
                  onChange={(e) => setDistributedInput(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                />
                <p className="text-[11px] text-slate-500">Depot intake: {totals.totalReceivedPortions} portions.</p>
              </div>
              <div>
                <label className="block font-semibold text-slate-700">Distribution Notes (Optional)</label>
                <input
                  type="text"
                  value={distNotes}
                  onChange={(e) => setDistNotes(e.target.value)}
                  placeholder="e.g. Goripalayam shelter community distribution"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDistributedOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onRecordDistributed(activeCollection.id, distributedInput, distNotes);
                  setIsDistributedOpen(false);
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Confirm Distribution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
