import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const shopId = searchParams.get('shopId');

    if (productId) {
      const reviews = await db.review.findMany({
        where: { productId, isActive: true },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ reviews });
    }

    if (shopId) {
      const reviews = await db.review.findMany({
        where: { shopId, isActive: true },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const aggregation = await db.review.aggregate({
        where: { shopId, isActive: true },
        _avg: { rating: true },
        _count: { rating: true },
      });

      return NextResponse.json({
        reviews,
        averageRating: aggregation._avg.rating ?? 0,
        totalReviews: aggregation._count.rating,
      });
    }

    return NextResponse.json({ error: 'productId or shopId required' }, { status: 400 });
  } catch (error) {
    console.error('Reviews GET error:', error);
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
    const { productId, shopId, rating, comment, images } = body;

    if (!productId || !shopId || !rating) {
      return NextResponse.json({ error: 'productId, shopId et rating requis' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Verify product exists
    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });

    // Check if user has purchased this product
    let isVerifiedPurchase = false;
    const orderWithProduct = await db.order.findFirst({
      where: {
        customerId: payload.userId,
        status: 'DELIVERED',
        items: { some: { productId } },
      },
    });
    if (orderWithProduct) {
      isVerifiedPurchase = true;
    }

    const review = await db.review.create({
      data: {
        productId,
        userId: payload.userId,
        shopId,
        rating,
        comment,
        images: images || null,
        isVerifiedPurchase,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Vous avez déjà évalué ce produit' }, { status: 409 });
    }
    console.error('Reviews POST error:', error);
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
    const { reviewId, rating, comment, images } = body;

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId requis' }, { status: 400 });
    }

    const existing = await db.review.findUnique({ where: { id: reviewId } });
    if (!existing) return NextResponse.json({ error: 'Avis non trouvé' }, { status: 404 });
    if (existing.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (rating !== undefined) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment;
    if (images !== undefined) updateData.images = images;

    const review = await db.review.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Reviews PUT error:', error);
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
    const reviewId = searchParams.get('id');

    if (!reviewId) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    const review = await db.review.findUnique({ where: { id: reviewId } });
    if (!review) return NextResponse.json({ error: 'Avis non trouvé' }, { status: 404 });
    if (review.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    await db.review.delete({ where: { id: reviewId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reviews DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
