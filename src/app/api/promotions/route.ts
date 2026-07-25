import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    let where: Record<string, unknown> = {};

    if (payload.role === 'VENDOR') {
      // Vendors see their own promotions
      const vendorShop = await db.shop.findUnique({ where: { ownerId: payload.userId } });
      if (vendorShop) {
        where.shopId = vendorShop.id;
      } else {
        return NextResponse.json({ promotions: [] });
      }
    } else {
      // Clients and admins see active promotions
      where.isActive = true;
    }

    // Filter by shopId if provided
    if (shopId) {
      where.shopId = shopId;
    }

    const promotions = await db.promotion.findMany({
      where,
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ promotions });
  } catch (error) {
    console.error('Promotions GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    if (payload.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Seuls les vendeurs peuvent créer des promotions' }, { status: 403 });
    }

    const vendorShop = await db.shop.findUnique({ where: { ownerId: payload.userId } });
    if (!vendorShop) {
      return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, discount, startDate, endDate } = body;

    if (!title) {
      return NextResponse.json({ error: 'Le titre est requis' }, { status: 400 });
    }

    if (discount !== undefined && (discount < 0 || discount > 100)) {
      return NextResponse.json({ error: 'La remise doit être entre 0 et 100' }, { status: 400 });
    }

    // Validate dates
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json({ error: 'La date de fin doit être après la date de début' }, { status: 400 });
    }

    const promotion = await db.promotion.create({
      data: {
        shopId: vendorShop.id,
        title,
        description: description || null,
        discount: discount ?? null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: true,
      },
    });

    return NextResponse.json({ promotion }, { status: 201 });
  } catch (error) {
    console.error('Promotions POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    if (payload.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Seuls les vendeurs peuvent modifier des promotions' }, { status: 403 });
    }

    const vendorShop = await db.shop.findUnique({ where: { ownerId: payload.userId } });
    if (!vendorShop) {
      return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 });
    }

    const body = await request.json();
    const { promotionId, title, description, discount, startDate, endDate, isActive } = body;

    if (!promotionId) {
      return NextResponse.json({ error: 'promotionId requis' }, { status: 400 });
    }

    // Verify the promotion belongs to this vendor's shop
    const existing = await db.promotion.findUnique({ where: { id: promotionId } });
    if (!existing) {
      return NextResponse.json({ error: 'Promotion non trouvée' }, { status: 404 });
    }
    if (existing.shopId !== vendorShop.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (discount !== undefined) updateData.discount = discount;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const promotion = await db.promotion.update({
      where: { id: promotionId },
      data: updateData,
    });

    return NextResponse.json({ promotion });
  } catch (error) {
    console.error('Promotions PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    if (payload.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Seuls les vendeurs peuvent supprimer des promotions' }, { status: 403 });
    }

    const vendorShop = await db.shop.findUnique({ where: { ownerId: payload.userId } });
    if (!vendorShop) {
      return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 });
    }

    const body = await request.json();
    const { promotionId } = body;

    if (!promotionId) {
      return NextResponse.json({ error: 'promotionId requis' }, { status: 400 });
    }

    // Verify the promotion belongs to this vendor's shop
    const existing = await db.promotion.findUnique({ where: { id: promotionId } });
    if (!existing) {
      return NextResponse.json({ error: 'Promotion non trouvée' }, { status: 404 });
    }
    if (existing.shopId !== vendorShop.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    await db.promotion.delete({
      where: { id: promotionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Promotions DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
