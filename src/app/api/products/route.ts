import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const productId = searchParams.get('id');

    // Get single product by id
    if (productId) {
      const product = await db.product.findUnique({
        where: { id: productId },
        include: {
          shop: { select: { id: true, name: true, logo: true, slug: true, city: true } },
        },
      });
      if (!product) {
        return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
      }
      return NextResponse.json({ product });
    }

    const where: Record<string, unknown> = { isActive: true };

    if (shopId) where.shopId = shopId;

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (category) where.category = category;

    // Check if vendor is requesting their own products
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (token) {
      try {
        const payload = verifyToken(token);
        if (payload?.role === 'VENDOR') {
          const shop = await db.shop.findUnique({ where: { ownerId: payload.userId } });
          if (shop) {
            where.shopId = shop.id;
            delete where.isActive; // Vendors see all their products including inactive
          }
        }
      } catch {
        // Invalid token, just show active products
      }
    }

    // Count total for pagination
    const total = await db.product.count({ where });
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const products = await db.product.findMany({
      where,
      include: {
        shop: { select: { id: true, name: true, logo: true, slug: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return NextResponse.json(
      {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
        },
      }
    );
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Accès vendeur requis' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, shortDescription, price, compareAtPrice, sku, category, subcategory, brand, images, video, stock, weight, weightUnit, dimensions, material, origin } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Nom et prix requis' }, { status: 400 });
    }

    if (parseFloat(price) < 0) {
      return NextResponse.json({ error: 'Le prix doit être positif' }, { status: 400 });
    }

    const shop = await db.shop.findUnique({ where: { ownerId: payload.userId } });
    if (!shop) return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 });

    const product = await db.product.create({
      data: {
        name,
        description,
        shortDescription,
        price: parseFloat(price),
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        sku,
        category,
        subcategory,
        brand,
        images: images || '',
        video,
        stock: stock ? parseInt(stock) : 0,
        weight: weight ? parseFloat(weight) : null,
        weightUnit,
        dimensions,
        material,
        origin,
        shopId: shop.id,
      },
      include: {
        shop: { select: { id: true, name: true, logo: true, slug: true } },
      },
    });

    await db.activityLog.create({
      data: { userId: payload.userId, action: 'CREATE_PRODUCT', details: `Produit: ${name}` },
    });

    // === GLOBAL NOTIFICATION ON NEW PRODUCT PUBLICATION ===
    try {
      // 1. Get followers of the shop
      const followers = await db.followedShop.findMany({
        where: { shopId: shop.id },
        select: { userId: true },
      });

      // 2. Get all active CLIENT users (excluding vendor owner)
      const clients = await db.user.findMany({
        where: { role: 'CLIENT', isActive: true, id: { not: payload.userId } },
        select: { id: true },
      });

      // Combine unique recipient user IDs
      const recipientIds = Array.from(
        new Set([...followers.map((f) => f.userId), ...clients.map((c) => c.id)])
      );

      if (recipientIds.length > 0) {
        const notificationsData = recipientIds.map((userId) => ({
          userId,
          title: `Nouveau produit sur ${shop.name} ! 🛍️`,
          message: `La boutique "${shop.name}" vient de publier "${product.name}" (${product.price.toLocaleString('fr-FR')} CDF).`,
          type: 'NEW_PRODUCT',
          link: `/shop/${shop.slug}`,
          data: JSON.stringify({
            productId: product.id,
            shopId: shop.id,
            shopName: shop.name,
            productName: product.name,
            price: product.price,
          }),
        }));

        await db.notification.createMany({
          data: notificationsData,
        });
      }
    } catch (notifErr) {
      console.error('[PRODUCT PUBLICATION NOTIFICATION ERROR]:', notifErr);
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Products POST error:', error);
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
    const { productId, name, description, shortDescription, price, compareAtPrice, sku, category, subcategory, brand, images, video, stock, weight, weightUnit, dimensions, material, origin, isActive } = body;

    if (!productId) return NextResponse.json({ error: 'productId requis' }, { status: 400 });

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });

    if (payload.role !== 'ADMIN') {
      const shop = await db.shop.findUnique({ where: { id: product.shopId } });
      if (!shop || shop.ownerId !== payload.userId) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
    }

    const previousStock = product.stock;

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (compareAtPrice !== undefined) updateData.compareAtPrice = compareAtPrice ? parseFloat(compareAtPrice) : null;
    if (sku !== undefined) updateData.sku = sku;
    if (category !== undefined) updateData.category = category;
    if (subcategory !== undefined) updateData.subcategory = subcategory;
    if (brand !== undefined) updateData.brand = brand;
    if (images !== undefined) updateData.images = images;
    if (video !== undefined) updateData.video = video;
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null;
    if (weightUnit !== undefined) updateData.weightUnit = weightUnit;
    if (dimensions !== undefined) updateData.dimensions = dimensions;
    if (material !== undefined) updateData.material = material;
    if (origin !== undefined) updateData.origin = origin;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await db.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        shop: { select: { id: true, name: true, logo: true, slug: true } },
      },
    });

    // === STOCK ALERT LOGIC ===
    if (stock !== undefined) {
      const newStock = parseInt(stock);
      if (newStock !== previousStock) {
        const shop = await db.shop.findUnique({
          where: { id: product.shopId },
          select: { ownerId: true, name: true, lowStockThreshold: true },
        });
        if (shop) {
          const threshold = shop.lowStockThreshold ?? 5;

          // Out of stock
          if (newStock === 0 && previousStock > 0) {
            await db.notification.create({
              data: {
                userId: shop.ownerId,
                title: '⚠️ Rupture de stock',
                message: `Le produit "${updated.name}" est en rupture de stock. Réapprovisionnez-le pour continuer les ventes.`,
                type: 'STOCK_ALERT',
                link: '/vendor-products',
                data: JSON.stringify({ productId, stockLevel: 0 }),
              },
            });
          }

          // Low stock (just went below threshold)
          if (newStock > 0 && newStock <= threshold && previousStock > threshold) {
            await db.notification.create({
              data: {
                userId: shop.ownerId,
                title: '📦 Stock faible',
                message: `Le produit "${updated.name}" a un stock faible (${newStock} unités restantes). Pensez à réapprovisionner.`,
                type: 'STOCK_ALERT',
                link: '/vendor-products',
                data: JSON.stringify({ productId, stockLevel: newStock }),
              },
            });
          }

          // Restocked (was 0, now > 0)
          if (previousStock === 0 && newStock > 0) {
            const restockWatchers = await db.restockNotification.findMany({
              where: { productId },
            });

            if (restockWatchers.length > 0) {
              const productImages = updated.images ? updated.images.split(',').filter(Boolean) : [];
              const notifData = JSON.stringify({
                productId,
                productName: updated.name,
                productImage: productImages[0] || null,
                shopName: shop.name,
              });

              await db.notification.createMany({
                data: restockWatchers.map((w) => ({
                  userId: w.userId,
                  title: '✅ Produit disponible !',
                  message: `"${updated.name}" de la boutique ${shop.name} est de nouveau en stock !`,
                  type: 'RESTOCK',
                  link: `/shop/${product.shopId}`,
                  data: notifData,
                })),
              });

              // Clean up watched items
              await db.restockNotification.deleteMany({ where: { productId } });
            }

            // Notify vendor
            await db.notification.create({
              data: {
                userId: shop.ownerId,
                title: '✅ Stock réapprovisionné',
                message: `Le produit "${updated.name}" a été réapprovisionné (${newStock} unités). ${restockWatchers.length} client(s) ont été notifiés.`,
                type: 'STOCK_ALERT',
                link: '/vendor-products',
                data: JSON.stringify({ productId, stockLevel: newStock, notifiedClients: restockWatchers.length }),
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error('Products PUT error:', error);
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
    const productId = searchParams.get('id');

    if (!productId) return NextResponse.json({ error: 'ID produit requis' }, { status: 400 });

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });

    if (payload.role !== 'ADMIN') {
      const shop = await db.shop.findUnique({ where: { id: product.shopId } });
      if (!shop || shop.ownerId !== payload.userId) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
    }

    await db.product.update({ where: { id: productId }, data: { isActive: false } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Products DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
