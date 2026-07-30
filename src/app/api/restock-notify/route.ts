import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const body = await request.json();
    const { productId } = body;

    if (!productId) return NextResponse.json({ error: 'productId requis' }, { status: 400 });

    const product = await db.product.findUnique({ where: { id: productId }, select: { id: true, name: true, stock: true } });
    if (!product) return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });

    const existing = await db.restockNotification.findUnique({
      where: { userId_productId: { userId: payload.userId, productId } },
    });

    if (existing) {
      await db.restockNotification.delete({ where: { id: existing.id } });
      return NextResponse.json({ subscribed: false, message: 'Désabonné du réapprovisionnement' });
    }

    await db.restockNotification.create({
      data: { userId: payload.userId, productId },
    });

    return NextResponse.json({ subscribed: true, message: 'Prévenu dès le réapprovisionnement' });
  } catch (error) {
    console.error('Restock notify POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (productId) {
      const existing = await db.restockNotification.findUnique({
        where: { userId_productId: { userId: payload.userId, productId } },
      });
      return NextResponse.json({ subscribed: !!existing });
    }

    const subscriptions = await db.restockNotification.findMany({
      where: { userId: payload.userId },
      include: { product: { select: { id: true, name: true, images: true, stock: true, price: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Restock notify GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
