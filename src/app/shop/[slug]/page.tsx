import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PublicShopClient } from '@/components/shop/PublicShopClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ShopPage({ params }: Props) {
  const { slug } = await params;

  const shop = await db.shop.findUnique({
    where: { slug },
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
          currency: true,
          image: true,
          category: true,
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

  return <PublicShopClient shop={JSON.parse(JSON.stringify(shop))} />;
}
