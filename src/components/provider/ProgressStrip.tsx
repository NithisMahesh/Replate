import React from 'react';
import { FoodDonation } from '../../types/surplusLink';
import { CheckCircle2, Clock, Circle } from 'lucide-react';

interface ProgressStripProps {
  tonightDonation: FoodDonation | null;
}

export const ProgressStrip: React.FC<ProgressStripProps> = ({ tonightDonation }) => {
  const status = tonightDonation?.status;

  // Step 1: Confirmed
  const isStep1Done = Boolean(
    status && ['Confirmed', 'Scheduled', 'Collected', 'Received', 'Distributed'].includes(status)
  );

  // Step 2: Picked up
  const isStep2Done = Boolean(
    status && ['Collected', 'Received', 'Distributed'].includes(status)
  );
  const isStep2Active = status === 'Scheduled';

  // Step 3: Delivered
  const isStep3Done = Boolean(
    status && ['Received', 'Distributed'].includes(status)
  );
  const isStep3Active = status === 'Collected';

  const steps = [
    {
      label: 'Confirmed',
      done: isStep1Done,
      active: status === 'Confirmed',
      detail: tonightDonation ? `${tonightDonation.confirmedPortions} portions` : 'Ready',
    },
    {
      label: 'Picked up',
      done: isStep2Done,
      active: isStep2Active,
      detail: tonightDonation?.driverName ? `Driver assigned` : 'Van pickup',
    },
    {
      label: 'Delivered',
      done: isStep3Done,
      active: isStep3Active,
      detail: isStep3Done ? 'At shelter' : 'Depot delivery',
    },
  ];

  const getLineWidth = () => {
    if (isStep3Done) return '100%';
    if (isStep2Done) return '66%';
    if (isStep1Done) return '33%';
    return '0%';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs transition-all duration-150">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Tonight's Progress
      </div>
      <div className="grid grid-cols-3 gap-2 relative">
        {steps.map((step) => (
          <div key={step.label} className="flex flex-col items-center text-center relative z-10">
            {/* Step Icon */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 ${
                step.done
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : step.active
                  ? 'bg-sky-100 text-sky-700 border-2 border-sky-600'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : step.active ? (
                <Clock className="h-4 w-4" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
            </div>
            {/* Label */}
            <span
              className={`text-xs font-semibold mt-2 ${
                step.done
                  ? 'text-emerald-700'
                  : step.active
                  ? 'text-sky-700'
                  : 'text-slate-500'
              }`}
            >
              {step.label}
            </span>
            {/* Detail */}
            <span className="text-xs text-slate-500 mt-0.5 max-w-[100px] truncate">
              {step.detail}
            </span>
          </div>
        ))}

        {/* Progress Connecting Bars */}
        <div className="absolute top-4 left-[16%] right-[16%] h-0.5 bg-slate-200 z-0">
          <div
            className="h-full bg-emerald-600 transition-all duration-200"
            style={{ width: getLineWidth() }}
          />
        </div>
      </div>
    </div>
  );
};
