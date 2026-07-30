'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function RestockSubscribeButton({ productId }: { productId: string }) {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('ecordc_token');
    if (!token) { setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch(`/api/restock-notify?productId=${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSubscribed(data.subscribed);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, [productId]);

  const handleToggle = async () => {
    const token = localStorage.getItem('ecordc_token');
    if (!token) { toast.error('Connectez-vous pour être prévenu'); return; }
    setToggling(true);
    try {
      const res = await fetch('/api/restock-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSubscribed(data.subscribed);
        toast.success(data.message);
      }
    } catch { toast.error('Erreur'); } finally { setToggling(false); }
  };

  if (loading) return null;

  return (
    <Button
      variant={subscribed ? 'outline' : 'default'}
      size="sm"
      onClick={handleToggle}
      disabled={toggling}
      className={subscribed ? 'border-orange-200 text-orange-600 hover:bg-orange-50 cursor-pointer' : 'bg-orange-500 hover:bg-orange-600 text-white cursor-pointer'}
    >
      {toggling ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : subscribed ? <BellOff className="h-4 w-4 mr-1" /> : <Bell className="h-4 w-4 mr-1" />}
      {subscribed ? 'Ne plus notifier' : 'Prévenez-moi du réapprovisionnement'}
    </Button>
  );
}
