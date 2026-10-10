import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { CheckCircle2, TrendingUp } from 'lucide-react';
import { ImpactMetrics } from '../../types/surplusLink';

interface ImpactFunnelProps {
  metrics: ImpactMetrics;
  title?: string;
  subtitle?: string;
  entityName?: string;
  isProviderView?: boolean;
}

const STAGE_COLORS = {
  Donated: '#059669', // emerald-600
  Collected: '#0284c7', // sky-600
  Received: '#d97706', // amber-600
  Distributed: '#10b981', // emerald-500
};

export const ImpactFunnelCard: React.FC<ImpactFunnelProps> = ({
  metrics,
  title = 'Verified Food Impact Pipeline',
  subtitle = 'Tracking surplus through all four custody stages from donor confirmation to community feeding.',
  entityName,
  isProviderView = true,
}) => {
  const chartData = [
    { stage: 'Donated', portions: metrics.donated, fill: STAGE_COLORS.Donated, desc: 'Confirmed by kitchen' },
    { stage: 'Collected', portions: metrics.collected, fill: STAGE_COLORS.Collected, desc: 'Loaded into cargo van' },
    { stage: 'Received', portions: metrics.received, fill: STAGE_COLORS.Received, desc: 'Audited at NGO depot' },
    { stage: 'Distributed', portions: metrics.distributed, fill: STAGE_COLORS.Distributed, desc: 'Served to people' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs sm:shadow-sm p-4 sm:p-6 space-y-5 transition-all duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {entityName && (
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {entityName}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold self-start sm:self-auto">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>
            <strong>{metrics.successfulCollectionsCount}</strong> Successful Collection{metrics.successfulCollectionsCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex justify-between text-xs font-semibold uppercase text-slate-700 mb-1">
            <span>1. Donated</span>
            <span className="text-xs bg-white px-2 py-0.5 rounded-md font-mono border border-slate-200">confirmed</span>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold font-mono text-slate-900 tabular-nums">{metrics.donated}</div>
          <p className="text-xs text-slate-500 mt-1">Portions confirmed</p>
        </div>

        <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200/80">
          <div className="flex justify-between text-xs font-semibold uppercase text-sky-800 mb-1">
            <span>2. Collected</span>
            <span className="text-xs bg-white px-2 py-0.5 rounded-md font-mono border border-sky-200">on van</span>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold font-mono text-sky-950 tabular-nums">{metrics.collected}</div>
          <p className="text-xs text-sky-700 mt-1">Loaded on van</p>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
          <div className="flex justify-between text-xs font-semibold uppercase text-amber-800 mb-1">
            <span>3. Received</span>
            <span className="text-xs bg-white px-2 py-0.5 rounded-md font-mono border border-amber-200">at hub</span>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold font-mono text-amber-950 tabular-nums">{metrics.received}</div>
          <p className="text-xs text-amber-700 mt-1">Audited at depot</p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
          <div className="flex justify-between text-xs font-semibold uppercase text-emerald-800 mb-1">
            <span>4. Distributed</span>
            <span className="text-xs bg-emerald-200 px-2 py-0.5 rounded-md font-mono font-semibold">served</span>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold font-mono text-emerald-950 tabular-nums">{metrics.distributed}</div>
          <p className="text-xs text-emerald-800 mt-1 font-medium">Beneficiaries fed tonight</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Zero-Inflated Impact Guarantee:</strong> Only distributed portions count as meals served.
          </span>
        </div>
        {isProviderView && metrics.distributed > 0 && (
          <div className="text-xs text-emerald-800 font-semibold bg-emerald-100/70 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0 flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Your kitchen helped serve {metrics.distributed} meals!</span>
          </div>
        )}
      </div>

      <div className="pt-2">
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="stage" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white text-xs rounded-xl p-2.5 shadow-lg border border-slate-800 space-y-1">
                        <div className="font-semibold text-slate-100">{data.stage}</div>
                        <div className="text-emerald-400 font-mono text-sm font-bold">{data.portions} portions</div>
                        <div className="text-xs text-slate-400">{data.desc}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="portions" radius={[6, 6, 0, 0]} maxBarSize={64}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
