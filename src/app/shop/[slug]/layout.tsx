import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Boutique - EcoRDC',
  description: 'Découvrez cette boutique sur EcoRDC',
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
