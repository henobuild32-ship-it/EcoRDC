import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/stock/check-alerts
 * Called internally (or by vendor) to check and send stock alerts.
 * 
 * Also exposed as a cron-like endpoint for periodic checks.
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const body = await request.json();
    const { productId, previousStock, newStock } = body;

    if (!productId) return NextResponse.json({ error: 'productId requis' }, { status: 400 });

    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        shop: {
          select: { id: true, name: true, ownerId: true, lowStockThreshold: true },
        },
      },
    });

    if (!product) return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });

    const threshold = product.shop.lowStockThreshold ?? 5;
    const results: string[] = [];

    // === Case 1: Stock went to 0 (out of stock) ===
    if (newStock === 0 && previousStock > 0) {
      // Notify vendor
      await db.notification.create({
        data: {
          userId: product.shop.ownerId,
          title: '⚠️ Rupture de stock',
          message: `Le produit "${product.name}" est en rupture de stock. Réapprovisionnez-le pour continuer les ventes.`,
          type: 'STOCK_ALERT',
          link: '/vendor-products',
          data: JSON.stringify({ productId, stockLevel: 0 }),
        },
      });
      results.push('vendor_notified_out_of_stock');
    }

    // === Case 2: Stock became low (≤ threshold and > 0) ===
    if (newStock > 0 && newStock <= threshold && previousStock > threshold) {
      // Notify vendor
      await db.notification.create({
        data: {
          userId: product.shop.ownerId,
          title: '📦 Stock faible',
          message: `Le produit "${product.name}" a un stock faible (${newStock} unités restantes). Pensez à réapprovisionner.`,
          type: 'STOCK_ALERT',
          link: '/vendor-products',
          data: JSON.stringify({ productId, stockLevel: newStock }),
        },
      });
      results.push('vendor_notified_low_stock');
    }

    // === Case 3: Stock was 0, now restocked ===
    if (previousStock === 0 && newStock > 0) {
      // Notify all clients who registered for restock notifications
      const restockWatchers = await db.restockNotification.findMany({
        where: { productId },
        include: {
          user: { select: { id: true, name: true } },
        },
      });

      if (restockWatchers.length > 0) {
        const productImages = product.images ? product.images.split(',').filter(Boolean) : [];
        const notifData = JSON.stringify({
          productId,
          productName: product.name,
          productImage: productImages[0] || null,
          shopName: product.shop.name,
        });

        // Create notifications for all watchers in batch
        await db.notification.createMany({
          data: restockWatchers.map((watcher) => ({
            userId: watcher.userId,
            title: '✅ Produit disponible !',
            message: `"${product.name}" de la boutique ${product.shop.name} est de nouveau en stock !`,
            type: 'RESTOCK',
            link: `/shop/${product.shopId}`,
            data: notifData,
          })),
        });

        // Clean up the restock notification entries since we've notified them
        await db.restockNotification.deleteMany({ where: { productId } });

        results.push(`${restockWatchers.length}_clients_notified_restock`);
      }

      // Also notify vendor that stock was replenished (useful if done by admin)
      await db.notification.create({
        data: {
          userId: product.shop.ownerId,
          title: '✅ Stock réapprovisionné',
          message: `Le produit "${product.name}" a été réapprovisionné (${newStock} unités). ${restockWatchers.length} client(s) ont été notifiés.`,
          type: 'STOCK_ALERT',
          link: '/vendor-products',
          data: JSON.stringify({ productId, stockLevel: newStock }),
        },
      });
      results.push('vendor_notified_restock');
    }

    return NextResponse.json({ success: true, actions: results });
  } catch (error) {
    console.error('Stock check-alerts error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * GET /api/stock/check-alerts
 * Returns stock status summary for vendor's shop
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    if (payload.role !== 'VENDOR' && payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès vendeur requis' }, { status: 403 });
    }

    const shop = await db.shop.findUnique({
      where: { ownerId: payload.userId },
      select: { id: true, lowStockThreshold: true },
    });

    if (!shop) return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 });

    const threshold = shop.lowStockThreshold ?? 5;

    const [outOfStock, lowStock, totalActive] = await Promise.all([
      db.product.count({ where: { shopId: shop.id, isActive: true, stock: 0 } }),
      db.product.count({
        where: { shopId: shop.id, isActive: true, stock: { gt: 0, lte: threshold } },
      }),
      db.product.count({ where: { shopId: shop.id, isActive: true } }),
    ]);

    // Products out of stock details
    const outOfStockProducts = await db.product.findMany({
      where: { shopId: shop.id, isActive: true, stock: 0 },
      select: {
        id: true,
        name: true,
        images: true,
        stock: true,
        restockNotifiers: { select: { userId: true } },
      },
    });

    const lowStockProducts = await db.product.findMany({
      where: { shopId: shop.id, isActive: true, stock: { gt: 0, lte: threshold } },
      select: { id: true, name: true, images: true, stock: true },
      orderBy: { stock: 'asc' },
    });

    return NextResponse.json({
      summary: {
        outOfStock,
        lowStock,
        totalActive,
        threshold,
      },
      outOfStockProducts: outOfStockProducts.map((p) => ({
        ...p,
        interestedClients: p.restockNotifiers.length,
      })),
      lowStockProducts,
    });
  } catch (error) {
    console.error('Stock check-alerts GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
