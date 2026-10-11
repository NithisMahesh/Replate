import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSurplusLink } from '../context/SurplusLinkContext';
import { HeartHandshake, ArrowLeft, AlertCircle, Sparkles, Mail, Lock, Truck, Users, Phone, MapPin } from 'lucide-react';

export const NgoLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, registerNgo, session } = useSurplusLink();

  // Redirect if already logged in as NGO
  React.useEffect(() => {
    if (session) {
      if (session.role === 'ngo') {
        navigate('/ngo', { replace: true });
      } else {
        navigate('/provider', { replace: true });
      }
    }
  }, [session, navigate]);

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // NGO Registration Fields
  const [regName, setRegName] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regVanCapacity, setRegVanCapacity] = useState(60);
  const [regNightlyPeopleFed, setRegNightlyPeopleFed] = useState(80);
  const [regContactPerson, setRegContactPerson] = useState('');
  const [regPhone, setRegPhone] = useState('+91 94430 ');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = login(email, password, 'ngo');
    if (!res.success) {
      setError(res.error || 'Failed to sign in');
      return;
    }
    navigate('/ngo');
  };

  const handleUseDemo = () => {
    setEmail('ngo@demo.com');
    setPassword('demo123');
    setError(null);
    const res = login('ngo@demo.com', 'demo123', 'ngo');
    if (res.success) {
      navigate('/ngo');
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

    const res = registerNgo({
      name: regName.trim(),
      address: regAddress.trim(),
      vanCapacity: regVanCapacity,
      nightlyPeopleFed: regNightlyPeopleFed,
      contactPerson: regContactPerson.trim() || 'Logistics Coordinator',
      phone: regPhone.trim(),
      email: regEmail.trim(),
      password: regPassword,
    });

    if (!res.success) {
      setError(res.error || 'Registration failed');
      return;
    }

    navigate('/ngo');
  };

  return (
    <div className="min-h-screen bg-emerald-50/40 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-emerald-200/60 bg-white/80 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Portal Selection</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
              NGO Logistics Portal
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-10">
        <div className="w-full max-w-md bg-white rounded-3xl border-2 border-emerald-200 shadow-xl overflow-hidden transition-all duration-200">
          {/* Top Emerald Brand Accent */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 sm:p-7 text-white space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold shadow-xs">
              <HeartHandshake className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {isRegistering ? 'Register Your NGO Depot' : 'Collect surplus food efficiently'}
            </h1>
            <p className="text-xs font-medium text-emerald-100 leading-relaxed">
              {isRegistering
                ? 'Join Annam Seva Trust in receiving batched food donations across Madurai.'
                : 'Sign in to review automated collection batches, dispatch cargo vans, and audit meals served.'}
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
                  <label className="block font-bold text-slate-700">NGO Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. ngo@demo.com"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
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
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
                    />
                    <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer"
                >
                  Sign In to NGO Depot
                </button>

                {/* Quick Demo Credentials */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Demo NGO Hub Account:
                  </span>
                  <button
                    type="button"
                    onClick={handleUseDemo}
                    className="w-full p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-left transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Annam Seva Trust (3 km)</div>
                      <div className="text-[10px] text-emerald-800 font-mono">ngo@demo.com • demo123</div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                      Use demo account
                    </span>
                  </button>
                </div>

                {/* Register Link */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setError(null);
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                  >
                    Register your NGO
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                {/* NGO Name */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">NGO Trust / Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Madurai Food Relief Foundation"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Depot Hub Address *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      placeholder="e.g. 14/B Sellur Bridge Road, Madurai"
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
                    />
                    <MapPin className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* Van Capacity & Nightly Target */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 flex items-center gap-1">
                      <Truck className="h-3 w-3 text-emerald-600" />
                      <span>Van Capacity *</span>
                    </label>
                    <input
                      type="number"
                      min="20"
                      max="150"
                      value={regVanCapacity}
                      onChange={(e) => setRegVanCapacity(parseInt(e.target.value) || 60)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
                    />
                    <span className="text-[10px] text-slate-500">portions (default: 60)</span>
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 flex items-center gap-1">
                      <Users className="h-3 w-3 text-emerald-600" />
                      <span>Nightly Target *</span>
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="500"
                      value={regNightlyPeopleFed}
                      onChange={(e) => setRegNightlyPeopleFed(parseInt(e.target.value) || 80)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
                    />
                    <span className="text-[10px] text-slate-500">meals needed (default: 80)</span>
                  </div>
                </div>

                {/* Contact Person & Phone */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">Contact Person *</label>
                    <input
                      type="text"
                      value={regContactPerson}
                      onChange={(e) => setRegContactPerson(e.target.value)}
                      placeholder="Trustee / Dispatcher"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">Contact Phone *</label>
                    <input
                      type="text"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
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
                      placeholder="ngo@organization.org"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
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
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer mt-2"
                >
                  Complete NGO Registration
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
                    Already registered? Sign in
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
