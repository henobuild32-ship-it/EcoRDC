'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type Promotion } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Plus,
  Tag,
  Trash2,
  Edit,
  Calendar,
  Percent,
  X,
  Loader2,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

interface PromotionForm {
  title: string;
  description: string;
  discount: string;
  startDate: string;
  endDate: string;
}

const emptyForm: PromotionForm = {
  title: '',
  description: '',
  discount: '',
  startDate: '',
  endDate: '',
};

export default function VendorPromotions() {
  const { token, setCurrentView } = useAppStore();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PromotionForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchPromotions = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/promotions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPromotions(data.promotions || []);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !form.title.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          discount: form.discount || undefined,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPromotions((prev) => [data.promotion, ...prev]);
        setForm(emptyForm);
        setShowForm(false);
      }
    } catch {
      // silently handle
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (promotion: Promotion) => {
    if (!token) return;
    setTogglingId(promotion.id);
    try {
      const res = await fetch('/api/promotions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          promotionId: promotion.id,
          isActive: !promotion.isActive,
        }),
      });
      if (res.ok) {
        setPromotions((prev) =>
          prev.map((p) =>
            p.id === promotion.id ? { ...p, isActive: !p.isActive } : p
          )
        );
      }
    } catch {
      // silently handle
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (promotionId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/promotions?id=${promotionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPromotions((prev) => prev.filter((p) => p.id !== promotionId));
      }
    } catch {
      // silently handle
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingId(promotion.id);
    setForm({
      title: promotion.title,
      description: promotion.description || '',
      discount: promotion.discount?.toString() || '',
      startDate: promotion.startDate ? new Date(promotion.startDate).toISOString().split('T')[0] : '',
      endDate: promotion.endDate ? new Date(promotion.endDate).toISOString().split('T')[0] : '',
    });
    setShowForm(true);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Stats
  const activePromos = promotions.filter(p => p.isActive).length;
  const totalPromos = promotions.length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView('vendor-dashboard')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Mes Promotions</h1>
          <p className="text-sm text-muted-foreground">
            {totalPromos} promotion{totalPromos !== 1 ? 's' : ''} · {activePromos} active{activePromos !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingId(null);
              setForm(emptyForm);
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Annuler
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Créer une promotion
            </>
          )}
        </Button>
      </motion.div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5 text-emerald-600" />
                  {editingId ? 'Modifier la promotion' : 'Nouvelle promotion'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label htmlFor="promo-title">
                        Titre <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="promo-title"
                        placeholder="Ex: Soldes d'été, Promotion spéciale..."
                        value={form.title}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, title: e.target.value }))
                        }
                        required
                        className="mt-1"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="promo-desc">Description</Label>
                      <Textarea
                        id="promo-desc"
                        placeholder="Décrivez votre promotion..."
                        value={form.description}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="promo-discount" className="flex items-center gap-1">
                        <Percent className="h-3.5 w-3.5" />
                        Réduction (%)
                      </Label>
                      <Input
                        id="promo-discount"
                        type="number"
                        min="1"
                        max="99"
                        placeholder="Ex: 20"
                        value={form.discount}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            discount: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="promo-start" className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Date de début
                      </Label>
                      <Input
                        id="promo-start"
                        type="date"
                        value={form.startDate}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="promo-end" className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Date de fin
                      </Label>
                      <Input
                        id="promo-end"
                        type="date"
                        value={form.endDate}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setForm(emptyForm);
                        setShowForm(false);
                        setEditingId(null);
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={submitting || !form.title.trim()}
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {editingId ? 'Mise à jour...' : 'Création...'}
                        </span>
                      ) : (
                        <>
                          {editingId ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                          {editingId ? 'Mettre à jour' : 'Créer la promotion'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promotions List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="h-24 w-24 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
                <Tag className="h-12 w-12 text-emerald-300 dark:text-emerald-700" />
              </div>
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                Aucune promotion
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Créez votre première promotion pour attirer plus de clients
              </p>
              <Button
                className="mt-6 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowForm(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer une promotion
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.map((promotion) => {
            const startFormatted = formatDate(promotion.startDate);
            const endFormatted = formatDate(promotion.endDate);
            const isActive = promotion.isActive;

            return (
              <motion.div key={promotion.id} variants={itemVariants}>
                <Card
                  className={`overflow-hidden group transition-shadow hover:shadow-md ${
                    !isActive ? 'opacity-70' : ''
                  }`}
                >
                  <div className={`h-2 ${isActive ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gray-300 dark:bg-gray-700'}`} />
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {promotion.title}
                        </h3>
                        {promotion.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                            {promotion.description}
                          </p>
                        )}
                      </div>
                      {promotion.discount && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 shrink-0 font-bold">
                          -{promotion.discount}%
                        </Badge>
                      )}
                    </div>

                    {/* Dates */}
                    {(startFormatted || endFormatted) && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {startFormatted || '...'} — {endFormatted || '...'}
                        </span>
                      </div>
                    )}

                    {/* Status & Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => handleToggleActive(promotion)}
                          disabled={togglingId === promotion.id}
                        />
                        <span className="text-xs text-muted-foreground">
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(promotion)}
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDelete(promotion.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
