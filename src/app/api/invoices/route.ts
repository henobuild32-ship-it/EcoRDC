import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, generateInvoiceNumber } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (invoiceId) {
      const invoice = await db.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          order: {
            include: {
              items: { include: { product: { select: { id: true, name: true, price: true, images: true } } } },
              customer: { select: { id: true, name: true, email: true, phone: true, address: true, city: true } },
              shop: { include: { owner: { select: { id: true, name: true } } } },
            },
          },
        },
      });

      if (!invoice) return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });

      // Check access
      if (payload.role === 'CLIENT' && invoice.customerId !== payload.userId) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
      if (payload.role === 'VENDOR') {
        const shop = await db.shop.findUnique({ where: { ownerId: payload.userId } });
        if (!shop || invoice.shopId !== shop.id) {
          return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }
      }

      return NextResponse.json({ invoice });
    }

    let where: Record<string, unknown> = {};
    if (payload.role === 'VENDOR') {
      const shop = await db.shop.findUnique({ where: { ownerId: payload.userId } });
      if (shop) where.shopId = shop.id;
    } else if (payload.role === 'CLIENT') {
      where.customerId = payload.userId;
    }

    if (status) where.status = status;

    const total = await db.invoice.count({ where });
    const totalPages = Math.ceil(total / limit);

    const invoices = await db.invoice.findMany({
      where,
      include: {
        order: {
          include: {
            items: { include: { product: { select: { id: true, name: true, price: true } } } },
            customer: { select: { id: true, name: true, email: true } },
            shop: { select: { id: true, name: true, logo: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Invoices GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'VENDOR' && payload.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Accès vendeur ou admin requis' }, { status: 403 });
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) return NextResponse.json({ error: 'ID commande requis' }, { status: 400 });

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order) return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });

    // Verify vendor owns this order's shop
    if (payload.role === 'VENDOR') {
      const shop = await db.shop.findUnique({ where: { ownerId: payload.userId } });
      if (!shop || order.shopId !== shop.id) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
    }

    const existingInvoice = await db.invoice.findUnique({ where: { orderId } });
    if (existingInvoice) return NextResponse.json({ error: 'Facture déjà créée', invoice: existingInvoice }, { status: 409 });

    const invoiceNumber = generateInvoiceNumber();

    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        orderId,
        shopId: order.shopId,
        customerId: order.customerId,
        totalAmount: order.totalAmount,
        status: 'PENDING',
      },
      include: {
        order: {
          include: {
            items: { include: { product: { select: { id: true, name: true, price: true } } } },
            customer: { select: { id: true, name: true, email: true } },
            shop: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Notify customer
    await db.notification.create({
      data: {
        userId: order.customerId,
        title: 'Facture créée',
        message: `Facture ${invoiceNumber} pour commande ${order.orderNumber}`,
        type: 'ORDER',
      },
    });

    await db.activityLog.create({
      data: { userId: payload.userId, action: 'CREATE_INVOICE', details: `Facture ${invoiceNumber}` },
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error('Invoices POST error:', error);
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
    const { invoiceId, status } = body;

    if (!invoiceId || !status) {
      return NextResponse.json({ error: 'invoiceId et status requis' }, { status: 400 });
    }

    const validStatuses = ['PENDING', 'PAID'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });

    // Check access
    if (payload.role === 'VENDOR') {
      const shop = await db.shop.findUnique({ where: { ownerId: payload.userId } });
      if (!shop || invoice.shopId !== shop.id) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
    } else if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const updated = await db.invoice.update({
      where: { id: invoiceId },
      data: { status },
    });

    // Notify customer if invoice is paid
    if (status === 'PAID') {
      await db.notification.create({
        data: {
          userId: invoice.customerId,
          title: 'Facture payée',
          message: `Facture ${invoice.invoiceNumber} a été marquée comme payée`,
          type: 'ORDER',
        },
      });
    }

    return NextResponse.json({ invoice: updated });
  } catch (error) {
    console.error('Invoices PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
