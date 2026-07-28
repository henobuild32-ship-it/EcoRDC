import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PublicShopClient } from '@/components/shop/PublicShopClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ShopPage({ params }: Props) {
  const { slug: rawSlug } = await params;

  if (!rawSlug) {
    notFound();
  }

  // Safely decode URI component and trim spaces
  let slug = rawSlug;
  try {
    slug = decodeURIComponent(rawSlug).trim();
  } catch {
    slug = rawSlug.trim();
  }

  // 1. Search shop by slug (case-insensitive), shop ID, or owner ID
  let shop = await db.shop.findFirst({
    where: {
      OR: [
        { slug: { equals: slug, mode: 'insensitive' } },
        { id: slug },
        { ownerId: slug },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true, phone: true } },
      products: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          images: true,
          category: true,
          stock: true,
          isActive: true,
          createdAt: true,
        },
      },
      _count: { select: { products: true, followers: true } },
    },
  });

  // 2. Fallback: If no shop found directly, check if slug is a product ID
  if (!shop) {
    try {
      const product = await db.product.findUnique({
        where: { id: slug },
        select: { shopId: true },
      });

      if (product?.shopId) {
        shop = await db.shop.findUnique({
          where: { id: product.shopId },
          include: {
            owner: { select: { id: true, name: true, email: true, phone: true } },
            products: {
              where: { isActive: true },
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                images: true,
                category: true,
                stock: true,
                isActive: true,
                createdAt: true,
              },
            },
            _count: { select: { products: true, followers: true } },
          },
        });
      }
    } catch {
      // Ignore lookup failure
    }
  }

  // 3. Fallback: Try slugified version if user copied a space-filled name
  if (!shop) {
    const hyphenatedSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (hyphenatedSlug && hyphenatedSlug !== slug) {
      shop = await db.shop.findFirst({
        where: { slug: { equals: hyphenatedSlug, mode: 'insensitive' } },
        include: {
          owner: { select: { id: true, name: true, email: true, phone: true } },
          products: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              images: true,
              category: true,
              stock: true,
              isActive: true,
              createdAt: true,
            },
          },
          _count: { select: { products: true, followers: true } },
        },
      });
    }
  }

  if (!shop) {
    notFound();
  }

  // Formatter safely without JSON circular risks
  const formattedShop = {
    ...JSON.parse(JSON.stringify(shop)),
    owner: shop.owner || { id: '', name: shop.name || 'Vendeur', email: '', phone: null },
    _count: shop._count || { products: shop.products?.length || 0, followers: 0 },
    products: (shop.products || []).map((p) => ({
      ...p,
      currency: (shop as any).currency || 'CDF',
      image: p.images ? (typeof p.images === 'string' ? p.images.split(',')[0].trim() : String(p.images)) : null,
    })),
  };

  return <PublicShopClient shop={formattedShop} />;
}
