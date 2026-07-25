import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const favorites = await db.favorite.findMany({
      where: { userId: payload.userId },
      include: {
        product: {
          include: {
            shop: {
              select: { id: true, name: true, logo: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Favorites GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const body = await request.json();
    const { productId } = body;

    if (!productId) return NextResponse.json({ error: 'productId requis' }, { status: 400 });

    // Check if product exists
    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });

    // Check if already favorited - toggle behavior
    const existing = await db.favorite.findUnique({
      where: { userId_productId: { userId: payload.userId, productId } },
    });

    if (existing) {
      // Toggle: remove if exists
      await db.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    }

    const favorite = await db.favorite.create({
      data: { userId: payload.userId, productId },
    });

    return NextResponse.json({ favorited: true, favorite });
  } catch (error) {
    console.error('Favorites POST error:', error);
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
    const favoriteId = searchParams.get('id');

    if (!favoriteId) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    const favorite = await db.favorite.findUnique({ where: { id: favoriteId } });
    if (!favorite || favorite.userId !== payload.userId) {
      return NextResponse.json({ error: 'Favori non trouvé' }, { status: 404 });
    }

    await db.favorite.delete({ where: { id: favoriteId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Favorites DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
