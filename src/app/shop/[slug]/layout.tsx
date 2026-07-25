import { Metadata } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  try {
    const baseUrl = API_BASE || 'https://eco-rdc.vercel.app';
    const res = await fetch(`${baseUrl}/api/shops?slug=${slug}`, { cache: 'no-store' });
    if (!res.ok) return { title: 'Boutique introuvable - EcoRDC' };
    const data = await res.json();
    const shop = data.shop;

    return {
      title: `${shop.name} - EcoRDC`,
      description: shop.description || `Découvrez ${shop.name} sur EcoRDC. ${shop._count?.products || 0} produits disponibles.`,
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
