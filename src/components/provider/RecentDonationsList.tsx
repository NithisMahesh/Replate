import React, { useState } from 'react';
import { FoodDonation } from '../../types/surplusLink';
import { Clock, UtensilsCrossed, ChevronDown, ChevronUp } from 'lucide-react';
import { StatusChip } from '../shared/StatusChip';
import { Card } from '../shared/Card';
import { DonationTimeline } from '../shared/DonationTimeline';
import { useSurplusLink } from '../../context/SurplusLinkContext';

interface RecentDonationsListProps {
  donations: FoodDonation[];
  /** Show skeleton rows while data is loading */
  isLoading?: boolean;
}

/** Relative or absolute date label */
function formatDate(iso: string): string {
  if (!iso) return 'Today';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return 'Recent';
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    // Show relative time for today
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return 'Today';
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

/** Skeleton rows while loading */
const SkeletonRow: React.FC = () => (
  <div className="py-3 flex items-center gap-3 animate-pulse first:pt-1 last:pb-1">
    <div className="w-8 h-8 rounded-lg bg-slate-200 shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 w-24 bg-slate-200 rounded" />
      <div className="h-2 w-16 bg-slate-100 rounded" />
    </div>
    <div className="h-5 w-14 bg-slate-100 rounded-full" />
  </div>
);

export const RecentDonationsList: React.FC<RecentDonationsListProps> = ({
  donations,
  isLoading = false,
}) => {
  const recentFive = donations.slice(0, 5);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { eventLog } = useSurplusLink();

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <Card
      title="Recent donations"
      subtitle="Last 5 records"
      action={<span className="text-xs text-slate-500">{recentFive.length} entries</span>}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="divide-y divide-slate-100">
          {[1, 2, 3].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && recentFive.length === 0 && (
        <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
            <UtensilsCrossed className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500 font-medium">No donations yet</p>
          <p className="text-xs text-slate-400 max-w-[200px]">
            Confirm your first surplus above to see history here.
          </p>
        </div>
      )}

      {/* Donation rows — icon + qty + chip + time only; tap to expand timeline */}
      {!isLoading && recentFive.length > 0 && (
        <div className="divide-y divide-slate-100">
          {recentFive.map((d) => {
            const isOpen = expandedId === d.id;
            return (
              <div key={d.id}>
                {/* Summary row — tap to expand */}
                <button
                  type="button"
                  id={`recent-donation-row-${d.id}`}
                  onClick={() => toggleExpand(d.id)}
                  className="w-full py-3 flex items-center gap-3 text-left min-h-[52px] hover:bg-slate-50 transition-colors rounded-lg px-1 -mx-1 cursor-pointer"
                  aria-expanded={isOpen}
                  aria-controls={`timeline-${d.id}`}
                >
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <UtensilsCrossed className="h-4 w-4 text-slate-500" />
                  </div>

                  {/* Qty + food item */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 tabular-nums">
                      {d.confirmedPortions} portions
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>{formatDate(d.createdAt)}</span>
                    </div>
                  </div>

                  {/* Status chip */}
                  <StatusChip status={d.status} />

                  {/* Expand chevron */}
                  <div className="shrink-0 text-slate-400">
                    {isOpen
                      ? <ChevronUp className="h-4 w-4" />
                      : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {/* Expanded timeline — same data the NGO sees */}
                {isOpen && (
                  <div id={`timeline-${d.id}`} className="pb-3 animate-in fade-in slide-in-from-top-1">
                    <DonationTimeline donation={d} events={eventLog} compact={false} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
