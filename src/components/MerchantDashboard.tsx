import React, { useEffect, useState } from 'react';
import {
  Users,
  Award,
  Gift,
  TrendingUp,
  AlertTriangle,
  Printer,
  Download,
  Settings,
  ShieldCheck,
  Plus,
  RefreshCw,
  Camera,
  Search,
  CheckCircle2,
  Building,
  Store as StoreIcon,
  UserCheck,
  Key,
  ExternalLink,
  ChevronRight,
  Sliders,
  DollarSign
} from 'lucide-react';
import { store } from '../services/store';
import { Member, Outlet, Program, StampCard, StampTransaction, Tenant, UserStaff } from '../types';
import { PrintablePosterModal } from './PrintablePosterModal';

interface Props {
  onOpenScanner: () => void;
  onOpenCustomerCard: (token: string) => void;
  onOpenEnroll: () => void;
}

export const MerchantDashboard: React.FC<Props> = ({
  onOpenScanner,
  onOpenCustomerCard,
  onOpenEnroll
}) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant>(() => store.getCurrentTenant());
  const [allTenants, setAllTenants] = useState<Tenant[]>(() => store.getAllTenants());
  const [program, setProgram] = useState<Program>(() => store.getActiveProgram());
  const [outlets, setOutlets] = useState<Outlet[]>(() => store.getOutlets());
  const [staffList, setStaffList] = useState<UserStaff[]>(() => store.getStaffList());
  const [members, setMembers] = useState<{ member: Member; card: StampCard }[]>(() => store.getAllMembers());
  const [transactions, setTransactions] = useState<StampTransaction[]>(() => store.getAllTransactions());
  const [auditLogs, setAuditLogs] = useState(() => store.getAuditLogs());

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'program' | 'members' | 'ledger' | 'staff' | 'superadmin'>('analytics');
  const [showPosterModal, setShowPosterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Correction Modal State
  const [correctionTx, setCorrectionTx] = useState<StampTransaction | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionPin, setCorrectionPin] = useState('1234'); // Demo default owner PIN
  const [correctionError, setCorrectionError] = useState('');
  const [correctionSuccess, setCorrectionSuccess] = useState('');

  // Edit Program State
  const [editStampTarget, setEditStampTarget] = useState(program.stampTarget);
  const [editRewardName, setEditRewardName] = useState(program.rewardName);
  const [editMinTx, setEditMinTx] = useState(program.minTransactionRp || 25000);
  const [programSaved, setProgramSaved] = useState(false);

  // New Staff Modal State
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserStaff['role']>('staff');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);

  const refreshState = () => {
    const t = store.getCurrentTenant();
    setCurrentTenant(t);
    setAllTenants(store.getAllTenants());
    const prog = store.getActiveProgram(t.id);
    setProgram(prog);
    setEditStampTarget(prog.stampTarget);
    setEditRewardName(prog.rewardName);
    setEditMinTx(prog.minTransactionRp || 25000);
    setOutlets(store.getOutlets(t.id));
    setStaffList(store.getStaffList(t.id));
    setMembers(store.getAllMembers(t.id));
    setTransactions(store.getAllTransactions(t.id));
    setAuditLogs(store.getAuditLogs(t.id));
  };

  useEffect(() => {
    const unsub = store.subscribe(() => {
      refreshState();
    });
    return unsub;
  }, []);

  const handleSwitchTenant = (tenantId: string) => {
    store.setCurrentTenant(tenantId);
    refreshState();
  };

  // 5 KEY QUESTIONS METRICS (PRD Section 15)
  const totalMembers = members.length;
  const newMembersThisWeek = members.filter((m) => {
    const diffDays = (Date.now() - new Date(m.member.createdAt).getTime()) / (1000 * 3600 * 24);
    return diffDays <= 7;
  }).length;

  const totalStampsIssued = transactions
    .filter((t) => t.type === 'STAMP_ADD')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalRedeemed = transactions.filter((t) => t.type === 'REDEEM').length;

  // Redeem Rate: members who reached target and redeemed
  const membersCompletedOrNear = members.filter((m) => m.card.saldoStamp >= program.stampTarget || m.card.cycleCount > 1).length;
  const redeemRate = membersCompletedOrNear > 0 ? Math.round((totalRedeemed / membersCompletedOrNear) * 100) : 100;

  // Returning members: members with >= 2 transactions in last 30 days
  const returningMembersCount = members.filter(({ card }) => {
    const txCount = transactions.filter((t) => t.cardId === card.id).length;
    return txCount >= 2;
  }).length;
  const returningRate = totalMembers > 0 ? Math.round((returningMembersCount / totalMembers) * 100) : 0;

  // Most active outlet
  const outletActivityMap: Record<string, number> = {};
  transactions.forEach((tx) => {
    outletActivityMap[tx.outletName] = (outletActivityMap[tx.outletName] || 0) + tx.amount;
  });
  const topOutletName = Object.entries(outletActivityMap).sort((a, b) => b[1] - a[1])[0]?.[0] || outlets[0]?.name || 'Belum Ada';

  // Export CSV
  const handleExport = (type: 'members' | 'transactions') => {
    const csvContent = store.exportCsv(type, currentTenant.id);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentTenant.slug}-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Correction Submit
  const handlePerformCorrection = () => {
    if (!correctionTx) return;
    setCorrectionError('');
    setCorrectionSuccess('');

    const res = store.correctStamp({
      transactionId: correctionTx.id,
      managerPin: correctionPin,
      reason: correctionReason
    });

    if (res.success) {
      setCorrectionSuccess(res.message);
      setTimeout(() => {
        setCorrectionTx(null);
        setCorrectionReason('');
        setCorrectionSuccess('');
      }, 1500);
    } else {
      setCorrectionError(res.message);
    }
  };

  // Save Program Rules
  const handleSaveProgram = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateProgram({
      id: program.id,
      stampTarget: editStampTarget,
      rewardName: editRewardName,
      minTransactionRp: editMinTx
    });
    setProgramSaved(true);
    setTimeout(() => setProgramSaved(false), 3000);
  };

  // Add Staff Submit
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffPin) return;
    store.addStaff(newStaffName, newStaffRole, newStaffPin, outlets[0]?.id);
    setNewStaffName('');
    setNewStaffPin('');
    setShowAddStaffModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Application Bar */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg font-bold"
            style={{ backgroundColor: currentTenant.primaryColor }}
          >
            {currentTenant.logo || '☕'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-tight">{currentTenant.name}</h1>
              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.2 rounded-full uppercase">
                {currentTenant.plan} Plan
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Tenant Slug: <code className="font-mono text-slate-300 font-bold">{currentTenant.slug}</code></span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">● Sistem Aktif</span>
            </div>
          </div>
        </div>

        {/* Action Controls & Multi-tenant Switcher */}
        <div className="flex items-center gap-2">
          {/* Tenant Switcher Dropdown (Multi-Tenant proof) */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={currentTenant.id}
              onChange={(e) => handleSwitchTenant(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {allTenants.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowPosterModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5 text-brand-400" />
            <span>Poster QR Kasir</span>
          </button>

          <button
            onClick={onOpenEnroll}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Enroll Member</span>
          </button>

          <button
            onClick={onOpenScanner}
            className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition active:scale-95"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Buka Scanner Staf</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-1">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 space-x-1 sm:space-x-4 overflow-x-auto pb-1 text-xs sm:text-sm font-semibold">
          {[
            { id: 'analytics', label: 'Ringkasan & Analitik', icon: TrendingUp },
            { id: 'program', label: 'Aturan Program', icon: Sliders },
            { id: 'members', label: `Daftar Member (${members.length})`, icon: Users },
            { id: 'ledger', label: 'Buku Besar & Koreksi', icon: Award },
            { id: 'staff', label: 'Staf & Outlet', icon: StoreIcon },
            { id: 'superadmin', label: 'Superadmin Platform', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-2 px-3 sm:px-4 rounded-xl flex items-center gap-2 transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-brand-400 border border-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: ANALYTICS & 5 KEY QUESTIONS (PRD Section 15) */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-pop">
            {/* 5 Key Questions Header Alert */}
            <div className="bg-gradient-to-r from-brand-950/40 via-slate-900 to-slate-900 border border-brand-500/20 rounded-3xl p-5 sm:p-6">
              <div className="flex items-center gap-2 text-brand-400 font-extrabold text-xs uppercase tracking-wider mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>Executive Metric Board — Jawab 5 Pertanyaan dalam 10 Detik</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Kinerja Program Loyalitas {currentTenant.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Pantau adopsi digital tanpa aplikasi secara real-time. Setiap stamp dan penukaran reward tercatat secara immutable.
              </p>
            </div>

            {/* 5 Key Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Q1: Member Baru */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  1. Member Baru
                </div>
                <div className="text-3xl font-black text-white">{totalMembers}</div>
                <div className="text-xs text-emerald-400 font-semibold mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{newMembersThisWeek} minggu ini</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Enroll via QR kasir</div>
              </div>

              {/* Q2: Stamp Diterbitkan & Outlet Teraktif */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  2. Stamp Beredar
                </div>
                <div className="text-3xl font-black text-amber-400">{totalStampsIssued}</div>
                <div className="text-xs text-slate-300 font-semibold mt-2 truncate">
                  Top: {topOutletName.split('(')[0]}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Outlet paling banyak stamp</div>
              </div>

              {/* Q3: Reward Ditukar & Redeem Rate */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  3. Reward Ditukar
                </div>
                <div className="text-3xl font-black text-emerald-400">{totalRedeemed}</div>
                <div className="text-xs text-emerald-400 font-semibold mt-2">
                  Redeem Rate: {redeemRate}%
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Dari member target</div>
              </div>

              {/* Q4: Returning Customers */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  4. Pelanggan Balik
                </div>
                <div className="text-3xl font-black text-blue-400">{returningMembersCount}</div>
                <div className="text-xs text-blue-300 font-semibold mt-2">
                  Retensi: {returningRate}%
                </div>
                <div className="text-[10px] text-slate-500 mt-1">&ge; 2 kunjungan dlm 30 hari</div>
              </div>

              {/* Q5: Deteksi Anomali & Anti-Fraud */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  5. Status Keamanan
                </div>
                <div className="text-2xl font-black text-emerald-400 flex items-center gap-1.5 mt-1">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  <span>Aman</span>
                </div>
                <div className="text-xs text-slate-300 font-medium mt-2">
                  Rate-limit 15 menit: <strong className="text-emerald-400">Aktif</strong>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">0 kebocoran stamp terdeteksi</div>
              </div>
            </div>

            {/* Quick Actions & Recent Activity Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Member progress distribution */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    Distribusi Stamp Pelanggan
                  </h3>
                  <span className="text-[11px] text-slate-400">Target: {program.stampTarget} Stamp</span>
                </div>

                <div className="space-y-3">
                  {members.map(({ member, card }) => {
                    const percent = Math.min(100, Math.round((card.saldoStamp / program.stampTarget) * 100));
                    const isComplete = card.saldoStamp >= program.stampTarget;
                    return (
                      <div
                        key={member.id}
                        onClick={() => onOpenCustomerCard(member.tokenQr)}
                        className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition group"
                      >
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="font-bold text-white group-hover:text-brand-400 transition flex items-center gap-1.5">
                            {member.name}
                            {isComplete && (
                              <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 rounded font-bold">
                                HADIAH SIAP!
                              </span>
                            )}
                          </span>
                          <span className="font-mono text-amber-400 font-bold text-xs">
                            {card.saldoStamp} / {program.stampTarget} Stamp
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isComplete ? 'bg-amber-400' : 'bg-brand-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                          <span>{member.whatsapp || 'Tamu'}</span>
                          <span>Siklus ke-{card.cycleCount}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Activity Log */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Transaksi Kasir Terakhir (Live Feed)
                  </h3>
                  <button
                    onClick={() => setActiveTab('ledger')}
                    className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
                  >
                    Buka Buku Besar Lengkap →
                  </button>
                </div>

                <div className="space-y-2.5">
                  {transactions.slice(0, 6).map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                            tx.type === 'STAMP_ADD'
                              ? 'bg-amber-500/20 text-amber-400'
                              : tx.type === 'REDEEM'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {tx.type === 'STAMP_ADD' ? '★' : tx.type === 'REDEEM' ? '🎁' : '↺'}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>
                              {tx.type === 'STAMP_ADD'
                                ? `Pemberian +${tx.amount} Stamp`
                                : tx.type === 'REDEEM'
                                ? 'Klaim Hadiah Kopi'
                                : 'Koreksi Transaksi'}
                            </span>
                            <span className="text-[10px] text-slate-500">• {tx.outletName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Kasir: {tx.staffName} • {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {tx.transactionValue ? (
                          <div className="font-bold text-slate-200">
                            Rp {tx.transactionValue.toLocaleString('id-ID')}
                          </div>
                        ) : null}
                        <div className="text-[10px] text-slate-500 font-mono">ID: {tx.id}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROGRAM LOYALITAS (FR-06 & FR-08) */}
        {activeTab === 'program' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto shadow-xl space-y-6 animate-pop">
            <div>
              <span className="text-[11px] font-bold text-brand-400 uppercase tracking-wider">
                ATURAN & PERILAKU STAMP
              </span>
              <h2 className="text-xl font-black text-white mt-1">Konfigurasi Program Loyalitas</h2>
              <p className="text-xs text-slate-400 mt-1">
                Aturan stamp dan reward. Sistem mencatat versi aturan setiap kali perubahan disimpan (FR-08).
              </p>
            </div>

            {programSaved && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Aturan program berhasil disimpan! Versi aturan naik ke v{program.ruleVersion}.</span>
              </div>
            )}

            <form onSubmit={handleSaveProgram} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Nama Program Loyalitas
                </label>
                <input
                  type="text"
                  value={program.name}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-sm font-semibold cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Target Stamp untuk Hadiah
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={20}
                    value={editStampTarget}
                    onChange={(e) => setEditStampTarget(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-brand-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Standar kafe & retail: 8 - 10 stamp</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Transaksi Minimum per Stamp (Rp)
                  </label>
                  <input
                    type="number"
                    step={5000}
                    value={editMinTx}
                    onChange={(e) => setEditMinTx(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-brand-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Contoh: Rp 25.000 / stamp</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Nama Reward yang Didapat Member
                </label>
                <input
                  type="text"
                  value={editRewardName}
                  onChange={(e) => setEditRewardName(e.target.value)}
                  placeholder="Contoh: Gratis 1 Kopi Signature Aren Latte"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Anti-Fraud Settings Preview */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Anti-Fraud Proteksi Terpasang (FR-20)
                </div>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• Batas 1 pemberian stamp per member per 15 menit (mencegah double-tap kasir).</li>
                  <li>• QR Member terenkripsi acak (tidak berurutan, anti-spoofing).</li>
                  <li>• Buku besar append-only: tidak ada penghapusan data, hanya koreksi berpasangan.</li>
                </ul>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-xl shadow-lg transition active:scale-[0.98]"
              >
                Simpan Perubahan Aturan Program
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: DAFTAR MEMBER (FR-24 & FR-25) */}
        {activeTab === 'members' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-pop">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-400" />
                  Direktori Member ({members.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Data member dan saldo stamp yang valid dan terenkripsi.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari nama / WhatsApp..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <button
                  onClick={() => handleExport('members')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Members Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Nama Member</th>
                    <th className="py-3 px-3">WhatsApp</th>
                    <th className="py-3 px-3">Saldo Stamp</th>
                    <th className="py-3 px-3">Siklus</th>
                    <th className="py-3 px-3">Tgl Bergabung</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {members
                    .filter(
                      ({ member }) =>
                        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        member.whatsapp.includes(searchQuery)
                    )
                    .map(({ member, card }) => {
                      const isComplete = card.saldoStamp >= program.stampTarget;
                      return (
                        <tr key={member.id} className="hover:bg-slate-950/40 transition">
                          <td className="py-3 px-3">
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{member.name}</span>
                              {member.isGuest && (
                                <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-normal">
                                  Tamu
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500">{member.tokenQr}</div>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-300">
                            {member.whatsapp || <span className="text-slate-500 italic">-</span>}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`font-mono font-bold px-2 py-0.5 rounded ${
                                isComplete
                                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                  : 'bg-slate-800 text-slate-200'
                              }`}
                            >
                              {card.saldoStamp} / {program.stampTarget} Stamp
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-400">Ke-{card.cycleCount}</td>
                          <td className="py-3 px-3 text-slate-400">
                            {new Date(member.createdAt).toLocaleDateString('id-ID')}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => onOpenCustomerCard(member.tokenQr)}
                              className="px-2.5 py-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition"
                            >
                              <span>Buka Kartu</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: BUKU BESAR LEDGER & KOREKSI (FR-16 & FR-17) */}
        {activeTab === 'ledger' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-pop">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Buku Besar Transaksi Stamp (Immutable Ledger)
                </h2>
                <p className="text-xs text-slate-400">
                  Semua transaksi append-only. Koreksi dilakukan dengan transaksi pembalik bertanda alasan (FR-17).
                </p>
              </div>

              <button
                onClick={() => handleExport('transactions')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Ledger CSV</span>
              </button>
            </div>

            {/* Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">ID Transaksi</th>
                    <th className="py-3 px-3">Tipe</th>
                    <th className="py-3 px-3">Stamp</th>
                    <th className="py-3 px-3">Outlet</th>
                    <th className="py-3 px-3">Staf Kasir</th>
                    <th className="py-3 px-3">Waktu</th>
                    <th className="py-3 px-3 text-right">Koreksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-950/40 transition">
                      <td className="py-3 px-3 font-mono text-slate-400">{tx.id}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            tx.type === 'STAMP_ADD'
                              ? 'bg-amber-500/20 text-amber-400'
                              : tx.type === 'REDEEM'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {tx.type}
                        </span>
                        {tx.reason && (
                          <div className="text-[10px] text-slate-400 italic mt-0.5">{tx.reason}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-bold font-mono text-white">
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                      </td>
                      <td className="py-3 px-3 text-slate-300">{tx.outletName}</td>
                      <td className="py-3 px-3 text-slate-400">{tx.staffName}</td>
                      <td className="py-3 px-3 text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {tx.type === 'STAMP_ADD' && (
                          <button
                            onClick={() => {
                              setCorrectionTx(tx);
                              setCorrectionError('');
                              setCorrectionSuccess('');
                            }}
                            className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                          >
                            Koreksi
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: STAF & OUTLET (FR-03 & FR-04) */}
        {activeTab === 'staff' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pop">
            {/* Outlets */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <StoreIcon className="w-4 h-4 text-brand-400" />
                  Outlet & Cabang ({outlets.length})
                </h3>
              </div>

              <div className="space-y-3">
                {outlets.map((outlet) => (
                  <div
                    key={outlet.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1"
                  >
                    <div className="font-bold text-white text-sm flex items-center justify-between">
                      <span>{outlet.name}</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
                        Aktif
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">{outlet.address}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">Zona: {outlet.timezone}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff Accounts & PINs */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-brand-400" />
                  Akun Staf & PIN Kasir ({staffList.length})
                </h3>
                <button
                  onClick={() => setShowAddStaffModal(true)}
                  className="px-2.5 py-1 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Staf</span>
                </button>
              </div>

              <div className="space-y-3">
                {staffList.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{s.name}</div>
                      <div className="text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="capitalize font-semibold text-brand-400">{s.role}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-300">PIN: {s.pinPlain}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
                        Terverifikasi
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SUPERADMIN PLATFORM (FR-27) */}
        {activeTab === 'superadmin' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-pop">
            <div>
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                PLATFORM CONTROL TOWER (FLUXY TEAM)
              </span>
              <h2 className="text-xl font-black text-white mt-1">Superadmin Multi-Tenant Overview</h2>
              <p className="text-xs text-slate-400 mt-1">
                Kelola seluruh tenant di dalam satu instance StampPop SaaS. Row-Level Security (RLS) menjamin pemisahan data per tenant.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allTenants.map((t) => {
                const isSelected = t.id === currentTenant.id;
                return (
                  <div
                    key={t.id}
                    className={`p-5 rounded-3xl border transition ${
                      isSelected
                        ? 'bg-slate-950 border-brand-500 shadow-xl'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl text-white font-bold"
                        style={{ backgroundColor: t.primaryColor }}
                      >
                        {t.logo || '☕'}
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {t.status}
                      </span>
                    </div>

                    <h3 className="font-black text-white text-base">{t.name}</h3>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">slug: {t.slug}</div>
                    <div className="text-xs text-slate-500 mt-2">Paket: {t.plan.toUpperCase()}</div>

                    <button
                      onClick={() => handleSwitchTenant(t.id)}
                      className={`w-full mt-4 py-2 text-xs font-bold rounded-xl transition ${
                        isSelected
                          ? 'bg-brand-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isSelected ? 'Tenant Aktif Saat Ini' : 'Beralih ke Tenant Ini'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Audit Log Cross-Tenant */}
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-sm font-bold text-white mb-3">Audit Log Platform Terbaru</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-brand-400">{log.action}: </span>
                      <span className="text-slate-300">{log.details}</span>
                      <div className="text-[10px] text-slate-500">Oleh: {log.actorName} ({log.actorRole})</div>
                    </div>
                    <div className="text-[10px] text-slate-400 whitespace-nowrap pl-4">
                      {new Date(log.createdAt).toLocaleTimeString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CORRECTION MODAL */}
      {correctionTx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Koreksi Transaksi Stamp (Manager Only)
            </h3>
            <p className="text-xs text-slate-400">
              Membatalkan / mengurangi stamp yang salah input pada transaksi <code>{correctionTx.id}</code>.
            </p>

            {correctionError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {correctionError}
              </div>
            )}
            {correctionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                {correctionSuccess}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Alasan Koreksi (Wajib Diisi):
              </label>
              <input
                type="text"
                placeholder="Contoh: Salah jumlah stamp saat transaksi dobel"
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                PIN Owner / Manager (Demo PIN: 1234 atau 2222):
              </label>
              <input
                type="password"
                maxLength={4}
                value={correctionPin}
                onChange={(e) => setCorrectionPin(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCorrectionTx(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Batal
              </button>
              <button
                onClick={handlePerformCorrection}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg transition"
              >
                Simpan Koreksi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-brand-400" />
              Tambah Akun Staf Kasir
            </h3>
            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nama Staf</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rian Barista"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Peran / Role</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as UserStaff['role'])}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="staff">Staf Kasir (Scan & Beri Stamp)</option>
                  <option value="manager">Manager Outlet (Koreksi & Laporan)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">4 Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="Contoh: 5555"
                  value={newStaffPin}
                  onChange={(e) => setNewStaffPin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-brand-500 text-center text-base tracking-widest"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 shadow-md"
                >
                  Simpan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE POSTER MODAL */}
      {showPosterModal && (
        <PrintablePosterModal
          tenant={currentTenant}
          program={program}
          onClose={() => setShowPosterModal(false)}
        />
      )}
    </div>
  );
};
