import React, { useState } from 'react';
import {
  Sparkles,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Coffee,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { store } from '../services/store';
import { Tenant, Program } from '../types';

interface Props {
  tenantSlug?: string;
  onEnrollSuccess: (tokenQr: string) => void;
  onCancel?: () => void;
}

export const CustomerEnroll: React.FC<Props> = ({
  tenantSlug,
  onEnrollSuccess,
  onCancel
}) => {
  const currentTenant = store.getCurrentTenant();
  const program = store.getActiveProgram(currentTenant.id);

  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [agreedConsent, setAgreedConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Format WhatsApp number cleanly with +62
  const handlePhoneChange = (val: string) => {
    let clean = val.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.substring(1);
    } else if (clean.startsWith('8')) {
      clean = '628' + clean.substring(1);
    }
    setWhatsapp(clean ? `+${clean}` : '');
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Harap masukkan nama panggilan Anda');
      return;
    }

    if (!whatsapp.trim() || whatsapp.length < 10) {
      setErrorMessage('Harap masukkan nomor WhatsApp yang aktif (+62...)');
      return;
    }

    if (!agreedConsent) {
      setErrorMessage('Harap centang persetujuan keanggotaan');
      return;
    }

    setIsSubmitting(true);
    try {
      const { member } = store.enrollMember({
        tenantId: currentTenant.id,
        name: name.trim(),
        whatsapp: whatsapp.trim(),
        isGuest: false,
        source: 'qr_poster'
      });

      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 }
      });

      onEnrollSuccess(member.tokenQr);
    } catch (err) {
      console.error(err);
      setErrorMessage('Terjadi kesalahan pendaftaran, coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestEnroll = () => {
    setIsSubmitting(true);
    try {
      const { member } = store.enrollMember({
        tenantId: currentTenant.id,
        name: `Tamu ${currentTenant.name}`,
        whatsapp: '',
        isGuest: true,
        source: 'qr_poster'
      });

      onEnrollSuccess(member.tokenQr);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-24 -left-24 w-52 h-52 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: currentTenant.primaryColor }}
        />

        {/* Tenant Header */}
        <div className="text-center mb-6 relative z-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg"
            style={{ backgroundColor: currentTenant.primaryColor }}
          >
            {currentTenant.logo || '☕'}
          </div>
          <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-400/20">
            KARTU STAMP DIGITAL RESMI
          </span>
          <h1 className="text-2xl font-black text-white mt-2 leading-tight">
            {currentTenant.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Kumpulkan {program.stampTarget} stamp dan nikmati{' '}
            <strong className="text-amber-300 font-semibold">{program.rewardName}</strong>
          </p>
        </div>

        {/* 3 Step Micro-Guide */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 mb-6 text-center text-[11px]">
          <div className="space-y-1">
            <div className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 font-bold mx-auto flex items-center justify-center text-[10px]">
              1
            </div>
            <div className="font-semibold text-slate-200">Isi Nama</div>
            <div className="text-[10px] text-slate-500">Tanpa download</div>
          </div>
          <div className="space-y-1">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold mx-auto flex items-center justify-center text-[10px]">
              2
            </div>
            <div className="font-semibold text-slate-200">Kumpul Stamp</div>
            <div className="text-[10px] text-slate-500">Scan di kasir</div>
          </div>
          <div className="space-y-1">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold mx-auto flex items-center justify-center text-[10px]">
              3
            </div>
            <div className="font-semibold text-slate-200">Tukar Hadiah</div>
            <div className="text-[10px] text-slate-500">100% Gratis</div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {/* Enrollment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Nama Lengkap / Panggilan
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Rian Pratama"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Nomor WhatsApp
            </label>
            <input
              type="tel"
              required
              placeholder="08123456789 atau +62812..."
              value={whatsapp}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Nomor ini digunakan untuk memulihkan saldo stamp jika Anda berganti ponsel.
            </p>
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedConsent}
                onChange={(e) => setAgreedConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-brand-500 bg-slate-950 border-slate-700 focus:ring-brand-500"
              />
              <span className="text-[11px] text-slate-400 leading-tight">
                Saya setuju bergabung dalam program loyalitas {currentTenant.name} dan menyetujui pemrosesan data sesuai ketentuan privasi UU PDP.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98]"
            style={{ backgroundColor: currentTenant.primaryColor }}
          >
            {isSubmitting ? (
              <span>Membuat Kartu Anda...</span>
            ) : (
              <>
                <span>Buka Kartu Stamp Saya</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Guest Mode Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider">
            Atau Lebih Cepat
          </span>
        </div>

        <button
          onClick={handleGuestEnroll}
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-medium text-xs border border-slate-700/60 transition flex items-center justify-center gap-2"
        >
          <UserCheck className="w-4 h-4 text-slate-400" />
          <span>Lanjut sebagai Tamu (Tanpa Nomor HP)</span>
        </button>

        {/* Security Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Aman & Terenkripsi • Powered by StampPop by Fluxy</span>
        </div>
      </div>
    </div>
  );
};
