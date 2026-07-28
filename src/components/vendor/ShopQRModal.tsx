'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Download,
  Share2,
  Copy,
  Check,
  X,
  QrCode,
  ExternalLink,
  MessageCircle,
  Facebook,
  Instagram,
  Twitter,
  Printer,
  Loader2,
} from 'lucide-react';

interface ShopQRModalProps {
  open: boolean;
  onClose: () => void;
  shopSlug: string;
  shopName: string;
}

export default function ShopQRModal({ open, onClose, shopSlug, shopName }: ShopQRModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const shopUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/shop/${shopSlug}`
      : `https://eco-rdc.vercel.app/shop/${shopSlug}`;

  const loadQR = useCallback(async () => {
    if (!shopSlug || !open) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/qr?slug=${shopSlug}&format=base64&size=400`);
      if (res.ok) {
        const data = await res.json();
        setQrDataUrl(data.dataUrl);
      } else {
        toast.error('Erreur lors de la génération du QR code');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [shopSlug, open]);

  useEffect(() => {
    if (open) loadQR();
    else setQrDataUrl(null);
  }, [open, loadQR]);

  const downloadQR = async (hd = false) => {
    try {
      toast.loading(hd ? 'Génération du QR HD...' : 'Téléchargement...');
      const format = hd ? 'png' : 'png';
      const size = hd ? 1200 : 400;
      const res = await fetch(`/api/shops/qr?slug=${shopSlug}&format=${format}&size=${size}${hd ? '&hd=true' : ''}`);
      if (!res.ok) throw new Error('Erreur');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = hd ? `${shopSlug}-qr-hd.png` : `${shopSlug}-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success('QR Code téléchargé !');
    } catch {
      toast.dismiss();
      toast.error('Erreur lors du téléchargement');
    }
  };

  const downloadSVG = async () => {
    try {
      toast.loading('Génération SVG...');
      const res = await fetch(`/api/shops/qr?slug=${shopSlug}&format=svg&size=400`);
      if (!res.ok) throw new Error('Erreur');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${shopSlug}-qr.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success('SVG téléchargé !');
    } catch {
      toast.dismiss();
      toast.error('Erreur');
    }
  };

  const handlePrint = () => {
    if (!qrDataUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${shopName}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: sans-serif; background: #fff; }
            img { width: 300px; height: 300px; image-rendering: crisp-edges; }
            h2 { margin-top: 16px; font-size: 20px; color: #064e3b; }
            p { color: #6b7280; font-size: 14px; margin-top: 4px; }
            .url { font-size: 12px; color: #374151; margin-top: 8px; word-break: break-all; text-align: center; max-width: 300px; }
          </style>
        </head>
        <body>
          <img src="${qrDataUrl}" alt="QR Code ${shopName}" />
          <h2>${shopName}</h2>
          <p>Scannez pour visiter notre boutique</p>
          <p class="url">${shopUrl}</p>
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const copyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shopUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = shopUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setLinkCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error('Erreur de copie');
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`🛍️ Découvrez ma boutique *${shopName}* sur EcoRDC !\n${shopUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shopUrl)}`, '_blank');
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`🛍️ Découvrez ma boutique ${shopName} sur EcoRDC ! ${shopUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const shareInstagram = () => {
    // Instagram doesn't support direct URL sharing, copy link instead
    copyLink();
    toast.info('Lien copié ! Collez-le dans votre story ou bio Instagram.');
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Boutique ${shopName}`,
          text: `🛍️ Découvrez ${shopName} sur EcoRDC !`,
          url: shopUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      copyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
              <QrCode className="h-6 w-6" />
              QR Code de la boutique
            </DialogTitle>
            <p className="text-emerald-100 text-sm mt-1">{shopName}</p>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5">
          {/* QR Code Display */}
          <div className="flex flex-col items-center">
            <div className="relative bg-white rounded-2xl p-4 shadow-lg border-4 border-emerald-100">
              {loading ? (
                <div className="w-48 h-48 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
                </div>
              ) : qrDataUrl ? (
                <motion.img
                  src={qrDataUrl}
                  alt={`QR Code ${shopName}`}
                  className="w-48 h-48 object-contain"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-50 rounded-xl">
                  <QrCode className="h-16 w-16 text-gray-300" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center max-w-xs break-all">
              {shopUrl}
            </p>
          </div>

          {/* Download Buttons */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Télécharger
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadQR(false)}
                className="flex flex-col h-auto py-2 gap-1 text-[11px] border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400"
                disabled={loading}
              >
                <Download className="h-4 w-4 text-emerald-600" />
                PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadQR(true)}
                className="flex flex-col h-auto py-2 gap-1 text-[11px] border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400"
                disabled={loading}
              >
                <Download className="h-4 w-4 text-emerald-600" />
                PNG HD
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadSVG}
                className="flex flex-col h-auto py-2 gap-1 text-[11px] border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400"
                disabled={loading}
              >
                <Download className="h-4 w-4 text-emerald-600" />
                SVG
              </Button>
            </div>
          </div>

          {/* Share buttons */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Partager
            </p>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={shareWhatsApp}
                className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50 transition-colors group"
                title="Partager sur WhatsApp"
              >
                <span className="text-lg">📱</span>
                <span className="text-[10px] font-medium text-green-700 dark:text-green-400">WhatsApp</span>
              </button>
              <button
                onClick={shareFacebook}
                className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 transition-colors"
                title="Partager sur Facebook"
              >
                <Facebook className="h-5 w-5 text-blue-600" />
                <span className="text-[10px] font-medium text-blue-700 dark:text-blue-400">Facebook</span>
              </button>
              <button
                onClick={shareInstagram}
                className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/30 dark:hover:bg-pink-950/50 transition-colors"
                title="Partager sur Instagram"
              >
                <Instagram className="h-5 w-5 text-pink-600" />
                <span className="text-[10px] font-medium text-pink-700 dark:text-pink-400">Instagram</span>
              </button>
              <button
                onClick={shareTwitter}
                className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/30 dark:hover:bg-sky-950/50 transition-colors"
                title="Partager sur X (Twitter)"
              >
                <Twitter className="h-5 w-5 text-sky-600" />
                <span className="text-[10px] font-medium text-sky-700 dark:text-sky-400">X</span>
              </button>
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={copyLink}
            >
              {linkCopied ? (
                <><Check className="h-4 w-4 mr-2" />Copié !</>
              ) : (
                <><Copy className="h-4 w-4 mr-2" />Copier le lien</>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={handlePrint}
              disabled={!qrDataUrl}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
          </div>

          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={shareNative}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Partager la boutique
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
