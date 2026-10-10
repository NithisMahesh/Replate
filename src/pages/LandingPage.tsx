import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSurplusLink } from '../context/SurplusLinkContext';
import { Store, HeartHandshake, ArrowRight, ShieldCheck, Sparkles, Truck, UtensilsCrossed } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useSurplusLink();

  // If already logged in, redirect immediately
  React.useEffect(() => {
    if (session) {
      if (session.role === 'provider') {
        navigate('/provider', { replace: true });
      } else if (session.role === 'ngo') {
        navigate('/ngo', { replace: true });
      }
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs shadow-emerald-600/30">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                NourishRoute
              </span>
              <span className="text-[10px] text-slate-500 block leading-tight">
                Smart Food Redistribution
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="hidden sm:inline text-slate-500">Madurai Campus Cluster Pilot</span>
            <span className="bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
              Active Network
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col items-center justify-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold mb-6">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>Connecting 15 campus food providers with nightly NGO feeding operations</span>
        </div>

        {/* Headline & Value Proposition */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl leading-tight">
          Batching hyper-local surplus food into single, optimized collection circuits.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
          Eliminate kitchen food waste with verified handover OTPs, automated route planning, and strict temperature safety deadlines.
        </p>

        {/* Two Large Portal Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl text-left">
          {/* Card 1: Food Provider */}
          <button
            type="button"
            onClick={() => navigate('/login/provider')}
            className="group relative bg-white rounded-3xl border-2 border-amber-200/80 hover:border-amber-500 p-7 sm:p-8 shadow-xs hover:shadow-xl transition-all duration-200 text-left flex flex-col justify-between cursor-pointer overflow-hidden focus:outline-hidden focus:ring-4 focus:ring-amber-500/20"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full pointer-events-none -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-200" />
            <div className="relative space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
                <Store className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Bakeries • Restaurants • Messes
                </span>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  I'm a Food Provider
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Donate your nightly surplus in 30 seconds. Automatic portion estimation from POS registers and verified driver pickup OTPs.
                </p>
              </div>
            </div>

            <div className="pt-8 flex items-center justify-between text-sm font-bold text-amber-800 group-hover:text-amber-950">
              <span>Sign in as Food Provider</span>
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-200">
                <ArrowRight className="h-4 w-4 text-amber-900" />
              </div>
            </div>
          </button>

          {/* Card 2: NGO Operations */}
          <button
            type="button"
            onClick={() => navigate('/login/ngo')}
            className="group relative bg-white rounded-3xl border-2 border-emerald-200/80 hover:border-emerald-600 p-7 sm:p-8 shadow-xs hover:shadow-xl transition-all duration-200 text-left flex flex-col justify-between cursor-pointer overflow-hidden focus:outline-hidden focus:ring-4 focus:ring-emerald-500/20"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full pointer-events-none -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-200" />
            <div className="relative space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform duration-200">
                <HeartHandshake className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Logistics & Feeding Hubs
                </span>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  I'm an NGO
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Collect surplus food efficiently. Multi-stop OSRM routing, live cargo van manifests, and 4-stage verified community feeding metrics.
                </p>
              </div>
            </div>

            <div className="pt-8 flex items-center justify-between text-sm font-bold text-emerald-800 group-hover:text-emerald-950">
              <span>Sign in as NGO Depot</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-200">
                <ArrowRight className="h-4 w-4 text-emerald-900" />
              </div>
            </div>
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl pt-8 border-t border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Strict Food Safety & Arrival Deadlines</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Truck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Van Capacity-Aware Multi-Stop Routes</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Verified 4-Digit Handover OTP Codes</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          NourishRoute • Madurai Cluster Food Redistribution Network
        </div>
      </footer>
    </div>
  );
};
