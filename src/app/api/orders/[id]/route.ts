import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { include: { shop: { select: { id: true, name: true, logo: true } } } } } },
        shop: { select: { id: true, name: true, slug: true, logo: true, address: true, city: true, country: true } },
        customer: { select: { id: true, name: true, email: true, phone: true, address: true, city: true } },
        invoice: true,
        address: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    if (payload.role === 'CLIENT' && order.customerId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    if (payload.role === 'VENDOR') {
      const shop = await db.shop.findUnique({ where: { ownerId: payload.userId } });
      if (!shop || order.shopId !== shop.id) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
