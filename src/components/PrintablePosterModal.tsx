import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, Download, X, Sparkles, Gift, Smartphone, Coffee } from 'lucide-react';
import { Tenant, Program } from '../types';

interface Props {
  tenant: Tenant;
  program: Program;
  onClose: () => void;
}

export const PrintablePosterModal: React.FC<Props> = ({
  tenant,
  program,
  onClose
}) => {
  const [format, setFormat] = useState<'a4' | 'tent'>('a4');
  const [posterQrUrl, setPosterQrUrl] = useState<string>('');

  useEffect(() => {
    // Generate QR pointing to enroll page
    const enrollUrl = `${window.location.origin}/#enroll`;
    QRCode.toDataURL(enrollUrl, {
      width: 450,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => setPosterQrUrl(url))
      .catch(console.error);
  }, [tenant.slug]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {/* Controls Bar on screen (hidden in print) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative my-auto print:p-0 print:border-none print:shadow-none print:bg-white print:max-w-none">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6 print:hidden">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Printer className="w-5 h-5 text-brand-400" />
              Download & Cetak Poster QR Kasir
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Siap cetak untuk dipasang di meja kasir atau dinding outlet Anda.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Format toggle */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setFormat('a4')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  format === 'a4'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Format A4 (Dinding/Kasir)
              </button>
              <button
                onClick={() => setFormat('tent')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  format === 'tent'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Format Meja (Tent Card)
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              Cetak Sekarang / Simpan PDF
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* THE PRINTABLE SHEET CANVAS */}
        <div className="flex justify-center bg-slate-950/40 p-4 rounded-2xl overflow-x-auto print:p-0 print:bg-white">
          <div
            id="printable-poster-area"
            className={`bg-white text-slate-900 shadow-2xl rounded-2xl p-8 flex flex-col items-center text-center border-4 border-slate-200 relative print:border-none print:shadow-none print:rounded-none print:m-0 ${
              format === 'a4' ? 'w-[520px] min-h-[720px]' : 'w-[420px] min-h-[560px]'
            }`}
          >
            {/* Top Brand Banner */}
            <div className="w-full flex items-center justify-between border-b-2 border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl text-white shadow-md font-bold"
                  style={{ backgroundColor: tenant.primaryColor }}
                >
                  {tenant.logo || '☕'}
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-extrabold text-slate-950 tracking-tight leading-tight">
                    {tenant.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Official Digital Loyalty Stamp
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Tanpa Instal Aplikasi
                </span>
              </div>
            </div>

            {/* Poster Main Hook */}
            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                PROGRAM LOYALITAS RESMI
              </div>
              <h1 className="text-3xl font-black text-slate-950 leading-tight">
                Scan & Kumpulkan Stamp!
              </h1>
              <p className="text-sm font-medium text-slate-600 mt-1 max-w-sm">
                Kumpulkan <strong className="text-slate-900">{program.stampTarget} Stamp</strong> dan dapatkan{' '}
                <span className="text-brand-600 font-extrabold">{program.rewardName}</span>
              </p>
            </div>

            {/* BIG HIGH-RES QR CODE */}
            <div className="p-5 bg-white border-4 border-slate-900 rounded-3xl shadow-xl my-3">
              {posterQrUrl ? (
                <img
                  src={posterQrUrl}
                  alt="Poster Enrollment QR"
                  className={format === 'a4' ? 'w-64 h-64 mx-auto' : 'w-48 h-48 mx-auto'}
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-xs text-slate-400">
                  Membuat QR Poster...
                </div>
              )}
            </div>

            <div className="text-xs font-extrabold text-slate-800 tracking-wider font-mono mt-1 mb-6 uppercase">
              SCAN DENGAN KAMERA PONSEL ANDA
            </div>

            {/* 3 STEP CUSTOMER INSTRUCTION */}
            <div className="w-full grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center">
              <div>
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-extrabold text-xs mx-auto flex items-center justify-center mb-1.5">
                  1
                </div>
                <div className="font-extrabold text-xs text-slate-900">Scan QR Kasir</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Buka kamera ponsel Anda</div>
              </div>
              <div>
                <div className="w-7 h-7 rounded-full bg-brand-500 text-white font-extrabold text-xs mx-auto flex items-center justify-center mb-1.5">
                  2
                </div>
                <div className="font-extrabold text-xs text-slate-900">Kumpul Stamp</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Otomatis masuk ke dompet</div>
              </div>
              <div>
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-extrabold text-xs mx-auto flex items-center justify-center mb-1.5">
                  3
                </div>
                <div className="font-extrabold text-xs text-slate-900">Tukar Hadiah</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Nikmati reward gratis</div>
              </div>
            </div>

            {/* Bottom Apple / Google Wallet Badge */}
            <div className="mt-6 pt-4 border-t border-slate-100 w-full flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-medium text-slate-500">
                Didukung Apple Wallet & Google Wallet
              </span>
              <span className="font-mono text-slate-400">Powered by StampPop</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
