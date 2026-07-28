'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  MapPin,
  Phone,
  User,
  Home,
  Trash2,
  Star,
  Pencil,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface AddressData {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  province: string | null;
  city: string;
  commune: string | null;
  quartier: string | null;
  avenue: string | null;
  numero: string | null;
  reference: string | null;
  instructions: string | null;
  isDefault: boolean;
}

export function AddressManager({ onSelect, selectedId, onClose }: { onSelect?: (addr: AddressData) => void; selectedId?: string; onClose?: () => void }) {
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AddressData | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', province: '', city: '', commune: '', quartier: '', avenue: '', numero: '', reference: '', instructions: '', isDefault: false });

  const token = typeof window !== 'undefined' ? localStorage.getItem('ecordc_token') : null;

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/addresses', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAddresses(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchAddresses(); }, []);

  const resetForm = () => setForm({ firstName: '', lastName: '', phone: '', province: '', city: '', commune: '', quartier: '', avenue: '', numero: '', reference: '', instructions: '', isDefault: false });

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.phone || !form.city) { toast.error('Champs obligatoires : Prénom, Nom, Téléphone, Ville'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/addresses', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editing ? { addressId: editing.id, ...form } : form),
      });
      if (res.ok) { toast.success(editing ? 'Adresse modifiée' : 'Adresse ajoutée'); resetForm(); setEditing(null); setShowForm(false); fetchAddresses(); }
      else { const d = await res.json(); toast.error(d.error || 'Erreur'); }
    } catch { toast.error('Erreur de connexion'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette adresse ?')) return;
    try {
      const res = await fetch(`/api/addresses?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast.success('Adresse supprimée'); fetchAddresses(); }
    } catch { toast.error('Erreur'); }
  };

  const handleEdit = (a: AddressData) => { setForm({ firstName: a.firstName, lastName: a.lastName, phone: a.phone, province: a.province || '', city: a.city, commune: a.commune || '', quartier: a.quartier || '', avenue: a.avenue || '', numero: a.numero || '', reference: a.reference || '', instructions: a.instructions || '', isDefault: a.isDefault }); setEditing(a); setShowForm(true); };

  if (loading) return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Mes adresses</h3>
        {!showForm && <Button size="sm" onClick={() => { setEditing(null); resetForm(); setShowForm(true); }}><Plus className="h-4 w-4 mr-1" />Ajouter</Button>}
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h4 className="font-medium text-sm">{editing ? 'Modifier' : 'Nouvelle'} adresse</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Prénom *</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="h-9 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Nom *</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="h-9 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Téléphone *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-9 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Province</Label><Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="h-9 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Ville *</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-9 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Commune</Label><Input value={form.commune} onChange={(e) => setForm({ ...form, commune: e.target.value })} className="h-9 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Quartier</Label><Input value={form.quartier} onChange={(e) => setForm({ ...form, quartier: e.target.value })} className="h-9 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Avenue</Label><Input value={form.avenue} onChange={(e) => setForm({ ...form, avenue: e.target.value })} className="h-9 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Numéro</Label><Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} className="h-9 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Référence</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Ex: près du marché" className="h-9 text-sm" /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Instructions de livraison</Label><Input value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="h-9 text-sm" /></div>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="rounded" /><span>Définir comme adresse par défaut</span></label>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setEditing(null); }}>Annuler</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Modifier' : 'Ajouter'}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {addresses.length === 0 && !showForm && <p className="text-sm text-muted-foreground text-center py-4">Aucune adresse enregistrée.</p>}
        {addresses.map((a) => (
          <Card key={a.id} className={`cursor-pointer transition-colors hover:border-emerald-300 ${selectedId === a.id ? 'border-emerald-500 ring-1 ring-emerald-500' : ''}`} onClick={() => onSelect?.(a)}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="font-medium text-sm truncate">{a.firstName} {a.lastName}</span>
                    {a.isDefault && <Badge variant="outline" className="text-[10px] h-5 border-emerald-300 text-emerald-600"><Star className="h-3 w-3 mr-0.5" />Par défaut</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{a.avenue && `${a.avenue}, `}{a.numero && `${a.numero}, `}{a.quartier && `${a.quartier}, `}{a.commune && `${a.commune}, `}{a.city}{a.province && `, ${a.province}`}</p>
                  {a.reference && <p className="text-xs text-muted-foreground">Réf: {a.reference}</p>}
                  {a.instructions && <p className="text-xs text-muted-foreground">📝 {a.instructions}</p>}
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{a.phone}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleEdit(a); }}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
