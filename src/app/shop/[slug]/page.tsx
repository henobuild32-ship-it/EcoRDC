import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PublicShopClient } from '@/components/shop/PublicShopClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ShopPage({ params }: Props) {
  const { slug } = await params;

  const shop = await db.shop.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
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

  if (!shop || !shop.isActive) {
    notFound();
  }

  const formattedShop = {
    ...JSON.parse(JSON.stringify(shop)),
    products: shop.products.map((p) => ({
      ...p,
      currency: (shop as any).currency || 'CDF',
      image: p.images ? p.images.split(',')[0].trim() : null,
    })),
  };

  return <PublicShopClient shop={formattedShop} />;
}
