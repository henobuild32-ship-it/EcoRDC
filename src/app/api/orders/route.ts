import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, generateOrderNumber, generateInvoiceNumber } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const status = searchParams.get('status');
    const orderId = searchParams.get('id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get single order by id
    if (orderId) {
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { product: { include: { shop: { select: { id: true, name: true, logo: true } } } } } },
          shop: { select: { id: true, name: true, slug: true, logo: true, address: true, city: true, country: true } },
          customer: { select: { id: true, name: true, email: true, phone: true, address: true, city: true } },
          invoice: true,
        },
      });

      if (!order) {
        return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
      }

      // Check access
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
    }

    // Build where clause based on role
    const where: Record<string, unknown> = {};
    if (payload.role === 'CLIENT') {
      where.customerId = payload.userId;
    } else if (payload.role === 'VENDOR') {
      const shop = await db.shop.findUnique({ where: { ownerId: payload.userId } });
      if (shop) where.shopId = shop.id;
    }
    // ADMIN sees all

    if (shopId) where.shopId = shopId;
    if (status) where.status = status;

    // Count total for pagination
    const total = await db.order.count({ where });
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const orders = await db.order.findMany({
      where,
      include: {
        items: { include: { product: { select: { id: true, name: true, price: true, images: true } } } },
        shop: { select: { id: true, name: true, slug: true, logo: true } },
        customer: { select: { id: true, name: true, email: true } },
        invoice: { select: { id: true, invoiceNumber: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Accès client requis' }, { status: 403 });
    }

    const body = await request.json();
    const { shopId, items, notes } = body;

    if (!shopId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Données de commande incomplètes' }, { status: 400 });
    }

    // Verify shop exists and is active
    const shop = await db.shop.findUnique({ where: { id: shopId } });
    if (!shop || !shop.isActive) {
      return NextResponse.json({ error: 'Boutique non trouvée ou inactive' }, { status: 400 });
    }

    let totalAmount = 0;
    const orderItems: { productId: string; quantity: number; price: number }[] = [];
    const previousStockMap: Record<string, number> = {};

    for (const item of items) {
      const product = await db.product.findUnique({ where: { id: item.productId } });
      if (!product || !product.isActive) {
        return NextResponse.json({ error: `Produit ${item.productId} non disponible` }, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `Stock insuffisant pour ${product.name}` }, { status: 400 });
      }
      previousStockMap[product.id] = product.stock;
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const orderNumber = generateOrderNumber();

    const order = await db.order.create({
      data: {
        orderNumber,
        customerId: payload.userId,
        shopId,
        totalAmount,
        notes,
        items: { create: orderItems },
      },
      include: {
        items: { include: { product: { select: { id: true, name: true, images: true } } } },
        shop: { select: { id: true, name: true, slug: true } },
      },
    });

    // Decrease product stock and check stock alerts
    const threshold = shop.lowStockThreshold ?? 5;
    for (const item of orderItems) {
      const previousStock = previousStockMap[item.productId] ?? 0;
      const updated = await db.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
      const newStock = updated.stock;

      // Out of stock -> notify vendor
      if (newStock === 0 && previousStock > 0) {
        await db.notification.create({
          data: {
            userId: shop.ownerId,
            title: '⚠️ Rupture de stock',
            message: `Le produit "${updated.name}" est en rupture de stock. Réapprovisionnez-le pour continuer les ventes.`,
            type: 'STOCK_ALERT',
            link: '/vendor-products',
            data: JSON.stringify({ productId: item.productId, stockLevel: 0 }),
          },
        });
      }

      // Low stock (just crossed below threshold) -> notify vendor
      if (newStock > 0 && newStock <= threshold && previousStock > threshold) {
        await db.notification.create({
          data: {
            userId: shop.ownerId,
            title: '📦 Stock faible',
            message: `Le produit "${updated.name}" a un stock faible (${newStock} unités restantes). Pensez à réapprovisionner.`,
            type: 'STOCK_ALERT',
            link: '/vendor-products',
            data: JSON.stringify({ productId: item.productId, stockLevel: newStock }),
          },
        });
      }
    }

    // Create notification for vendor
    if (shop) {
      await db.notification.create({
        data: {
          userId: shop.ownerId,
          title: 'Nouvelle commande',
          message: `Commande ${orderNumber} reçue - ${totalAmount.toFixed(2)} CDF`,
          type: 'ORDER',
        },
      });
    }

    // Clear cart for this shop's products
    await db.cartItem.deleteMany({
      where: { userId: payload.userId, product: { shopId } },
    });

    await db.activityLog.create({
      data: { userId: payload.userId, action: 'CREATE_ORDER', details: `Commande ${orderNumber}` },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Orders POST error:', error);
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
    const { orderId, status, notes } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'ID commande requis' }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true, shop: true },
    });
    if (!order) return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });

    // Only vendor or admin can update status (clients can cancel their own pending orders)
    if (payload.role === 'CLIENT') {
      if (status === 'CANCELLED' && order.customerId === payload.userId && order.status === 'PENDING') {
        // Allow client to cancel their own pending order
        // Restore stock
        for (const item of order.items) {
          await db.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      } else {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
    } else if (payload.role === 'VENDOR') {
      const shop = await db.shop.findUnique({ where: { id: order.shopId } });
      if (!shop || shop.ownerId !== payload.userId) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
    }
    // ADMIN can update any order

    // Validate status transitions
    const validStatuses = ['PENDING', 'CONFIRMED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await db.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: { include: { product: true } },
        shop: { select: { id: true, name: true, slug: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify customer about status change
    if (status) {
      const statusMessages: Record<string, string> = {
        CONFIRMED: 'Votre commande a été confirmée',
        PAID: 'Paiement confirmé pour votre commande',
        SHIPPED: 'Votre commande a été expédiée',
        DELIVERED: 'Votre commande a été livrée',
        CANCELLED: 'Votre commande a été annulée',
      };

      await db.notification.create({
        data: {
          userId: order.customerId,
          title: 'Commande mise à jour',
          message: `Commande ${order.orderNumber}: ${statusMessages[status] || status}`,
          type: 'ORDER',
        },
      });
    }

    // Auto-generate invoice when order is delivered
    if (status === 'DELIVERED') {
      const existingInvoice = await db.invoice.findUnique({ where: { orderId: order.id } });
      if (!existingInvoice) {
        const invoiceNumber = generateInvoiceNumber();
        await db.invoice.create({
          data: {
            invoiceNumber,
            orderId: order.id,
            shopId: order.shopId,
            customerId: order.customerId,
            totalAmount: order.totalAmount,
            status: 'PENDING',
          },
        });

        // Notify customer about invoice
        await db.notification.create({
          data: {
            userId: order.customerId,
            title: 'Facture disponible',
            message: `Facture pour la commande ${order.orderNumber} est disponible`,
            type: 'ORDER',
          },
        });
      }
    }

    // If cancelled, restore stock
    if (status === 'CANCELLED' && payload.role !== 'CLIENT') {
      for (const item of order.items) {
        await db.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error('Orders PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
