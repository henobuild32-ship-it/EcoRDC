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

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
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
    const { name, description, price, images, category, stock } = body;

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
        price: parseFloat(price),
        images: images || '',
        category,
        stock: stock ? parseInt(stock) : 0,
        shopId: shop.id,
      },
      include: {
        shop: { select: { id: true, name: true, logo: true, slug: true } },
      },
    });

    await db.activityLog.create({
      data: { userId: payload.userId, action: 'CREATE_PRODUCT', details: `Produit: ${name}` },
    });

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
    const { productId, name, description, price, images, category, stock, isActive } = body;

    if (!productId) return NextResponse.json({ error: 'productId requis' }, { status: 400 });

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });

    if (payload.role !== 'ADMIN') {
      const shop = await db.shop.findUnique({ where: { id: product.shopId } });
      if (!shop || shop.ownerId !== payload.userId) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (images !== undefined) updateData.images = images;
    if (category !== undefined) updateData.category = category;
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await db.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        shop: { select: { id: true, name: true, logo: true, slug: true } },
      },
    });

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
