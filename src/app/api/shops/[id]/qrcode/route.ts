import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'png'; // png, svg

    const shop = await db.shop.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, logo: true },
    });

    if (!shop) return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 });

    const shopUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://eco-rdc.vercel.app'}/shop/${shop.slug}`;

    const qrcode = await import('qrcode');

    if (format === 'svg') {
      const svg = await qrcode.toString(shopUrl, { type: 'svg', width: 400, margin: 2, color: { dark: '#059669', light: '#FFFFFF' } });
      return new NextResponse(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Content-Disposition': `attachment; filename="qrcode-${shop.slug}.svg"`, 'Cache-Control': 'public, max-age=86400' } });
    }

    const qrBuffer = await qrcode.toBuffer(shopUrl, { type: 'png', width: 400, margin: 2, color: { dark: '#059669', light: '#FFFFFF' } });
    return new NextResponse(qrBuffer, { headers: { 'Content-Type': 'image/png', 'Content-Disposition': `inline; filename="qrcode-${shop.slug}.png"`, 'Cache-Control': 'public, max-age=86400' } });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
