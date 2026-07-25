import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const followedShops = await db.followedShop.findMany({
      where: { userId: payload.userId },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            description: true,
            category: true,
            city: true,
            country: true,
            isRecommended: true,
            isActive: true,
            _count: {
              select: {
                products: true,
                followers: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ followedShops });
  } catch (error) {
    console.error('Followed shops GET error:', error);
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
    const { shopId } = body;

    if (!shopId) return NextResponse.json({ error: 'shopId requis' }, { status: 400 });

    const shop = await db.shop.findUnique({ where: { id: shopId } });
    if (!shop) return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 });

    // Toggle behavior: unfollow if already following
    const existing = await db.followedShop.findUnique({
      where: { userId_shopId: { userId: payload.userId, shopId } },
    });

    if (existing) {
      await db.followedShop.delete({ where: { id: existing.id } });
      return NextResponse.json({ followed: false });
    }

    const followed = await db.followedShop.create({
      data: { userId: payload.userId, shopId },
    });

    return NextResponse.json({ followed: true, followedShop: followed });
  } catch (error) {
    console.error('Followed shops POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    // Support query param ?id=xxx for unfollowing by followedShop id
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const followed = await db.followedShop.findUnique({ where: { id } });
      if (!followed || followed.userId !== payload.userId) {
        return NextResponse.json({ error: 'Suivi non trouvé' }, { status: 404 });
      }
      await db.followedShop.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    // Also support body { shopId } for unfollowing by shop
    const body = await request.json();
    const { shopId } = body;

    if (!shopId) return NextResponse.json({ error: 'id ou shopId requis' }, { status: 400 });

    const followedShop = await db.followedShop.findUnique({
      where: { userId_shopId: { userId: payload.userId, shopId } },
    });

    if (!followedShop) {
      return NextResponse.json({ error: 'Abonnement non trouvé' }, { status: 404 });
    }

    await db.followedShop.delete({ where: { id: followedShop.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Followed shops DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
