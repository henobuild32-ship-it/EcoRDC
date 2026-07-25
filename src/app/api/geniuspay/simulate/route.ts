import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { activateOrExtendSubscription, GENIUSPAY_ENV } from '@/lib/geniuspay';

// ==========================================
// POST /api/geniuspay/simulate
// ==========================================
// Sandbox-only endpoint to simulate payment confirmation.
// This allows testing the full flow without a real GeniusPay account.
// In production, this endpoint is disabled.
// ==========================================

export async function POST(request: NextRequest) {
  try {
    // Only allow in sandbox mode
    if (GENIUSPAY_ENV !== 'sandbox') {
      return NextResponse.json(
        { error: 'Simulation disponible uniquement en mode sandbox' },
        { status: 403 }
      );
    }

    // Authenticate vendor
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, outcome = 'success' } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId requis' },
        { status: 400 }
      );
    }

    const payment = await db.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      return NextResponse.json(
        { error: 'Paiement non trouvé' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (payload.role === 'VENDOR' && payment.vendorId !== payload.userId) {
      return NextResponse.json(
        { error: 'Accès non autorisé à ce paiement' },
        { status: 403 }
      );
    }

    if (payment.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Ce paiement n\'est plus en attente', currentStatus: payment.status },
        { status: 400 }
      );
    }

    if (outcome === 'success') {
      // Simulate successful payment
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          pawapayStatus: 'COMPLETED',
        },
      });

      await activateOrExtendSubscription(payment.vendorId, payment.type, payment.id);

      await db.activityLog.create({
        data: {
          userId: payment.vendorId,
          action: 'GENIUSPAY_PAYMENT_SIMULATED',
          details: `Paiement GeniusPay ${payment.type} simulé (sandbox): ${payment.amount} ${payment.currency}`,
        },
      });

      await db.notification.create({
        data: {
          userId: payment.vendorId,
          title: 'Paiement confirmé (Sandbox)',
          message: payment.type === 'REGISTRATION'
            ? 'Votre frais d\'inscription a été payé avec succès ! Votre boutique est maintenant active pour 30 jours.'
            : 'Votre abonnement mensuel a été activé avec succès pour 30 jours !',
          type: 'SYSTEM',
        },
      });

      const subscription = await db.subscription.findUnique({ where: { vendorId: payment.vendorId } });
      const shop = await db.shop.findUnique({ where: { ownerId: payment.vendorId } });

      return NextResponse.json({
        success: true,
        status: 'success',
        paymentId: payment.id,
        reference: payment.transactionRef,
        subscription: subscription ? {
          id: subscription.id,
          status: subscription.status,
          startDate: subscription.startDate,
          expiryDate: subscription.expiryDate,
        } : null,
        shop: shop ? {
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
        } : null,
      });
    } else {
      // Simulate failed payment
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          pawapayStatus: 'REJECTED',
        },
      });

      await db.activityLog.create({
        data: {
          userId: payment.vendorId,
          action: 'GENIUSPAY_PAYMENT_SIMULATED_FAILED',
          details: `Paiement GeniusPay ${payment.type} simulé comme échoué (sandbox)`,
        },
      });

      return NextResponse.json({
        success: true,
        status: 'failed',
        paymentId: payment.id,
        reference: payment.transactionRef,
      });
    }
  } catch (error) {
    console.error('GeniusPay simulate error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la simulation' },
      { status: 500 }
    );
  }
}
