import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PublicShopClient } from '@/components/shop/PublicShopClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ShopPage({ params }: Props) {
  let rawSlug = '';
  try {
    const resolvedParams = await Promise.resolve(params);
    rawSlug = resolvedParams?.slug || '';
  } catch {
    rawSlug = '';
  }

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

  let shop: any = null;

  try {
    // 1. Search shop by slug (case-insensitive), shop ID, or owner ID
    shop = await db.shop.findFirst({
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
      const product = await db.product.findUnique({
        where: { id: slug },
        select: { shopId: true },
      }).catch(() => null);

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
        }).catch(() => null);
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
        }).catch(() => null);
      }
    }
  } catch (error) {
    console.error('[ShopPage Error]', error);
  }

  if (!shop) {
    notFound();
  }

  // Handle suspended or inactive shop gracefully
  if (!shop.isActive || shop.suspensionType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-orange-50/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-amber-200 dark:border-amber-900/50 text-center">
          <div className="h-20 w-20 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Boutique temporairement indisponible
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            La boutique <span className="font-semibold text-amber-600 dark:text-amber-400">&laquo; {shop.name} &raquo;</span> est actuellement suspendue ou en cours de maintenance.
          </p>
          <div className="flex flex-col gap-2">
            <a
              href="/"
              className="w-full inline-flex justify-center items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-md text-sm"
            >
              Découvrir d&apos;autres boutiques sur EcoRDC
            </a>
          </div>
        </div>
      </div>
    );
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

