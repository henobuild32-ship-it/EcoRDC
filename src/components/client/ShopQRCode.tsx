'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  QrCode,
  Download,
  Printer,
  Share2,
  Loader2,
  Check,
  Copy,
  Facebook,
  Instagram,
  MessageCircle,
  X,
  Store,
} from 'lucide-react';
import { toast } from 'sonner';

interface ShopQRCodeProps {
  shopId: string;
  shopName: string;
  shopSlug: string;
}

export function ShopQRCode({ shopId, shopName, shopSlug }: ShopQRCodeProps) {
  const [showQR, setShowQR] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const shopUrl = `${window.location.origin}/shop/${shopSlug}`;
  const encodedUrl = encodeURIComponent(shopUrl);
  const encodedText = encodeURIComponent(`Découvrez ${shopName} sur EcoRDC !`);

  const handleDownload = async (format: 'png' | 'svg') => {
    setDownloading(format);
    try {
      const res = await fetch(`/api/shops/${shopId}/qrcode?format=${format}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode-${shopSlug}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`QR Code téléchargé (${format.toUpperCase()})`);
    } catch {
      toast.error('Erreur lors du téléchargement');
    } finally { setDownloading(null); }
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) { toast.error('Bloqué par le navigateur'); return; }
    win.document.write(`<html><head><title>QR Code - ${shopName}</title><style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fff}img{max-width:90vw;max-height:90vh}</style></head><body><img src="/api/shops/${shopId}/qrcode?format=png" /></body></html>`);
    win.document.close();
    win.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Lien copié !');
  };

  const shareLinks = [
    { label: 'WhatsApp', url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`, icon: MessageCircle, color: 'text-green-500 bg-green-50 hover:bg-green-100' },
    { label: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, icon: Facebook, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
    { label: 'Instagram', url: `https://www.instagram.com/share?url=${encodedUrl}`, icon: Instagram, color: 'text-pink-500 bg-pink-50 hover:bg-pink-100' },
    { label: 'X', url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, icon: X, color: 'text-gray-700 bg-gray-100 hover:bg-gray-200' },
  ];

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setShowQR(!showQR)} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/30 cursor-pointer">
        <QrCode className="mr-2 h-4 w-4" />
        QR Code
      </Button>

      {showQR && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
          <Card className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><QrCode className="h-5 w-5 text-emerald-500" />QR Code - {shopName}</CardTitle>
              <button type="button" onClick={() => setShowQR(false)} className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center cursor-pointer"><X className="h-4 w-4" /></button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <img src={`/api/shops/${shopId}/qrcode?format=png`} alt={`QR Code ${shopName}`} className="w-48 h-48 rounded-xl shadow-md" />
              </div>

              <p className="text-xs text-muted-foreground text-center">{shopUrl}</p>

              <Separator />

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Télécharger</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 cursor-pointer" onClick={() => handleDownload('png')} disabled={downloading !== null}>
                    {downloading === 'png' ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}PNG
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 cursor-pointer" onClick={() => handleDownload('svg')} disabled={downloading !== null}>
                    {downloading === 'svg' ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}SVG HD
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 cursor-pointer" onClick={handlePrint}>
                    <Printer className="h-3 w-3 mr-1" />Imprimer
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Partager</p>
                <div className="grid grid-cols-2 gap-2">
                  {shareLinks.map((link) => (
                    <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${link.color}`}>
                      <link.icon className="h-4 w-4" />{link.label}
                    </a>
                  ))}
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full cursor-pointer" onClick={handleCopyLink}>
                {copied ? <Check className="h-4 w-4 mr-1 text-emerald-500" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? 'Copié !' : 'Copier le lien'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
