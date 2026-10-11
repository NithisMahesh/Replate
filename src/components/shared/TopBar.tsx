import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSurplusLink } from '../../context/SurplusLinkContext';
import { Bell, X, CheckCircle2, AlertTriangle, Info, LogOut, SlidersHorizontal, UtensilsCrossed, Store, HeartHandshake } from 'lucide-react';
import { DemoDrawer } from './DemoDrawer';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const {
    session,
    logout,
    notifications,
    dismissNotification,
  } = useSurplusLink();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isDemoDrawerOpen, setIsDemoDrawerOpen] = useState(false);

  // Scoped notifications: providers only get their own; NGO gets NGO notifications
  const roleNotifications = notifications.filter((n) => {
    if (!session) return false;
    if (n.targetRole === 'all') return true;
    if (session.role === 'provider') {
      return n.targetRole === 'provider' && (!n.targetProviderId || n.targetProviderId === session.entityId);
    }
    if (session.role === 'ngo') {
      return n.targetRole === 'ngo';
    }
    return false;
  });

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xs border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs shadow-emerald-600/30">
                <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                  Replate
                </span>
                <span className="text-[10px] text-slate-500 block leading-tight">
                  Madurai Cluster
                </span>
              </div>
            </div>

            {/* Right Side: Signed-in Name, Notification Bell, Demo Drawer Trigger, Logout */}
            <div className="flex items-center gap-2 sm:gap-3">
              {session ? (
                <>
                  {/* Signed-in identity */}
                  <div className="flex items-center gap-2 pl-2 pr-3 py-1 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        session.role === 'provider'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {session.role === 'provider' ? (
                        <Store className="h-3.5 w-3.5" />
                      ) : (
                        <HeartHandshake className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 max-w-[140px] sm:max-w-[200px] text-left">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {session.entityName}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        {session.role === 'provider' ? 'Food Provider' : 'NGO Depot'}
                      </div>
                    </div>
                  </div>

                  {/* Scoped Notifications */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsNotifOpen(!isNotifOpen)}
                      className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors duration-150 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                      title="Notifications"
                      aria-label="View notifications"
                    >
                      <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                      {roleNotifications.length > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950 shadow-xs">
                          {roleNotifications.length > 9 ? '9+' : roleNotifications.length}
                        </span>
                      )}
                    </button>

                    {/* Notification Dropdown */}
                    {isNotifOpen && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-emerald-600" />
                            <span className="text-xs font-semibold text-slate-900">
                              Your Alerts ({roleNotifications.length})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsNotifOpen(false)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            aria-label="Close"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                          {roleNotifications.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-500">
                              No active notifications for your account.
                            </div>
                          ) : (
                            roleNotifications.map((notif) => (
                              <div
                                key={notif.id}
                                className="p-3 text-xs hover:bg-slate-50 transition-colors flex items-start justify-between gap-2"
                              >
                                <div className="space-y-1 min-w-0">
                                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                    {notif.type === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                                    {notif.type === 'warning' && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                                    {notif.type === 'error' && <X className="h-3.5 w-3.5 text-rose-600 shrink-0" />}
                                    {notif.type === 'info' && <Info className="h-3.5 w-3.5 text-sky-600 shrink-0" />}
                                    <span className="truncate">{notif.title}</span>
                                  </div>
                                  <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                                  <span className="text-[10px] text-slate-400 block">{notif.timestamp}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => dismissNotification(notif.id)}
                                  className="text-slate-400 hover:text-slate-600 p-1 shrink-0 cursor-pointer"
                                  title="Dismiss"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Demo Tools Button */}
                  <button
                    type="button"
                    onClick={() => setIsDemoDrawerOpen(true)}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center border border-slate-200/80 cursor-pointer"
                    title="Presenter Demo Tools (Switch demo accounts & approvals)"
                    aria-label="Open Demo Tools"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all duration-150 min-h-[40px] cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                /* Not logged in: Show Demo Drawer and Login Button */
                <>
                  <button
                    type="button"
                    onClick={() => setIsDemoDrawerOpen(true)}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center border border-slate-200/80 cursor-pointer"
                    title="Presenter Demo Tools"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl shadow-xs cursor-pointer hover:bg-emerald-700 transition-colors"
                  >
                    Choose Role
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Presenter Demo Tools Drawer */}
      <DemoDrawer
        isOpen={isDemoDrawerOpen}
        onClose={() => setIsDemoDrawerOpen(false)}
      />
    </>
  );
};
