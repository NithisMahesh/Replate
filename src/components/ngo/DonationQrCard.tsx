import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useSurplusLink } from '../../context/SurplusLinkContext';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { useToast } from '../shared/Toast';
import {
  QrCode,
  Copy,
  Printer,
  Download,
  ExternalLink,
  Check,
  X,
  Sparkles,
  HeartHandshake,
  ShieldCheck,
} from 'lucide-react';

export const DonationQrCard: React.FC = () => {
  const { ngo } = useSurplusLink();
  const toast = useToast();

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isPosterOpen, setIsPosterOpen] = useState(false);

  const publicDonateUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/donate/${ngo.id}`
      : `/donate/${ngo.id}`;

  useEffect(() => {
    QRCode.toDataURL(publicDonateUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [publicDonateUrl]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(publicDonateUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = publicDonateUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success('Public donation link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy link. Please copy manually.');
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `replate-donate-${ngo.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Downloaded donation QR code image');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Card
        title="Donation QR"
        subtitle="Allow local bakeries, restaurants and messes to donate surplus food instantly"
        action={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            No app • No login
          </span>
        }
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-1">
          {/* QR Code Container */}
          <div className="relative group shrink-0 bg-white p-3.5 rounded-2xl border-2 border-slate-200/90 shadow-sm flex flex-col items-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Donation QR Code for ${ngo.name}`}
                className="w-44 h-44 sm:w-48 sm:h-48 rounded-xl object-contain"
                id="ngo-donation-qr-img"
              />
            ) : (
              <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                <QrCode className="w-10 h-10 animate-pulse" />
              </div>
            )}
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2 flex items-center gap-1">
              <QrCode className="w-3 h-3 text-slate-400" /> Scan with camera
            </span>
          </div>

          {/* Details & Actions */}
          <div className="flex-1 w-full space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Public Donor Portal Link
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Shops scan this code or open the link to submit surplus food in under 30 seconds. Submissions route directly to your <strong>Incoming</strong> tab for verification and dispatch planning.
              </p>
            </div>

            {/* Link Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Public URL
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-700 truncate select-all">
                  {publicDonateUrl}
                </div>
                <Button
                  id="btn-copy-donation-link"
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  icon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  className="shrink-0 min-h-[40px] px-3 font-semibold"
                >
                  {copied ? 'Copied' : 'Copy link'}
                </Button>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
              <Button
                id="btn-open-poster-modal"
                variant="primary"
                size="md"
                onClick={() => setIsPosterOpen(true)}
                icon={<Printer className="w-4 h-4" />}
                className="font-bold cursor-pointer"
              >
                Download / Print poster
              </Button>

              <Button
                variant="ghost"
                size="md"
                onClick={handleDownloadQr}
                icon={<Download className="w-4 h-4 text-slate-600" />}
                className="font-semibold text-slate-700 cursor-pointer"
              >
                Save QR PNG
              </Button>

              <a
                href={`/donate/${ngo.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test public page</span>
              </a>
            </div>
          </div>
        </div>
      </Card>

      {/* Printable Poster Modal */}
      {isPosterOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="poster-modal-title"
        >
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Controls Header (Hidden on print) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-600" />
                <h3 id="poster-modal-title" className="text-sm font-bold text-slate-900">
                  Printable Donation Poster Preview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPosterOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Poster Content Area (A4 / Printable layout) */}
            <div
              id="printable-poster-area"
              className="p-8 sm:p-10 bg-white text-center flex flex-col items-center justify-center space-y-6"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
                <span>{ngo.name} Surplus Food Rescue</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-2 max-w-md">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  Scan to donate surplus food. No app. No login.
                </h1>
                <p className="text-xs sm:text-sm text-slate-600">
                  Turn leftover meals, bakery batches, and party surplus into hot food for hungry families in our city.
                </p>
              </div>

              {/* Big High-Res QR Code Card */}
              <div className="p-4 bg-white rounded-3xl border-4 border-emerald-600 shadow-md flex flex-col items-center">
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt="Scan to donate"
                    className="w-56 h-56 sm:w-64 sm:h-64 rounded-2xl object-contain"
                  />
                )}
                <div className="pt-2 text-[11px] font-mono font-bold text-slate-600">
                  {publicDonateUrl}
                </div>
              </div>

              {/* 3 Steps */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-md pt-2 text-left">
                <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                  <span className="text-[10px] font-extrabold text-emerald-700 block">STEP 1</span>
                  <p className="text-[11px] font-bold text-slate-800">Scan QR code</p>
                  <p className="text-[10px] text-slate-500">Open with any phone camera</p>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                  <span className="text-[10px] font-extrabold text-emerald-700 block">STEP 2</span>
                  <p className="text-[11px] font-bold text-slate-800">30-Sec Form</p>
                  <p className="text-[10px] text-slate-500">Pick food type & portions</p>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                  <span className="text-[10px] font-extrabold text-emerald-700 block">STEP 3</span>
                  <p className="text-[11px] font-bold text-slate-800">Van Pickup</p>
                  <p className="text-[10px] text-slate-500">NGO collects at your door</p>
                </div>
              </div>

              {/* Footer Trust Note */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-100 w-full max-w-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified non-profit collection • Helpline: {ngo.phone}</span>
              </div>
            </div>

            {/* Modal Action Buttons Footer (Hidden on print) */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setIsPosterOpen(false)}
              >
                Close
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleDownloadQr}
                  icon={<Download className="w-4 h-4" />}
                >
                  Download PNG
                </Button>
                <Button
                  id="btn-print-poster-action"
                  variant="primary"
                  size="md"
                  onClick={handlePrint}
                  icon={<Printer className="w-4 h-4" />}
                >
                  Print Poster
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
