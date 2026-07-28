import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const promotions = await db.promotion.findMany({
      where: {
        isActive: true,
        endDate: { gte: new Date() },
        startDate: { lte: new Date() },
      },
      include: {
        shop: {
          select: { id: true, name: true, slug: true, logo: true, category: true },
        },
        products: {
          include: {
            product: {
              select: { id: true, name: true, price: true, compareAtPrice: true, images: true },
            },
          },
          take: 8,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ promotions });
  } catch (error) {
    console.error('Promotions public GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
