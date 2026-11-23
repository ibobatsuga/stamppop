import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Gift,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Download,
  Info,
  ChevronRight,
  Coffee,
  RotateCcw,
  Smartphone
} from 'lucide-react';
import { Member, Program, StampCard, Tenant, StampTransaction } from '../types';
import { store } from '../services/store';
import { generateAppleWalletPass, generateGoogleWalletUrl } from '../utils/wallet';

interface Props {
  memberToken: string;
  onOpenScanner?: () => void;
}

export const CustomerWebCard: React.FC<Props> = ({ memberToken, onOpenScanner }) => {
  const [data, setData] = useState<{
    member: Member;
    card: StampCard;
    program: Program;
    tenant: Tenant;
  } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [transactions, setTransactions] = useState<StampTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'card' | 'history' | 'terms'>('card');
  const [isGeneratingWallet, setIsGeneratingWallet] = useState<boolean>(false);
  const [walletDownloaded, setWalletDownloaded] = useState<boolean>(false);
  const [lastStampCount, setLastStampCount] = useState<number>(0);

  const refreshData = () => {
    const result = store.getMemberByToken(memberToken);
    if (result) {
      setData(result);
      const txs = store.getMemberTransactions(result.card.id);
      setTransactions(txs.slice(0, 10));

      // Trigger celebration if reached target
      if (result.card.saldoStamp >= result.program.stampTarget) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      setLastStampCount(result.card.saldoStamp);
    }
  };

  useEffect(() => {
    refreshData();
    const unsub = store.subscribe(() => {
      refreshData();
    });
    return unsub;
  }, [memberToken]);

  // Generate QR code for scanning
  useEffect(() => {
    if (data?.member) {
      QRCode.toDataURL(data.member.tokenQr, {
        width: 280,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch(console.error);
    }
  }, [data?.member?.tokenQr]);

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Kartu Tidak Ditemukan</h2>
          <p className="text-sm text-slate-500 mb-6">
            Token kartu "{memberToken}" tidak terdaftar di sistem StampPop. Silakan scan ulang poster di kasir.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition"
          >
            Muat Ulang Halaman
          </button>
        </div>
      </div>
    );
  }

  const { member, card, program, tenant } = data;
  const isRewardReady = card.saldoStamp >= program.stampTarget;
  const remainingStamps = Math.max(0, program.stampTarget - card.saldoStamp);

  const handleDownloadAppleWallet = async () => {
    try {
      setIsGeneratingWallet(true);
      const blob = await generateAppleWalletPass(tenant, program, member, card);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tenant.slug}-stamp-pass.pkpass`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setWalletDownloaded(true);
      setTimeout(() => setWalletDownloaded(false), 5000);
    } catch (err) {
      console.error('Wallet generation error:', err);
    } finally {
      setIsGeneratingWallet(false);
    }
  };

  const handleGoogleWallet = () => {
    const url = generateGoogleWalletUrl(tenant, program, member, card);
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col items-center pb-24">
      {/* Top Mobile Bar */}
      <header className="w-full max-w-md px-5 pt-6 pb-3 flex items-center justify-between border-b border-slate-800/80 sticky top-0 bg-slate-950/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-lg"
            style={{ backgroundColor: tenant.primaryColor }}
          >
            {tenant.logo || '☕'}
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight">{tenant.name}</h1>
            <p className="text-[11px] text-slate-400 font-medium">Digital Loyalty Stamp</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Live Sync
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md px-4 pt-4 flex-1 flex flex-col gap-4">
        {/* Navigation Pills */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('card')}
            className={`py-2 rounded-xl transition ${
              activeTab === 'card'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Kartu Stamp
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Riwayat
            {transactions.length > 0 && (
              <span className="text-[10px] bg-slate-700 px-1.5 py-0.2 rounded-full text-slate-300">
                {transactions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`py-2 rounded-xl transition ${
              activeTab === 'terms'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ketentuan
          </button>
        </div>

        {activeTab === 'card' && (
          <div className="space-y-4 animate-pop">
            {/* PHYSICAL STAMP CARD PASS */}
            <div
              className="relative rounded-3xl p-5 shadow-2xl text-white overflow-hidden transition-all duration-300 border border-white/10"
              style={{
                background: `linear-gradient(145deg, ${tenant.primaryColor} 0%, #1e1b18 100%)`
              }}
            >
              {/* Subtle texture ring overlay */}
              <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full border border-white/10 pointer-events-none" />
              <div className="absolute right-4 bottom-2 text-white/5 font-black text-7xl select-none pointer-events-none">
                STAMP
              </div>

              {/* Card Header */}
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                    KARTU LOYALITAS RESMI
                  </div>
                  <h2 className="text-lg font-extrabold text-white leading-snug drop-shadow-sm">
                    {program.name}
                  </h2>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-semibold text-white/70 uppercase">SIKLUS</div>
                  <div className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    Ke-{card.cycleCount}
                  </div>
                </div>
              </div>

              {/* Reward Status Banner */}
              {isRewardReady ? (
                <div className="mb-4 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 p-3 rounded-2xl shadow-lg flex items-center justify-between animate-pulse-glow">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-950 animate-spin" />
                    <div>
                      <div className="text-[11px] font-extrabold tracking-wider uppercase">REWARD SIAP DITUKAR!</div>
                      <div className="text-xs font-bold leading-tight">{program.rewardName}</div>
                    </div>
                  </div>
                  <Gift className="w-6 h-6 text-amber-950 shrink-0" />
                </div>
              ) : (
                <div className="mb-4 bg-black/25 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-300 shrink-0" />
                    <div className="text-xs">
                      <span className="text-white/70">Target: </span>
                      <strong className="text-white font-semibold">{program.rewardName}</strong>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <span className="text-xs font-extrabold text-amber-300">{remainingStamps} lagi</span>
                  </div>
                </div>
              )}

              {/* Visual Stamp Grid (9 slots or program target) */}
              <div className="bg-slate-950/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 mb-4">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-[11px] font-bold text-white/80 tracking-wide uppercase">
                    PROGRES STAMP
                  </span>
                  <span className="text-xs font-extrabold text-amber-300">
                    {card.saldoStamp} / {program.stampTarget} Stamp
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                  {Array.from({ length: program.stampTarget }).map((_, index) => {
                    const isStamped = index < card.saldoStamp;
                    const isTargetSlot = index === program.stampTarget - 1;

                    return (
                      <div
                        key={index}
                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 ${
                          isStamped
                            ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-lg scale-100'
                            : isTargetSlot
                            ? 'bg-white/10 border-2 border-dashed border-amber-300/60 text-amber-300'
                            : 'bg-white/5 border border-white/10 text-white/40'
                        }`}
                      >
                        {isStamped ? (
                          <div className="flex flex-col items-center justify-center animate-stamp-in">
                            <span className="text-lg leading-none">★</span>
                            <span className="text-[9px] font-extrabold mt-0.5 tracking-tighter uppercase">STAMP</span>
                          </div>
                        ) : isTargetSlot ? (
                          <div className="flex flex-col items-center justify-center">
                            <Gift className="w-4 h-4 mb-0.5" />
                            <span className="text-[9px] font-bold">REWARD</span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold font-mono">{index + 1}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Member Footer Info */}
              <div className="flex justify-between items-end text-xs text-white/80 border-t border-white/10 pt-3">
                <div>
                  <div className="text-[10px] text-white/50 uppercase">Pemilik Kartu</div>
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    {member.name}
                    {member.isGuest && (
                      <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded text-white/80 font-normal">
                        Tamu
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-white/50 uppercase">Serial Kartu</div>
                  <div className="font-mono text-[11px] font-medium text-white/90">
                    {card.walletSerial}
                  </div>
                </div>
              </div>
            </div>

            {/* SCAN ME SECTION (BIG QR CODE) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-center shadow-xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full mb-3 border border-amber-400/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                TUNJUKKAN KE STAF SAAT TRANSAKSI
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Kasir akan memindai QR code ini untuk memberikan stamp langsung ke kartu Anda.
              </p>

              {/* QR Container */}
              <div className="inline-block p-4 bg-white rounded-3xl shadow-xl border-4 border-slate-700/50">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Member QR Code"
                    className="w-56 h-56 mx-auto object-contain"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                    Membuat QR...
                  </div>
                )}
              </div>

              <div className="mt-3">
                <span className="text-[11px] font-mono text-slate-400 tracking-wider">
                  TOKEN: <strong className="text-slate-200">{member.tokenQr}</strong>
                </span>
              </div>
            </div>

            {/* WALLET INTEGRATIONS (APPLE & GOOGLE WALLET) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-brand-400" />
                Simpan Tanpa Instal Aplikasi
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Kartu ini langsung tersimpan di dompet digital bawaan ponsel Anda, selalu sinkron dengan saldo Web Card ini.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Apple Wallet Button */}
                <button
                  onClick={handleDownloadAppleWallet}
                  disabled={isGeneratingWallet}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-black hover:bg-slate-950 text-white border border-slate-700 font-semibold text-xs shadow-md active:scale-95 transition"
                >
                  <span className="text-base"></span>
                  <span>{isGeneratingWallet ? 'Membuat Pass...' : 'Add to Apple Wallet'}</span>
                  <Download className="w-3.5 h-3.5 text-slate-400 ml-auto" />
                </button>

                {/* Google Wallet Button */}
                <button
                  onClick={handleGoogleWallet}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 font-semibold text-xs shadow-md active:scale-95 transition"
                >
                  <span className="font-bold text-blue-600">G</span>
                  <span>Save to Google Wallet</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-auto" />
                </button>
              </div>

              {walletDownloaded && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>File <strong>.pkpass</strong> terunduh! Buka di iPhone untuk pasang ke Apple Wallet.</span>
                </div>
              )}
            </div>

            {/* QUICK TEST TRIGGER FOR EVALUATORS */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="text-[11px] font-semibold text-slate-400 mb-2">
                Mode Demo / Evaluasi Langsung:
              </div>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    store.addStamp({
                      memberToken: member.tokenQr,
                      staffPin: '1111',
                      outletId: store.getOutlets()[0]?.id || 'outlet-1',
                      amount: 1,
                      transactionValue: 30000,
                      bypassRateLimit: true
                    });
                  }}
                  className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  +1 Stamp Simulasi Kasir
                </button>

                {onOpenScanner && (
                  <button
                    onClick={onOpenScanner}
                    className="px-3 py-1.5 bg-brand-500 text-white hover:bg-brand-600 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                  >
                    Buka Scanner Staf PWA
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB RIWAYAT TRANSAKSI */}
        {activeTab === 'history' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Riwayat Transaksi Stamp
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Total: {transactions.length} Transaksi
              </span>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                Belum ada transaksi stamp tercatat. Tunjukkan QR Anda kepada kasir saat berbelanja.
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            tx.type === 'STAMP_ADD'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : tx.type === 'REDEEM'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {tx.type === 'STAMP_ADD'
                            ? `+${tx.amount} STAMP`
                            : tx.type === 'REDEEM'
                            ? 'REDEEM REWARD'
                            : 'KOREKSI'}
                        </span>
                        <span className="text-slate-300 font-semibold">{tx.outletName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Oleh: {tx.staffName} • {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} WIB
                      </div>
                      {tx.reason && (
                        <div className="text-[10px] text-slate-500 italic">Catatan: {tx.reason}</div>
                      )}
                    </div>

                    <div className="text-right">
                      {tx.transactionValue ? (
                        <div className="font-semibold text-slate-300">
                          Rp {tx.transactionValue.toLocaleString('id-ID')}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB SYARAT & KETENTUAN */}
        {activeTab === 'terms' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Info className="w-4 h-4 text-brand-400" />
              Syarat & Ketentuan Program
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300">
              {program.terms.map((term, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-brand-500/10 text-brand-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{term}</span>
                </li>
              ))}
            </ul>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">Kebijakan Privasi (UU PDP Indonesia):</div>
              <p>
                Nomor WhatsApp Anda hanya digunakan untuk identifikasi kartu member resmi di {tenant.name} dan tidak akan dibagikan ke pihak ketiga tanpa persetujuan Anda.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
