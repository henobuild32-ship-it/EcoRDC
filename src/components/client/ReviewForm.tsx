'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Loader2, Send, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';

interface ReviewFormProps {
  productId: string;
  productName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ productId, productName, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error('Veuillez donner une note'); return; }
    if (!comment.trim()) { toast.error('Veuillez écrire un commentaire'); return; }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('ecordc_token');
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, rating, comment: comment.trim() }),
      });

      if (res.ok) {
        toast.success('Avis publié avec succès !');
        setRating(0);
        setComment('');
        onSuccess?.();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la publication');
      }
    } catch { toast.error('Erreur de connexion'); } finally { setSubmitting(false); }
  };

  const labels = ['', 'Très mauvais', 'Mauvais', 'Moyen', 'Bon', 'Excellent'];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Donner mon avis{productName ? ` sur ${productName}` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Note</Label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground/30'
                  } transition-colors`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="text-sm text-muted-foreground ml-2">{labels[rating]}</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="review-comment">Commentaire</Label>
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Partagez votre expérience avec ce produit..."
            rows={4}
            className="min-h-[100px] resize-none"
          />
          <p className="text-[10px] text-muted-foreground text-right">{comment.length}/500</p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ThumbsUp className="h-3.5 w-3.5" />
            Votre avis aide les autres acheteurs
          </div>
          <div className="flex gap-2">
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Annuler
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || !comment.trim() || submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Publier
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
