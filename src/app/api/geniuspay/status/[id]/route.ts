import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { checkGeniusPayStatus, activateOrExtendSubscription } from '@/lib/geniuspay';

// ==========================================
// GET /api/geniuspay/status/[id]
// ==========================================
// Verifies the transaction status.
// Returns: pending, success, or failed.
// ==========================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate vendor (optional but recommended)
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // Find payment by ID or transaction reference
    let payment = await db.payment.findUnique({ where: { id } });

    if (!payment) {
      payment = await db.payment.findFirst({ where: { transactionRef: id } });
    }

    if (!payment) {
      return NextResponse.json(
        { error: 'Transaction non trouvée' },
        { status: 404 }
      );
    }

    // Verify ownership (vendor can only check own payments, admin can check any)
    if (payload.role === 'VENDOR' && payment.vendorId !== payload.userId) {
      return NextResponse.json(
        { error: 'Accès non autorisé à cette transaction' },
        { status: 403 }
      );
    }

    // If payment is already in a terminal state, return immediately
    if (payment.status === 'COMPLETED') {
      return NextResponse.json({
        status: 'success',
        paymentId: payment.id,
        reference: payment.transactionRef,
        amount: payment.amount,
        currency: payment.currency,
        type: payment.type,
        completedAt: payment.updatedAt,
      });
    }

    if (payment.status === 'FAILED' || payment.status === 'CANCELLED') {
      return NextResponse.json({
        status: 'failed',
        paymentId: payment.id,
        reference: payment.transactionRef,
        amount: payment.amount,
        currency: payment.currency,
        type: payment.type,
      });
    }

    // Payment is still PENDING - check with GeniusPay
    let metadata: { geniuspayTransactionId?: string; sandbox?: boolean } = {};
    try {
      metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
    } catch {
      metadata = {};
    }

    // If sandbox mode (no real GeniusPay call was made), return pending
    // Frontend will use the /simulate endpoint to complete the payment in sandbox
    if (metadata.sandbox) {
      return NextResponse.json({
        status: 'pending',
        paymentId: payment.id,
        reference: payment.transactionRef,
        amount: payment.amount,
        currency: payment.currency,
        type: payment.type,
        sandbox: true,
        message: 'En attente de paiement (mode sandbox). Utilisez le bouton de simulation pour confirmer.',
      });
    }

    // Query GeniusPay for the real status
    const geniuspayTransactionId = metadata.geniuspayTransactionId || payment.transactionRef;
    if (!geniuspayTransactionId) {
      return NextResponse.json({
        status: 'pending',
        paymentId: payment.id,
        reference: payment.transactionRef,
        amount: payment.amount,
        currency: payment.currency,
        type: payment.type,
        message: 'R?f?rence GeniusPay manquante pour cette transaction.',
      });
    }

    const statusResult = await checkGeniusPayStatus(geniuspayTransactionId);

    // Update payment based on GeniusPay response
    if (statusResult.status === 'success') {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          pawapayStatus: statusResult.rawStatus || 'COMPLETED',
        },
      });

      // Activate/extend subscription
      await activateOrExtendSubscription(payment.vendorId, payment.type, payment.id);

      // Log activity
      await db.activityLog.create({
        data: {
          userId: payment.vendorId,
          action: 'GENIUSPAY_PAYMENT_COMPLETED',
          details: `Paiement GeniusPay ${payment.type} confirmé: ${payment.amount} ${payment.currency}`,
        },
      });

      // Notify vendor
      await db.notification.create({
        data: {
          userId: payment.vendorId,
          title: 'Paiement confirmé',
          message: payment.type === 'REGISTRATION'
            ? 'Votre frais d\'inscription a été payé avec succès ! Votre boutique est maintenant active.'
            : payment.type === 'PREPAID'
              ? 'Votre abonnement du mois suivant a été payé en avance avec succès ! Il s\'activera automatiquement à l\'expiration de votre abonnement actuel.'
              : 'Votre abonnement mensuel a été activé avec succès pour 31 jours.',
          type: 'SYSTEM',
        },
      });

      return NextResponse.json({
        status: 'success',
        paymentId: payment.id,
        reference: payment.transactionRef,
        amount: payment.amount,
        currency: payment.currency,
        type: payment.type,
        completedAt: new Date().toISOString(),
      });
    }

    if (statusResult.status === 'failed') {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          pawapayStatus: statusResult.rawStatus || 'FAILED',
        },
      });

      await db.notification.create({
        data: {
          userId: payment.vendorId,
          title: 'Paiement échoué',
          message: `Votre paiement de ${payment.amount} ${payment.currency} a échoué. Veuillez réessayer.`,
          type: 'SYSTEM',
        },
      });

      return NextResponse.json({
        status: 'failed',
        paymentId: payment.id,
        reference: payment.transactionRef,
        amount: payment.amount,
        currency: payment.currency,
        type: payment.type,
      });
    }

    // Still pending
    return NextResponse.json({
      status: 'pending',
      paymentId: payment.id,
      reference: payment.transactionRef,
      amount: payment.amount,
      currency: payment.currency,
      type: payment.type,
    });
  } catch (error) {
    console.error('GeniusPay status check error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut' },
      { status: 500 }
    );
  }
}
