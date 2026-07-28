import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'newest';
    const availability = searchParams.get('availability') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;

    if (availability === 'in_stock') where.stock = { gt: 0 };
    else if (availability === 'out_of_stock') where.stock = 0;
    else if (availability === 'low_stock') where.stock = { gt: 0, lte: 5 };

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    else if (sort === 'price_desc') orderBy = { price: 'desc' };
    else if (sort === 'best_sellers') orderBy = { soldCount: 'desc' };

    const shopWhere: any = { isActive: true };
    if (search) {
      shopWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await db.product.findMany({
      where: {
        ...where,
        shop: { isActive: true },
      },
      orderBy,
      skip,
      take: limit,
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            logo: true,
            city: true,
            avgRating: true,
            totalReviews: true,
            badges: true,
            deliveryFee: true,
            freeDeliveryMin: true,
          },
        },
        promotions: {
          include: {
            promotion: {
              select: { discount: true, endDate: true },
            },
          },
          where: {
            promotion: {
              isActive: true,
              endDate: { gte: new Date() },
              startDate: { lte: new Date() },
            },
          },
        },
        _count: { select: { reviews: true } },
      },
    });

    const formatted = (products as any[]).map((p) => {
      const promotion = p.promotions && p.promotions.length > 0 ? p.promotions[0].promotion : null;
      const { promotions, ...rest } = p;
      return { ...rest, promotion, reviews: [] };
    });

    return NextResponse.json({ products: formatted });
  } catch (error) {
    console.error('Catalog error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
