import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSurplusLink } from '../context/SurplusLinkContext';
import { Store, ArrowLeft, AlertCircle, CheckCircle2, Sparkles, Building2, Utensils, Lock, Mail, Clock, MapPin, Phone } from 'lucide-react';
import { ProviderType } from '../types/surplusLink';

export const ProviderLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, registerProvider, session } = useSurplusLink();

  // Redirect if already logged in as provider
  React.useEffect(() => {
    if (session) {
      if (session.role === 'provider') {
        navigate('/provider', { replace: true });
      } else {
        navigate('/ngo', { replace: true });
      }
    }
  }, [session, navigate]);

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Registration Fields
  const [regName, setRegName] = useState('');
  const [regType, setRegType] = useState<ProviderType>('bakery');
  const [regAddress, setRegAddress] = useState('');
  const [regPhone, setRegPhone] = useState('+91 94431 ');
  const [regClosingTime, setRegClosingTime] = useState('21:30');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = login(email, password, 'provider');
    if (!res.success) {
      setError(res.error || 'Failed to sign in');
      return;
    }
    navigate('/provider');
  };

  const handleUseDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo123');
    setError(null);
    const res = login(demoEmail, 'demo123', 'provider');
    if (res.success) {
      navigate('/provider');
    } else {
      setError(res.error || 'Failed to sign in');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regName.trim() || !regAddress.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    const res = registerProvider({
      name: regName.trim(),
      type: regType,
      address: regAddress.trim(),
      phone: regPhone.trim(),
      closingTime: regClosingTime,
      email: regEmail.trim(),
      password: regPassword,
    });

    if (!res.success) {
      setError(res.error || 'Registration failed');
      return;
    }

    navigate('/provider');
  };

  return (
    <div className="min-h-screen bg-amber-50/40 flex flex-col justify-between selection:bg-amber-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-amber-200/60 bg-white/80 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Portal Selection</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
              Food Provider Portal
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-10">
        <div className="w-full max-w-md bg-white rounded-3xl border-2 border-amber-200 shadow-xl overflow-hidden transition-all duration-200">
          {/* Top Amber Brand Accent */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 sm:p-7 text-slate-950 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold shadow-xs">
              <Store className="h-6 w-6 text-slate-950" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              {isRegistering ? 'Register Your Business' : 'Donate your surplus in one tap'}
            </h1>
            <p className="text-xs font-medium text-amber-950/80 leading-relaxed">
              {isRegistering
                ? 'Join local food kitchens redirecting surplus to night feeding operations.'
                : 'Sign in to confirm tonight’s surplus, track driver pickup ETAs, and audit community impact.'}
            </p>
          </div>

          <div className="p-6 sm:p-7 space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            {!isRegistering ? (
              /* LOGIN FORM */
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. bakery@demo.com"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 bg-white"
                    />
                    <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 bg-white"
                    />
                    <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer"
                >
                  Sign In to Provider Portal
                </button>

                {/* Quick Demo Credentials */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Quick Demo Accounts:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleUseDemo('bakery@demo.com')}
                      className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-left transition-colors cursor-pointer"
                    >
                      <div className="font-bold text-slate-900 text-xs truncate">Sri Krishna Bakes</div>
                      <div className="text-[10px] text-amber-800 font-mono">bakery@demo.com</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUseDemo('mess@demo.com')}
                      className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-left transition-colors cursor-pointer"
                    >
                      <div className="font-bold text-slate-900 text-xs truncate">Kaveri Boys Mess</div>
                      <div className="text-[10px] text-amber-800 font-mono">mess@demo.com</div>
                    </button>
                  </div>
                </div>

                {/* Register Link */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setError(null);
                    }}
                    className="text-xs font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                  >
                    Register your business
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                {/* Business Name */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Business / Kitchen Name *</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Madurai Delight Bakery"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 bg-white"
                  />
                </div>

                {/* Type Selection */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Business Type *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'bakery', label: 'Bakery', icon: Store },
                      { id: 'restaurant', label: 'Restaurant', icon: Utensils },
                      { id: 'hostel_mess', label: 'Hostel Mess', icon: Building2 },
                    ].map((t) => {
                      const Icon = t.icon;
                      const isSelected = regType === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setRegType(t.id as ProviderType)}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-[11px]">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Address (Madurai service area) *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      placeholder="e.g. 14 Alagar Kovil Main Road, Madurai"
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 bg-white"
                    />
                    <MapPin className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* Phone & Closing Time */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">Contact Phone *</label>
                    <input
                      type="text"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">Closing Time *</label>
                    <input
                      type="time"
                      value={regClosingTime}
                      onChange={(e) => setRegClosingTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 bg-white"
                    />
                  </div>
                </div>

                {/* Email & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">Email *</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="owner@business.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">Password *</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create password"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                    <span>Approval Verification Notice</span>
                  </div>
                  <p>
                    New businesses are initially marked <strong>"Pending approval"</strong> to protect food safety. Once verified by admin, you can publish surplus.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer mt-2"
                >
                  Submit Registration
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(false);
                      setError(null);
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Already have an account? Sign in
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        Replate Food Redistribution • Madurai, Tamil Nadu
      </footer>
    </div>
  );
};
