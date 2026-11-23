import React, { useState, useEffect } from 'react';
import { MerchantDashboard } from './components/MerchantDashboard';
import { StaffScanner } from './components/StaffScanner';
import { CustomerWebCard } from './components/CustomerWebCard';
import { CustomerEnroll } from './components/CustomerEnroll';
import { store } from './services/store';
import {
  LayoutDashboard,
  Camera,
  CreditCard,
  UserPlus,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'scanner' | 'card' | 'enroll'>('dashboard');
  const [selectedMemberToken, setSelectedMemberToken] = useState<string>('STP-KENANGA-AHMAD99');

  // Handle URL hashes like #scanner, #card-STP-..., #enroll
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'scanner') {
        setCurrentView('scanner');
      } else if (hash === 'enroll' || hash === 'join') {
        setCurrentView('enroll');
      } else if (hash.startsWith('card-')) {
        const token = hash.replace('card-', '');
        setSelectedMemberToken(token);
        setCurrentView('card');
      } else if (hash === 'dashboard') {
        setCurrentView('dashboard');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateTo = (view: 'dashboard' | 'scanner' | 'card' | 'enroll', token?: string) => {
    if (token) setSelectedMemberToken(token);
    setCurrentView(view);
    if (view === 'card' && token) {
      window.location.hash = `card-${token}`;
    } else {
      window.location.hash = view;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* GLOBAL TESTER / DEMO ROLE BAR */}
      <nav className="bg-slate-900/90 border-b border-slate-800 text-xs px-4 py-2 sticky top-0 z-50 flex items-center justify-between backdrop-blur-md print:hidden">
        <div className="flex items-center gap-2">
          <span className="font-black text-brand-500 tracking-tight text-sm">StampPop</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-semibold border border-slate-700">
            v1.0 PRD Ready
          </span>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold">
          <button
            onClick={() => navigateTo('dashboard')}
            className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition ${
              currentView === 'dashboard'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>1. Dashboard Owner</span>
          </button>

          <button
            onClick={() => navigateTo('scanner')}
            className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition ${
              currentView === 'scanner'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>2. Scanner Staf PWA</span>
          </button>

          <button
            onClick={() => navigateTo('card', selectedMemberToken)}
            className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition ${
              currentView === 'card'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>3. Web Card Pelanggan</span>
          </button>

          <button
            onClick={() => navigateTo('enroll')}
            className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition ${
              currentView === 'enroll'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>4. Scan Poster Enroll</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={() => {
              store.resetToDefault();
              window.location.reload();
            }}
            title="Reset Data Mock Uji Coba"
            className="p-1 text-slate-400 hover:text-white transition flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="text-[10px]">Reset DB</span>
          </button>
        </div>
      </nav>

      {/* RENDER VIEW */}
      <div className="flex-1">
        {currentView === 'dashboard' && (
          <MerchantDashboard
            onOpenScanner={() => navigateTo('scanner')}
            onOpenCustomerCard={(token) => navigateTo('card', token)}
            onOpenEnroll={() => navigateTo('enroll')}
          />
        )}

        {currentView === 'scanner' && (
          <StaffScanner
            onBackToDashboard={() => navigateTo('dashboard')}
            onViewCustomerCard={(token) => navigateTo('card', token)}
          />
        )}

        {currentView === 'card' && (
          <CustomerWebCard
            memberToken={selectedMemberToken}
            onOpenScanner={() => navigateTo('scanner')}
          />
        )}

        {currentView === 'enroll' && (
          <CustomerEnroll
            onEnrollSuccess={(token) => navigateTo('card', token)}
            onCancel={() => navigateTo('dashboard')}
          />
        )}
      </div>
    </div>
  );
}
export default App;
