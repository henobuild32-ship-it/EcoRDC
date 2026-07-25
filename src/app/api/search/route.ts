import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || searchParams.get('query');
    const type = searchParams.get('type'); // 'shops', 'products', or null for all
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ error: 'Paramètre de recherche requis' }, { status: 400 });
    }

    const searchTerm = q.trim();
    const results: {
      shops?: Array<Record<string, unknown>>;
      products?: Array<Record<string, unknown>>;
      totalShops?: number;
      totalProducts?: number;
    } = {};

    // Search shops
    if (!type || type === 'shops') {
      const shops = await db.shop.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: searchTerm } },
            { description: { contains: searchTerm } },
            { category: { contains: searchTerm } },
            { city: { contains: searchTerm } },
          ],
        },
        include: {
          owner: { select: { id: true, name: true } },
          _count: { select: { products: true, followers: true } },
        },
        take: limit,
        orderBy: [
          { isRecommended: 'desc' },
          { name: 'asc' },
        ],
      });

      results.shops = shops.map(shop => ({
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        description: shop.description,
        logo: shop.logo,
        category: shop.category,
        city: shop.city,
        country: shop.country,
        isRecommended: shop.isRecommended,
        productCount: shop._count.products,
        followerCount: shop._count.followers,
        type: 'shop' as const,
      }));
      results.totalShops = shops.length;
    }

    // Search products
    if (!type || type === 'products') {
      const products = await db.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: searchTerm } },
            { description: { contains: searchTerm } },
            { category: { contains: searchTerm } },
          ],
        },
        include: {
          shop: { select: { id: true, name: true, logo: true, slug: true, city: true } },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      results.products = products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        images: product.images,
        category: product.category,
        stock: product.stock,
        shopId: product.shopId,
        shopName: product.shop.name,
        shopLogo: product.shop.logo,
        shopSlug: product.shop.slug,
        type: 'product' as const,
      }));
      results.totalProducts = products.length;
    }

    const totalResults = (results.totalShops || 0) + (results.totalProducts || 0);

    return NextResponse.json({
      query: searchTerm,
      results,
      totalResults,
    });
  } catch (error) {
    console.error('Search GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
