import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// POST /api/stock/restock-notify - Register interest for restock
// DELETE /api/stock/restock-notify - Unregister interest
// GET /api/stock/restock-notify - Check if user is registered for a product

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      // Return all products user is watching
      const notifications = await db.restockNotification.findMany({
        where: { userId: payload.userId },
        include: {
          product: {
            select: { id: true, name: true, stock: true, images: true, price: true },
          },
        },
      });
      return NextResponse.json({ notifications });
    }

    const existing = await db.restockNotification.findUnique({
      where: { userId_productId: { userId: payload.userId, productId } },
    });

    return NextResponse.json({ isRegistered: !!existing });
  } catch (error) {
    console.error('Restock notify GET error:', error);
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

    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, stock: true, name: true },
    });

    if (!product) return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });

    if (product.stock > 0) {
      return NextResponse.json({ error: 'Ce produit est déjà en stock' }, { status: 400 });
    }

    const existing = await db.restockNotification.findUnique({
      where: { userId_productId: { userId: payload.userId, productId } },
    });

    if (existing) {
      return NextResponse.json({ success: true, message: 'Déjà enregistré' });
    }

    await db.restockNotification.create({
      data: { userId: payload.userId, productId },
    });

    return NextResponse.json({ success: true, message: 'Vous serez notifié dès que ce produit est disponible' });
  } catch (error) {
    console.error('Restock notify POST error:', error);
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
    const productId = searchParams.get('productId');

    if (!productId) return NextResponse.json({ error: 'productId requis' }, { status: 400 });

    await db.restockNotification.deleteMany({
      where: { userId: payload.userId, productId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Restock notify DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
