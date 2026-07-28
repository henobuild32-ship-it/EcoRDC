import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import QRCode from 'qrcode';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const slug = searchParams.get('slug');
    const format = searchParams.get('format') || 'png'; // png, svg, base64
    const size = parseInt(searchParams.get('size') || '400');
    const hd = searchParams.get('hd') === 'true';

    if (!shopId && !slug) {
      return NextResponse.json({ error: 'shopId ou slug requis' }, { status: 400 });
    }

    // Find the shop
    const shop = await db.shop.findFirst({
      where: shopId ? { id: shopId } : { slug: slug! },
      select: { id: true, name: true, slug: true, isActive: true },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 });
    }

    // Build the shop URL
    const baseUrl = request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://eco-rdc.vercel.app';
    const shopUrl = `${baseUrl}/shop/${shop.slug}`;

    const qrSize = hd ? Math.max(size, 1200) : Math.min(size, 800);

    if (format === 'svg') {
      const svgString = await QRCode.toString(shopUrl, {
        type: 'svg',
        width: qrSize,
        margin: 2,
        color: {
          dark: '#064e3b',  // emerald-900
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });

      return new NextResponse(svgString, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': `attachment; filename="${shop.slug}-qr.svg"`,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    if (format === 'base64') {
      const dataUrl = await QRCode.toDataURL(shopUrl, {
        width: qrSize,
        margin: 2,
        color: {
          dark: '#064e3b',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });

      return NextResponse.json({
        dataUrl,
        shopUrl,
        shopName: shop.name,
        slug: shop.slug,
      });
    }

    // Default: PNG buffer
    const buffer = await QRCode.toBuffer(shopUrl, {
      width: qrSize,
      margin: 2,
      type: 'png',
      color: {
        dark: '#064e3b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });

    const filename = hd ? `${shop.slug}-qr-hd.png` : `${shop.slug}-qr.png`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400',
        'X-Shop-Name': encodeURIComponent(shop.name),
        'X-Shop-Url': shopUrl,
      },
    });
  } catch (error) {
    console.error('QR Code generation error:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération du QR code' }, { status: 500 });
  }
}
