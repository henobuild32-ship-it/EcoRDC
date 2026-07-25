import { Metadata } from 'next';
import { db } from '@/lib/db';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const shop = await db.shop.findUnique({
      where: { slug },
      include: { _count: { select: { products: true } } },
    });
    if (!shop) {
      return { title: 'Boutique introuvable - EcoRDC' };
    }
    return {
      title: `${shop.name} - EcoRDC`,
      description: shop.description || `Découvrez ${shop.name} sur EcoRDC. ${shop._count.products} produits disponibles.`,
      openGraph: {
        title: shop.name,
        description: shop.description || `Boutique ${shop.name} sur EcoRDC`,
        images: shop.logo ? [shop.logo] : [],
        type: 'website',
      },
    };
  } catch {
    return { title: 'Boutique - EcoRDC' };
  }
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
