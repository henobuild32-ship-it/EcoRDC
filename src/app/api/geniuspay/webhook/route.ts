import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyWebhookSignature, activateOrExtendSubscription } from '@/lib/geniuspay';

// ==========================================
// POST /api/geniuspay/webhook
// ==========================================
// Handles GeniusPay webhook callbacks.
// Verifies the HMAC-SHA256 signature, updates the transaction,
// and activates the subscription automatically after payment confirmation.
// ==========================================

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();

    // Get signature from headers (GeniusPay may use different header names)
    const signature =
      request.headers.get('x-geniuspay-signature') ||
      request.headers.get('x-signature') ||
      request.headers.get('signature') ||
      request.headers.get('x-webhook-signature') ||
      '';

    // Parse the body as JSON
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: 'Corps de la requête JSON invalide' },
        { status: 400 }
      );
    }

    // ==========================================
    // Verify webhook signature (HMAC-SHA256)
    // ==========================================
    // In sandbox mode without a configured webhook secret, we allow the webhook
    // but log a warning. In production, signature verification is MANDATORY.
    const webhookSecret = process.env.GENIUSPAY_WEBHOOK_SECRET;
    const isSandbox = process.env.GENIUSPAY_ENV === 'sandbox';

    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.error('[GENIUSPAY WEBHOOK] Invalid signature');
        await db.activityLog.create({
          data: {
            action: 'GENIUSPAY_WEBHOOK_INVALID_SIGNATURE',
            details: `Tentative de webhook avec signature invalide rejetée`,
          },
        });
        return NextResponse.json(
          { error: 'Signature invalide' },
          { status: 401 }
        );
      }
    } else if (!isSandbox) {
      // In production, signature is required
      console.error('[GENIUSPAY WEBHOOK] Missing signature in production mode');
      return NextResponse.json(
        { error: 'Signature manquante' },
        { status: 401 }
      );
    } else {
      console.warn('[GENIUSPAY WEBHOOK] Sandbox mode - signature verification skipped');
    }

    // Extract transaction info from webhook payload
    // GeniusPay webhook payload may vary; handle common formats
    const reference =
      (body.reference as string) ||
      (body.transactionRef as string) ||
      (body.tx_ref as string) ||
      (body.orderId as string);

    const transactionId =
      (body.transactionId as string) ||
      (body.id as string) ||
      (body.transaction_id as string);

    const status = (
      (body.status as string) ||
      (body.state as string) ||
      (body.transactionStatus as string) ||
      ''
    ).toString().toUpperCase();

    if (!reference && !transactionId) {
      return NextResponse.json(
        { error: 'Référence de transaction manquante' },
        { status: 400 }
      );
    }

    // Find the payment record
    let payment = null;
    if (reference) {
      payment = await db.payment.findFirst({ where: { transactionRef: reference } });
    }
    if (!payment && transactionId) {
      // Try to find by geniuspayTransactionId in metadata
      const payments = await db.payment.findMany({
        where: { paymentMethod: 'GENIUSPAY', status: 'PENDING' },
      });
      for (const p of payments) {
        try {
          const meta = p.metadata ? JSON.parse(p.metadata) : {};
          if (meta.geniuspayTransactionId === transactionId) {
            payment = p;
            break;
          }
        } catch {
          continue;
        }
      }
    }

    if (!payment) {
      console.error(`[GENIUSPAY WEBHOOK] Payment not found for reference=${reference}, txId=${transactionId}`);
      return NextResponse.json(
        { error: 'Paiement non trouvé' },
        { status: 404 }
      );
    }

    // If payment is already in terminal state, acknowledge but don't reprocess
    if (payment.status === 'COMPLETED' || payment.status === 'FAILED') {
      return NextResponse.json({
        success: true,
        message: 'Paiement déjà traité',
        status: payment.status,
      });
    }

    // Determine if payment was successful
    const isSuccess = ['SUCCESS', 'COMPLETED', 'PAID', 'CONFIRMED', 'APPROVED'].includes(status);
    const isFailure = ['FAILED', 'CANCELLED', 'CANCELED', 'REJECTED', 'DECLINED', 'EXPIRED'].includes(status);

    if (isSuccess) {
      // ==========================================
      // Update transaction to COMPLETED
      // ==========================================
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          pawapayStatus: status,
        },
      });

      // ==========================================
      // Activate subscription automatically
      // ==========================================
      await activateOrExtendSubscription(payment.vendorId, payment.type, payment.id);

      // Log activity
      await db.activityLog.create({
        data: {
          userId: payment.vendorId,
          action: 'GENIUSPAY_WEBHOOK_PAYMENT_COMPLETED',
          details: `Paiement GeniusPay ${payment.type} confirmé via webhook: ${payment.amount} ${payment.currency} - Réf: ${reference}`,
        },
      });

      // Notify vendor
      await db.notification.create({
        data: {
          userId: payment.vendorId,
          title: 'Paiement confirmé',
          message: payment.type === 'REGISTRATION'
            ? 'Votre frais d\'inscription a été payé avec succès ! Votre boutique est maintenant active pour 30 jours.'
            : 'Votre abonnement mensuel a été renouvelé avec succès pour 30 jours !',
          type: 'SYSTEM',
        },
      });

      console.log(`[GENIUSPAY WEBHOOK] Payment ${payment.id} completed - subscription activated`);

      return NextResponse.json({
        success: true,
        status: 'success',
        paymentId: payment.id,
        reference: payment.transactionRef,
        activated: true,
      });
    }

    if (isFailure) {
      // ==========================================
      // Update transaction to FAILED
      // ==========================================
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          pawapayStatus: status,
        },
      });

      await db.activityLog.create({
        data: {
          userId: payment.vendorId,
          action: 'GENIUSPAY_WEBHOOK_PAYMENT_FAILED',
          details: `Paiement GeniusPay ${payment.type} échoué via webhook: ${payment.amount} ${payment.currency} - Statut: ${status}`,
        },
      });

      await db.notification.create({
        data: {
          userId: payment.vendorId,
          title: 'Paiement échoué',
          message: `Votre paiement de ${payment.amount} ${payment.currency} a échoué (${status}). Veuillez réessayer avec un autre moyen de paiement.`,
          type: 'SYSTEM',
        },
      });

      console.log(`[GENIUSPAY WEBHOOK] Payment ${payment.id} failed - status: ${status}`);

      return NextResponse.json({
        success: true,
        status: 'failed',
        paymentId: payment.id,
        reference: payment.transactionRef,
      });
    }

    // Status is still pending or unknown
    return NextResponse.json({
      success: true,
      status: 'pending',
      paymentId: payment.id,
      reference: payment.transactionRef,
      rawStatus: status,
    });
  } catch (error) {
    console.error('GeniusPay webhook error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement du webhook' },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification (some gateways ping the URL)
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge');
  if (challenge) {
    return NextResponse.json({ challenge });
  }
  return NextResponse.json({
    endpoint: 'GeniusPay Webhook',
    status: 'active',
    timestamp: new Date().toISOString(),
  });
}
