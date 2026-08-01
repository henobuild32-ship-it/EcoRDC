import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Accès client requis' }, { status: 403 });
    }

    const body = await request.json();
    const { addressId } = body;

    if (!addressId) {
      return NextResponse.json({ error: 'Adresse de livraison requise' }, { status: 400 });
    }

    // Verify address belongs to user
    const address = await db.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== payload.userId) {
      return NextResponse.json({ error: 'Adresse non trouvée' }, { status: 404 });
    }

    // Fetch all cart items for this user with product and shop info
    const cartItems = await db.cartItem.findMany({
      where: { userId: payload.userId },
      include: {
        product: {
          include: {
            shop: { select: { id: true, name: true, logo: true, deliveryFee: true, freeDeliveryMin: true } },
          },
        },
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'Panier vide' }, { status: 400 });
    }

    // Validate all products are available and have sufficient stock
    for (const item of cartItems) {
      if (!item.product.isActive) {
        return NextResponse.json({ error: `Produit "${item.product.name}" non disponible` }, { status: 400 });
      }
      if (item.product.stock < item.quantity) {
        return NextResponse.json({ error: `Stock insuffisant pour "${item.product.name}"` }, { status: 400 });
      }
    }

    // Group cart items by shop
    const shopGroups: Record<string, typeof cartItems> = {};
    for (const item of cartItems) {
      const shopId = item.product.shop.id;
      if (!shopGroups[shopId]) shopGroups[shopId] = [];
      shopGroups[shopId].push(item);
    }

    const createdOrders: any[] = [];

    // Create one order per shop
    for (const [shopId, items] of Object.entries(shopGroups)) {
      const shop = items[0].product.shop;
      let subtotal = 0;
      const orderItemsData: { productId: string; quantity: number; price: number }[] = [];

      for (const item of items) {
        const itemTotal = item.product.price * item.quantity;
        subtotal += itemTotal;
        orderItemsData.push({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        });
      }

      const shippingFee = (shop.freeDeliveryMin && subtotal >= shop.freeDeliveryMin) ? 0 : (shop.deliveryFee || 2500);
      const discountAmount = 0;
      const totalAmount = subtotal + shippingFee - discountAmount;

      const orderNumber = `ECO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const order = await db.order.create({
        data: {
          orderNumber,
          customerId: payload.userId,
          shopId,
          subtotal,
          shippingFee,
          discountAmount,
          totalAmount,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          items: { create: orderItemsData },
          address: {
            create: {
              firstName: address.firstName,
              lastName: address.lastName,
              phone: address.phone,
              province: address.province,
              city: address.city,
              commune: address.commune,
              quartier: address.quartier,
              avenue: address.avenue,
              numero: address.numero,
              instructions: address.instructions,
            },
          },
        },
        include: {
          items: { include: { product: { select: { id: true, name: true, price: true, images: true } } } },
          shop: { select: { id: true, name: true, logo: true } },
          address: true,
        },
      });

      // Update product soldCount and check stock alerts
      const shopOwner = await db.shop.findUnique({
        where: { id: shopId },
        select: { ownerId: true, lowStockThreshold: true },
      });
      const threshold = shopOwner?.lowStockThreshold ?? 5;

      for (const item of orderItemsData) {
        const previousStock = items.find((i) => i.product.id === item.productId)?.product.stock ?? 0;
        const updated = await db.product.update({
          where: { id: item.productId },
          data: {
            soldCount: { increment: item.quantity },
            stock: { decrement: item.quantity },
          },
        });

        const newStock = updated.stock;

        // Out of stock -> notify vendor
        if (newStock === 0 && previousStock > 0 && shopOwner?.ownerId) {
          await db.notification.create({
            data: {
              userId: shopOwner.ownerId,
              title: '⚠️ Rupture de stock',
              message: `Le produit "${updated.name}" est en rupture de stock. Réapprovisionnez-le pour continuer les ventes.`,
              type: 'STOCK_ALERT',
              link: '/vendor-products',
              data: JSON.stringify({ productId: item.productId, stockLevel: 0 }),
            },
          });
        }

        // Low stock (just crossed below threshold) -> notify vendor
        if (newStock > 0 && newStock <= threshold && previousStock > threshold && shopOwner?.ownerId) {
          await db.notification.create({
            data: {
              userId: shopOwner.ownerId,
              title: '📦 Stock faible',
              message: `Le produit "${updated.name}" a un stock faible (${newStock} unités restantes). Pensez à réapprovisionner.`,
              type: 'STOCK_ALERT',
              link: '/vendor-products',
              data: JSON.stringify({ productId: item.productId, stockLevel: newStock }),
            },
          });
        }
      }

      // Notify vendor
      if (shopOwner?.ownerId) {
        await db.notification.create({
          data: {
            userId: shopOwner.ownerId,
            title: 'Nouvelle commande',
            message: `Commande ${orderNumber} reçue - ${totalAmount.toFixed(2)} CDF`,
            type: 'ORDER',
            link: `/orders/${order.id}`,
            data: JSON.stringify({ orderId: order.id, orderNumber, totalAmount, shopId, itemCount: orderItemsData.length }),
          },
        });
      }

      // Notify customer
      await db.notification.create({
        data: {
          userId: payload.userId,
          title: 'Commande confirmée',
          message: `Votre commande ${orderNumber} a été transmise à ${shop.name}`,
          type: 'ORDER',
          link: `/orders/${order.id}`,
          data: JSON.stringify({ orderId: order.id, orderNumber, totalAmount, shopName: shop.name }),
        },
      });

      createdOrders.push(order);
    }

    // Clear entire cart after successful checkout
    await db.cartItem.deleteMany({ where: { userId: payload.userId } });

    // Log activity
    await db.activityLog.create({
      data: {
        userId: payload.userId,
        action: 'CHECKOUT',
        details: `${createdOrders.length} commande(s) créée(s)`,
      },
    });

    return NextResponse.json({ orders: createdOrders }, { status: 201 });
  } catch (error) {
    console.error('Checkout POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
