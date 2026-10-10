import React from 'react';
import { FoodDonation } from '../../types/surplusLink';
import { Clock } from 'lucide-react';
import { StatusChip } from '../shared/StatusChip';
import { Card } from '../shared/Card';

interface RecentDonationsListProps {
  donations: FoodDonation[];
}

export const RecentDonationsList: React.FC<RecentDonationsListProps> = ({ donations }) => {
  const recentFive = donations.slice(0, 5);

  const formatDate = (iso: string) => {
    if (!iso) return 'Today';
    const date = new Date(iso);
    if (isNaN(date.getTime())) return 'Recent';
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  return (
    <Card
      title="Recent donations"
      subtitle="Last 5 records"
      action={<span className="text-xs text-slate-500">{recentFive.length} entries</span>}
    >
      {recentFive.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
          <Clock className="h-5 w-5 text-slate-400" />
          <span>No previous donations yet for this provider.</span>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {recentFive.map((d) => (
            <div
              key={d.id}
              className="py-3 flex items-center justify-between gap-3 text-xs first:pt-1 last:pb-1"
            >
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 truncate">
                  <span className="font-bold text-slate-950">{d.confirmedPortions} portions</span>
                  <span className="text-slate-400 mx-1.5">•</span>
                  <span className="text-slate-600 font-normal">{d.foodItem}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {formatDate(d.createdAt)} • Deadline {d.collectionDeadline}
                </div>
              </div>
              <StatusChip status={d.status} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
