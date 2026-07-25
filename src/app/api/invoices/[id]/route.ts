import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import PDFDocument from 'pdfkit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: { include: { product: true } },
            customer: { select: { id: true, name: true, email: true } },
            shop: { include: { owner: { select: { id: true, name: true } } } },
          },
        },
      },
    });

    if (!invoice) return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });

    // Check access
    if (payload.role === 'CLIENT' && invoice.customerId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    if (payload.role === 'VENDOR') {
      const shop = await db.shop.findUnique({ where: { ownerId: payload.userId } });
      if (!shop || invoice.shopId !== shop.id) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
    }

    // Generate PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', (buffer: Buffer) => buffers.push(buffer));

    // Header
    doc.fontSize(24).fillColor('#10B981').text('EcoRDC', 50, 50, { align: 'left' });
    doc.fontSize(10).fillColor('#666666').text('Plateforme E-commerce en RDC', 50, 80);
    doc.fontSize(20).fillColor('#333333').text('FACTURE', 400, 50, { align: 'right' });
    doc.fontSize(10).fillColor('#666666').text(`N° ${invoice.invoiceNumber}`, 400, 75, { align: 'right' });
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}`, 400, 90, { align: 'right' });

    // Separator
    doc.moveTo(50, 110).lineTo(545, 110).strokeColor('#10B981').lineWidth(2).stroke();

    // From
    doc.fontSize(12).fillColor('#10B981').text('De:', 50, 130);
    doc.fontSize(10).fillColor('#333333')
      .text(invoice.order.shop?.name || 'Boutique', 50, 150)
      .text(`Vendeur: ${invoice.order.shop?.owner?.name || ''}`, 50, 165);

    // To
    doc.fontSize(12).fillColor('#10B981').text('Pour:', 300, 130);
    doc.fontSize(10).fillColor('#333333')
      .text(invoice.order.customer?.name || 'Client', 300, 150)
      .text(invoice.order.customer?.email || '', 300, 165);

    // Table header
    const tableTop = 210;
    doc.moveTo(50, tableTop).lineTo(545, tableTop).strokeColor('#cccccc').lineWidth(0.5).stroke();
    doc.fontSize(10).fillColor('#666666')
      .text('Produit', 55, tableTop + 8)
      .text('Qté', 300, tableTop + 8)
      .text('Prix unit.', 370, tableTop + 8)
      .text('Total', 470, tableTop + 8);
    doc.moveTo(50, tableTop + 25).lineTo(545, tableTop + 25).strokeColor('#cccccc').stroke();

    // Table rows
    let y = tableTop + 35;
    let total = 0;
    for (const item of invoice.order.items) {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      doc.fontSize(10).fillColor('#333333')
        .text(item.product?.name || 'Produit', 55, y)
        .text(`${item.quantity}`, 300, y)
        .text(`${item.price.toFixed(2)} CDF`, 370, y)
        .text(`${itemTotal.toFixed(2)} CDF`, 470, y);
      y += 20;
    }

    // Total
    y += 10;
    doc.moveTo(350, y).lineTo(545, y).strokeColor('#10B981').lineWidth(1).stroke();
    y += 10;
    doc.fontSize(14).fillColor('#10B981').text('Total:', 350, y);
    doc.fontSize(14).fillColor('#333333').text(`${invoice.totalAmount.toFixed(2)} CDF`, 470, y);

    // Status
    y += 30;
    doc.fontSize(10).fillColor('#666666').text(`Statut: ${invoice.status === 'PAID' ? 'Payée' : 'En attente'}`, 50, y);

    // Footer
    doc.fontSize(8).fillColor('#999999')
      .text('Copyright © HenoBuild - EcoRDC', 50, 750, { align: 'center' })
      .text('Facture générée automatiquement par la plateforme EcoRDC', 50, 762, { align: 'center' });

    return new Promise<NextResponse>((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        const response = new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="facture-${invoice.invoiceNumber}.pdf"`,
          },
        });
        resolve(response);
      });
      doc.end();
    });
  } catch (error) {
    console.error('Invoice PDF error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
