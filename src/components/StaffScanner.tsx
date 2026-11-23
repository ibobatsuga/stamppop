import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import {
  Camera,
  CameraOff,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Gift,
  Sparkles,
  User,
  Store,
  Clock,
  ArrowRight,
  RefreshCw,
  LogOut,
  Search,
  Volume2
} from 'lucide-react';
import { store } from '../services/store';
import { sound } from '../utils/sound';
import { Member, Outlet, Program, StampCard, Tenant, UserStaff } from '../types';

interface Props {
  onBackToDashboard?: () => void;
  onViewCustomerCard?: (token: string) => void;
}

export const StaffScanner: React.FC<Props> = ({
  onBackToDashboard,
  onViewCustomerCard
}) => {
  const currentTenant = store.getCurrentTenant();
  const outlets = store.getOutlets(currentTenant.id);
  const staffList = store.getStaffList(currentTenant.id);

  // Auth / PIN State
  const [activeStaff, setActiveStaff] = useState<UserStaff | null>(() => {
    // Default to first staff in demo mode (Dimas Kasir: 1111)
    return staffList.find((s) => s.role === 'staff') || staffList[0] || null;
  });
  const [activeOutlet, setActiveOutlet] = useState<Outlet>(() => outlets[0]);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [scannedResult, setScannedResult] = useState<{
    member: Member;
    card: StampCard;
    program: Program;
    tenant: Tenant;
  } | null>(null);

  // Stamp Action State
  const [stampCount, setStampCount] = useState(1);
  const [transactionValue, setTransactionValue] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const qrRegionRef = useRef<HTMLDivElement>(null);
  const scannerInstanceRef = useRef<Html5Qrcode | null>(null);

  // Initialize or restart camera scanner
  const startCamera = async () => {
    if (!qrRegionRef.current) return;
    try {
      if (scannerInstanceRef.current) {
        await scannerInstanceRef.current.stop().catch(() => {});
      }

      const scanner = new Html5Qrcode('qr-reader-region');
      scannerInstanceRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          handleTokenScanned(decodedText);
          sound.playStampSuccess();
          // Stop camera once detected
          scanner.stop().catch(() => {});
          setIsScanning(false);
        },
        (errorMessage) => {
          // ignore scan frame errors
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.warn('Camera start error:', err);
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (scannerInstanceRef.current) {
      await scannerInstanceRef.current.stop().catch(() => {});
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleTokenScanned = (token: string) => {
    setStatusMessage(null);
    const lookup = store.getMemberByToken(token);
    if (!lookup) {
      sound.playWarning();
      setStatusMessage({
        type: 'error',
        text: `QR / Token "${token}" tidak terdaftar di sistem!`
      });
      return;
    }

    if (lookup.tenant.id !== currentTenant.id) {
      sound.playWarning();
      setStatusMessage({
        type: 'error',
        text: `Member ini terdaftar di ${lookup.tenant.name}, bukan ${currentTenant.name}.`
      });
      return;
    }

    setScannedResult(lookup);
    setManualToken('');
  };

  // Staff PIN Unlock
  const handleVerifyPin = (pinToTest: string) => {
    const matched = store.verifyStaffPin(pinToTest, currentTenant.id);
    if (matched) {
      setActiveStaff(matched);
      setIsLocked(false);
      setEnteredPin('');
      setPinError('');
    } else {
      sound.playWarning();
      setPinError('PIN salah! Coba 1111 (Dimas Kasir) atau 1234 (Owner).');
    }
  };

  // Stamp Issue
  const handleGiveStamp = (bypassRateLimit: boolean = false) => {
    if (!scannedResult || !activeStaff) return;
    setIsProcessing(true);
    setStatusMessage(null);

    const val = transactionValue ? parseInt(transactionValue.replace(/\D/g, ''), 10) : undefined;

    const res = store.addStamp({
      memberToken: scannedResult.member.tokenQr,
      staffPin: activeStaff.pinPlain || activeStaff.pinHash,
      outletId: activeOutlet.id,
      amount: stampCount,
      transactionValue: val,
      bypassRateLimit
    });

    setIsProcessing(false);

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: res.message
      });
      // refresh scanned result
      const updated = store.getMemberByToken(scannedResult.member.tokenQr);
      if (updated) setScannedResult(updated);

      if (updated && updated.card.saldoStamp >= updated.program.stampTarget) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.5 }
        });
      }
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message
      });
    }
  };

  // Reward Redemption
  const handleRedeemReward = () => {
    if (!scannedResult || !activeStaff) return;
    setIsProcessing(true);
    setStatusMessage(null);

    const res = store.redeemReward({
      memberToken: scannedResult.member.tokenQr,
      staffPin: activeStaff.pinPlain || activeStaff.pinHash,
      outletId: activeOutlet.id
    });

    setIsProcessing(false);

    if (res.success) {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.5 }
      });
      setStatusMessage({
        type: 'success',
        text: res.message
      });
      // refresh
      const updated = store.getMemberByToken(scannedResult.member.tokenQr);
      if (updated) setScannedResult(updated);
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message
      });
    }
  };

  // If locked, show PIN keyboard
  if (isLocked || !activeStaff) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto mb-4 border border-brand-500/20">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-white">Scanner Staf Terkunci</h2>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Masukkan 4 digit PIN individual staf Anda untuk membuka terminal scanner.
          </p>

          {/* Preset Staff Picker for easy testing */}
          <div className="mb-4 text-left">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Pilih Akun Staf (Demo PIN):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {staffList.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleVerifyPin(s.pinPlain || '1111')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-brand-500 text-left text-xs transition group"
                >
                  <div className="font-bold text-white group-hover:text-brand-400">{s.name}</div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span className="capitalize">{s.role}</span>
                    <span className="font-mono text-amber-400">PIN: {s.pinPlain}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {pinError && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs mb-4">
              {pinError}
            </div>
          )}

          {/* PIN Input */}
          <div className="space-y-4">
            <input
              type="password"
              maxLength={6}
              placeholder="Masukkan PIN"
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              className="w-full text-center tracking-widest text-2xl font-mono py-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={() => handleVerifyPin(enteredPin)}
              className="w-full py-3 bg-brand-500 text-white font-bold rounded-xl shadow-lg hover:bg-brand-600 transition"
            >
              Buka Scanner
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isRewardReady = scannedResult && scannedResult.card.saldoStamp >= scannedResult.program.stampTarget;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center pb-20">
      {/* Top Header */}
      <header className="w-full max-w-lg px-4 pt-4 pb-3 border-b border-slate-800 bg-slate-950/95 sticky top-0 z-30 flex items-center justify-between backdrop-blur">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-md"
            style={{ backgroundColor: currentTenant.primaryColor }}
          >
            {currentTenant.logo || '☕'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white leading-tight">PWA Scanner Staf</h1>
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.2 rounded-full">
                &lt; 5s Target
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="font-medium text-slate-200">{activeStaff.name}</span>
              <span>•</span>
              <span className="text-slate-400 truncate max-w-[140px]">{activeOutlet.name}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsLocked(true)}
            title="Kunci Scanner"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <Lock className="w-4 h-4" />
          </button>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
            >
              Dashboard
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-lg px-4 pt-4 space-y-4">
        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl border text-xs font-medium flex items-start gap-3 shadow-lg animate-pop ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-bold text-sm mb-0.5">
                {statusMessage.type === 'success' ? 'Sukses!' : 'Peringatan Operasional'}
              </div>
              <div>{statusMessage.text}</div>

              {/* Anti-Fraud Manager Bypass Option */}
              {statusMessage.text.includes('[Anti-Fraud]') && (
                <div className="mt-2.5 pt-2 border-t border-rose-500/20 flex items-center justify-between">
                  <span className="text-[10px] text-rose-400">
                    Kunjungan sah di jam yang sama?
                  </span>
                  <button
                    onClick={() => handleGiveStamp(true)}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold transition"
                  >
                    Bypass dengan Otorisasi Manager
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CAMERA / SCANNER CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-center">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Camera className="w-4 h-4 text-brand-400" />
              Pindai QR Member
            </span>
            <span className="text-slate-500 text-[11px]">Kamera Belakang Ponsel</span>
          </div>

          {/* Html5Qrcode video box */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-dashed border-slate-700 min-h-[220px] flex flex-col items-center justify-center p-3">
            <div id="qr-reader-region" ref={qrRegionRef} className="w-full max-w-[280px]" />

            {!isScanning && (
              <div className="space-y-3 py-4">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6 text-brand-400" />
                </div>
                <div className="text-xs text-slate-400">
                  Kamera dalam mode siap. Tekan tombol di bawah untuk membuka lensa kamera.
                </div>
                <button
                  onClick={startCamera}
                  className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-lg transition inline-flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Nyalakan Kamera Scanner
                </button>
              </div>
            )}

            {isScanning && (
              <button
                onClick={stopCamera}
                className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5"
              >
                <CameraOff className="w-3.5 h-3.5" />
                Matikan Kamera
              </button>
            )}
          </div>

          {/* Quick Member Token Selectors (Demo / Fallback mode) */}
          <div className="mt-4 pt-4 border-t border-slate-800 text-left">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Atau Pilih Cepat Member Uji Coba:</span>
              <span className="text-slate-500 font-normal">1-Klik Scan</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleTokenScanned('STP-KENANGA-AHMAD99')}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500 text-left text-xs transition"
              >
                <div className="font-bold text-white flex items-center justify-between">
                  <span>Ahmad Fauzi</span>
                  <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded font-mono font-bold">9/9</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                  ★ Reward Siap Ditukar
                </div>
              </button>

              <button
                onClick={() => handleTokenScanned('STP-KENANGA-SITI77')}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-brand-500 text-left text-xs transition"
              >
                <div className="font-bold text-white flex items-center justify-between">
                  <span>Siti Nurhaliza</span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded font-mono font-bold">7/9</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Kurang 2 stamp lagi
                </div>
              </button>
            </div>

            {/* Manual input box */}
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Ketik Token QR / ID Member..."
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualToken.trim()) {
                    handleTokenScanned(manualToken.trim());
                  }
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500 font-mono"
              />
              <button
                onClick={() => {
                  if (manualToken.trim()) handleTokenScanned(manualToken.trim());
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
              >
                Cek
              </button>
            </div>
          </div>
        </div>

        {/* SCANNED MEMBER ACTION CARD */}
        {scannedResult && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 animate-pop">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  MEMBER TERVERIFIKASI
                </span>
                <h3 className="text-lg font-black text-white mt-1 leading-snug">
                  {scannedResult.member.name}
                </h3>
                <div className="text-xs text-slate-400 font-mono">
                  {scannedResult.member.whatsapp || 'Member Tamu (Tanpa Kontak)'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Saldo Saat Ini</div>
                <div className="text-xl font-extrabold text-amber-400 font-mono">
                  {scannedResult.card.saldoStamp} / {scannedResult.program.stampTarget}
                </div>
                <div className="text-[10px] text-slate-500">Siklus Ke-{scannedResult.card.cycleCount}</div>
              </div>
            </div>

            {/* IF REWARD READY: HIGHLIGHT 1-TAP REDEEM BUTTON */}
            {isRewardReady && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-amber-400/60 text-center space-y-2.5">
                <div className="flex items-center justify-center gap-2 text-amber-300 font-extrabold text-sm">
                  <Gift className="w-5 h-5 animate-bounce" />
                  <span>TARGET TERCAPAI: {scannedResult.program.rewardName}</span>
                </div>
                <p className="text-xs text-slate-300">
                  Pelanggan berhak mengklaim hadiah ini. Tekan tombol di bawah untuk memproses penukaran.
                </p>
                <button
                  onClick={handleRedeemReward}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-xl font-black text-sm text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5 text-slate-950" />
                  <span>PROSES TUKAR REWARD SEKARANG</span>
                </button>
              </div>
            )}

            {/* STAMP ISSUANCE FORM */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Jumlah Stamp yang Diberikan:</span>
                <span className="font-mono text-amber-400 font-bold">+{stampCount} Stamp</span>
              </div>

              {/* Quick stamp count selector */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 5].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => setStampCount(cnt)}
                    className={`py-2 rounded-xl text-xs font-bold transition ${
                      stampCount === cnt
                        ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                        : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    +{cnt}
                  </button>
                ))}
              </div>

              {/* Optional Transaction Value */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Nilai Transaksi (Opsional):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-500 font-bold">Rp</span>
                  <input
                    type="text"
                    placeholder="Contoh: 35.000"
                    value={transactionValue}
                    onChange={(e) => setTransactionValue(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* ACTION: GIVE STAMP BUTTON */}
              <button
                onClick={() => handleGiveStamp(false)}
                disabled={isProcessing}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98]"
                style={{ backgroundColor: currentTenant.primaryColor }}
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>{isProcessing ? 'Memproses...' : `Beri ${stampCount} Stamp (< 5 Detik)`}</span>
              </button>

              {/* Link to view Web Card directly */}
              {onViewCustomerCard && (
                <button
                  onClick={() => onViewCustomerCard(scannedResult.member.tokenQr)}
                  className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  Lihat Tampilan Web Card Pelanggan →
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
