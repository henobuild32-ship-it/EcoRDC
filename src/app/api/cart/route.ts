import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const cartItems = await db.cartItem.findMany({
      where: { userId: payload.userId },
      include: {
        product: {
          include: {
            shop: { select: { id: true, name: true, logo: true, slug: true } },
          },
        },
      },
      orderBy: { product: { name: 'asc' } },
    });

    // Calculate cart totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Group by shop for easier display
    const shopGroups: Record<string, {
      shop: { id: string; name: string; logo: string | null; slug: string | null };
      items: typeof cartItems;
      subtotal: number;
    }> = {};

    for (const item of cartItems) {
      const shopId = item.product.shop.id;
      if (!shopGroups[shopId]) {
        shopGroups[shopId] = {
          shop: item.product.shop,
          items: [],
          subtotal: 0,
        };
      }
      shopGroups[shopId].items.push(item);
      shopGroups[shopId].subtotal += item.product.price * item.quantity;
    }

    // Shipping estimate: free over 50000 CDF
    const shippingEstimate = subtotal >= 50000 ? 0 : 2500;

    return NextResponse.json({
      cartItems,
      shopGroups: Object.values(shopGroups),
      summary: {
        subtotal,
        shippingEstimate,
        total: subtotal + shippingEstimate,
        totalItems,
        totalShops: Object.keys(shopGroups).length,
        freeShippingThreshold: 50000,
        freeShippingRemaining: Math.max(0, 50000 - subtotal),
      },
    });
  } catch (error) {
    console.error('Cart GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Accès client requis' }, { status: 403 });
    }

    const body = await request.json();
    const { productId, quantity } = body;

    if (!productId) return NextResponse.json({ error: 'ID produit requis' }, { status: 400 });

    const addQuantity = quantity || 1;

    // Verify product exists and is active
    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) {
      return NextResponse.json({ error: 'Produit non disponible' }, { status: 400 });
    }

    const existing = await db.cartItem.findFirst({
      where: { userId: payload.userId, productId },
    });

    if (existing) {
      const newQuantity = existing.quantity + addQuantity;
      // Check stock
      if (product.stock < newQuantity) {
        return NextResponse.json({ error: 'Stock insuffisant' }, { status: 400 });
      }
      const updated = await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQuantity },
        include: { product: { include: { shop: { select: { id: true, name: true, logo: true } } } } },
      });
      return NextResponse.json({ cartItem: updated });
    }

    // Check stock
    if (product.stock < addQuantity) {
      return NextResponse.json({ error: 'Stock insuffisant' }, { status: 400 });
    }

    const cartItem = await db.cartItem.create({
      data: { userId: payload.userId, productId, quantity: addQuantity },
      include: { product: { include: { shop: { select: { id: true, name: true, logo: true } } } } },
    });

    return NextResponse.json({ cartItem }, { status: 201 });
  } catch (error) {
    console.error('Cart POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const body = await request.json();
    const { cartItemId, quantity } = body;

    if (!cartItemId || quantity === undefined) {
      return NextResponse.json({ error: 'cartItemId et quantity requis' }, { status: 400 });
    }

    if (quantity < 1) {
      return NextResponse.json({ error: 'La quantité doit être au moins 1' }, { status: 400 });
    }

    const cartItem = await db.cartItem.findUnique({
      where: { id: cartItemId },
    });

    if (!cartItem || cartItem.userId !== payload.userId) {
      return NextResponse.json({ error: 'Article non trouvé dans le panier' }, { status: 404 });
    }

    // Check stock
    const product = await db.product.findUnique({ where: { id: cartItem.productId } });
    if (product && product.stock < quantity) {
      return NextResponse.json({ error: 'Stock insuffisant' }, { status: 400 });
    }

    const updated = await db.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: { product: { include: { shop: { select: { id: true, name: true, logo: true } } } } },
    });

    return NextResponse.json({ cartItem: updated });
  } catch (error) {
    console.error('Cart PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get('id');
    const clearAll = searchParams.get('clearAll');
    const shopId = searchParams.get('shopId');

    if (clearAll === 'true') {
      await db.cartItem.deleteMany({ where: { userId: payload.userId } });
      return NextResponse.json({ success: true, message: 'Panier vidé' });
    }

    // Clear all items from a specific shop
    if (shopId) {
      await db.cartItem.deleteMany({
        where: {
          userId: payload.userId,
          product: { shopId },
        },
      });
      return NextResponse.json({ success: true, message: 'Articles de la boutique supprimés du panier' });
    }

    if (!cartItemId) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    const cartItem = await db.cartItem.findUnique({ where: { id: cartItemId } });
    if (!cartItem || cartItem.userId !== payload.userId) {
      return NextResponse.json({ error: 'Article non trouvé dans le panier' }, { status: 404 });
    }

    await db.cartItem.delete({ where: { id: cartItemId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
