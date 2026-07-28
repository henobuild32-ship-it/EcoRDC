'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, type Product } from '@/lib/store';
import { uploadImage } from '@/lib/upload';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Save,
  Loader2,
  Upload,
  X,
  ImagePlus,
  Package,
  Eye,
  FileEdit,
  GripVertical,
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

const categories = [
  'Électronique',
  'Mode & Vêtements',
  'Alimentation',
  'Maison & Déco',
  'Beauté & Santé',
  'Sports & Loisirs',
  'Livres & Médias',
  'Autres',
];

export default function VendorAddProduct() {
  const { token, selectedProduct, setCurrentView } = useAppStore();
  const isEditing = !!selectedProduct;

  const [name, setName] = useState(selectedProduct?.name || '');
  const [description, setDescription] = useState(selectedProduct?.description || '');
  const [shortDescription, setShortDescription] = useState((selectedProduct as any)?.shortDescription || '');
  const [price, setPrice] = useState(selectedProduct?.price?.toString() || '');
  const [compareAtPrice, setCompareAtPrice] = useState((selectedProduct as any)?.compareAtPrice?.toString() || '');
  const [sku, setSku] = useState((selectedProduct as any)?.sku || '');
  const [category, setCategory] = useState(selectedProduct?.category || '');
  const [subcategory, setSubcategory] = useState((selectedProduct as any)?.subcategory || '');
  const [brand, setBrand] = useState((selectedProduct as any)?.brand || '');
  const [stock, setStock] = useState(selectedProduct?.stock?.toString() || '');
  const [weight, setWeight] = useState((selectedProduct as any)?.weight?.toString() || '');
  const [weightUnit, setWeightUnit] = useState((selectedProduct as any)?.weightUnit || 'kg');
  const [dimensions, setDimensions] = useState((selectedProduct as any)?.dimensions || '');
  const [material, setMaterial] = useState((selectedProduct as any)?.material || '');
  const [origin, setOrigin] = useState((selectedProduct as any)?.origin || '');
  const [video, setVideo] = useState((selectedProduct as any)?.video || '');
  const [images, setImages] = useState<string[]>(
    selectedProduct?.images ? (selectedProduct.images as string).split(',').filter(Boolean) : []
  );
  const [isPublished, setIsPublished] = useState(selectedProduct?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || !token) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        // uploadImage tries /api/upload first, then falls back to base64.
        const url = await uploadImage(file);
        setImages((prev) => [...prev, url]);
      }
    } catch (e) {
      console.error('Image upload failed:', e);
      setMessage({ type: 'error', text: 'Erreur lors du téléchargement' });
      toast.error('Erreur lors du téléchargement de l\'image');
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleImageUpload(e.dataTransfer.files);
  };

  const handleSave = async (publish: boolean) => {
    if (!token || !name || !price) return;
    setSaving(true);
    try {
      const body = {
        name,
        description,
        shortDescription,
        price: parseFloat(price),
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
        sku,
        category,
        subcategory,
        brand,
        images: images.join(','),
        video,
        stock: parseInt(stock) || 0,
        weight: weight ? parseFloat(weight) : undefined,
        weightUnit,
        dimensions,
        material,
        origin,
        isActive: publish,
        ...(isEditing ? { productId: selectedProduct?.id } : {}),
      };

      const res = await fetch('/api/products', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setMessage({
          type: 'success',
          text: isEditing
            ? 'Produit mis à jour'
            : publish
            ? 'Produit publié avec succès'
            : 'Brouillon enregistré',
        });
        setTimeout(() => setCurrentView('vendor-products'), 1500);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Erreur' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Calculate discount percentage
  const discountPercent =
    compareAtPrice && price && parseFloat(compareAtPrice) > parseFloat(price)
      ? Math.round(((parseFloat(compareAtPrice) - parseFloat(price)) / parseFloat(compareAtPrice)) * 100)
      : 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView('vendor-products')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Modifier le produit' : 'Ajouter un produit'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? 'Modifiez les informations du produit'
              : 'Remplissez les informations de votre nouveau produit'}
          </p>
        </div>
      </motion.div>

      {/* Product Form */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600" />
              Informations du produit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="product-name">Nom du produit *</Label>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Smartphone Samsung Galaxy A54"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre produit en détail... Caractéristiques, avantages, spécifications..."
                rows={5}
                className="min-h-[120px]"
              />
            </div>

            {/* Price, Compare-at Price & Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-price">Prix (CDF) *</Label>
                <Input
                  id="product-price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compare-price" className="flex items-center gap-1">
                  Prix barré (CDF)
                  {discountPercent > 0 && (
                    <span className="text-xs text-emerald-600 font-normal ml-1">
                      -{discountPercent}%
                    </span>
                  )}
                </Label>
                <Input
                  id="compare-price"
                  type="number"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-stock">Stock</Label>
                <Input
                  id="product-stock"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subcategory & Brand */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subcategory">Sous-catégorie</Label>
                <Input id="subcategory" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} placeholder="Ex: Smartphones" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Marque</Label>
                <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ex: Samsung" />
              </div>
            </div>

            {/* Short description */}
            <div className="space-y-2">
              <Label htmlFor="short-desc">Résumé</Label>
              <Textarea id="short-desc" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Résumé court du produit" rows={2} className="min-h-[60px]" />
            </div>

            {/* Advanced fields toggle */}
            <div>
              <Button type="button" variant="ghost" size="sm" className="text-emerald-600 gap-1" onClick={() => setShowAdvanced(!showAdvanced)}>
                {showAdvanced ? 'Masquer' : 'Afficher'} les champs avancés
              </Button>
            </div>

            {showAdvanced && (
              <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <p className="text-sm font-medium text-muted-foreground">Informations complémentaires</p>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU / Référence</Label>
                  <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Ex: SAM-A54-BLK" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Poids</Label>
                    <Input id="weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" min="0" step="0.1" />
                  </div>
                  <div className="space-y-2">
                    <Label>Unité poids</Label>
                    <Select value={weightUnit} onValueChange={setWeightUnit}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">Grammes (g)</SelectItem>
                        <SelectItem value="kg">Kilogrammes (kg)</SelectItem>
                        <SelectItem value="lb">Livres (lb)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dimensions">Dimensions</Label>
                    <Input id="dimensions" value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="30x20x10 cm" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="material">Matière</Label>
                    <Input id="material" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Ex: Cuir, coton..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="origin">Origine</Label>
                    <Input id="origin" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Ex: RDC, Chine..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video">Lien vidéo (YouTube/Vimeo)</Label>
                  <Input id="video" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                </div>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border">
              <div className="flex items-center gap-3">
                {isPublished ? (
                  <Eye className="h-5 w-5 text-emerald-600" />
                ) : (
                  <FileEdit className="h-5 w-5 text-amber-600" />
                )}
                <div>
                  <p className="font-medium text-sm">
                    {isPublished ? 'Publié' : 'Brouillon'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPublished
                      ? 'Le produit sera visible par les clients'
                      : 'Le produit sera enregistré comme brouillon'}
                  </p>
                </div>
              </div>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>

            {/* Image Upload with Drag-and-Drop */}
            <div className="space-y-3">
              <Label>Images</Label>
              {/* Drop zone */}
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                  dragOver
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-muted-foreground/30 hover:border-emerald-500'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="hidden"
                  id="image-upload"
                  disabled={uploading}
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 text-muted-foreground mx-auto animate-spin" />
                  ) : (
                    <>
                      <GripVertical className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Glissez-déposez vos images ici
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ou cliquez pour sélectionner des fichiers
                      </p>
                    </>
                  )}
                </label>
              </div>
              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {images.map((img, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden border bg-muted group"
                    >
                      <img
                        src={img}
                        alt={`Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {index === 0 && (
                        <Badge className="absolute bottom-1 left-1 text-[9px] bg-emerald-600 text-white border-0 px-1.5 py-0">
                          Principal
                        </Badge>
                      )}
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-emerald-500 flex flex-col items-center justify-center cursor-pointer transition-colors bg-muted/30">
                    {uploading ? (
                      <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                    ) : (
                      <>
                        <ImagePlus className="h-6 w-6 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground mt-1">
                          Ajouter
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(e.target.files)}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleSave(true)}
                disabled={saving || !name || !price}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Mise à jour...' : 'Publication...'}
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    {isEditing ? 'Mettre à jour' : 'Publier'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                onClick={() => handleSave(false)}
                disabled={saving || !name}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Enregistrer comme brouillon
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCurrentView('vendor-products')}
                className="shrink-0"
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
