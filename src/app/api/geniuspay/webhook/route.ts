import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Payment } from '@prisma/client';
import { verifyWebhookSignature, verifyWebhookTimestamp, activateOrExtendSubscription } from '@/lib/geniuspay';

// ==========================================
// POST /api/geniuspay/webhook
// ==========================================
// Handles GeniusPay webhook callbacks.
// Documentation: https://geniuspay.ci/docs/api#webhooks
//
// Headers:
// - X-Webhook-Signature: HMAC-SHA256 signature
// - X-Webhook-Timestamp: Unix timestamp
// - X-Webhook-Event: Event type (payment.success, payment.failed, etc.)
// - X-Webhook-Environment: sandbox or live
//
// Signature format: HMAC-SHA256(timestamp + "." + json_payload, secret)
// ==========================================

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();

    // Get signature and timestamp from headers
    const signature =
      request.headers.get('x-webhook-signature') ||
      request.headers.get('x-geniuspay-signature') ||
      request.headers.get('x-signature') ||
      '';

    const webhookTimestamp =
      request.headers.get('x-webhook-timestamp') || '';

    const webhookEvent =
      request.headers.get('x-webhook-event') ||
      request.headers.get('x-event') ||
      '';

    const webhookEnvironment =
      request.headers.get('x-webhook-environment') ||
      request.headers.get('x-environment') ||
      '';

    console.log('[GENIUSPAY WEBHOOK] Received:', {
      event: webhookEvent,
      environment: webhookEnvironment,
      hasSignature: !!signature,
      hasTimestamp: !!webhookTimestamp
    });

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
    const webhookSecret = process.env.GENIUSPAY_WEBHOOK_SECRET;
    const isSandbox = process.env.GENIUSPAY_ENV === 'sandbox';
    const isLiveWebhook = webhookEnvironment === 'live';
    const isSandboxWebhook = webhookEnvironment === 'sandbox';

    if (webhookSecret && signature) {
      // Verify timestamp first (prevent replay attacks)
      if (webhookTimestamp && !verifyWebhookTimestamp(webhookTimestamp)) {
        console.error('[GENIUSPAY WEBHOOK] Invalid or expired timestamp');
        return NextResponse.json(
          { error: 'Timestamp invalide ou expiré' },
          { status: 400 }
        );
      }

      // Verify signature with timestamp
      const isValid = verifyWebhookSignature(rawBody, signature, webhookTimestamp);
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

      console.log('[GENIUSPAY WEBHOOK] Signature verified successfully');
    } else if (!isSandbox && !isSandboxWebhook) {
      // In production, signature is required
      console.error('[GENIUSPAY WEBHOOK] Missing signature in production mode');
      return NextResponse.json(
        { error: 'Signature manquante' },
        { status: 401 }
      );
    } else {
      console.warn('[GENIUSPAY WEBHOOK] Sandbox mode - signature verification skipped');
    }

    // ==========================================
    // Extract transaction info from webhook payload
    // ==========================================
    // GeniusPay webhook payload format:
    // {
    //   "id": "550e8400-...",
    //   "event": "payment.success",
    //   "timestamp": 1735587600,
    //   "created_at": "2025-12-30T12:00:00.000000Z",
    //   "data": {
    //     "id": 12345,
    //     "reference": "MTX-XXXXXXXXXX",
    //     "amount": 10000.00,
    //     "currency": "XOF",
    //     "status": "completed",
    //     "metadata": { ... }
    //   },
    //   "environment": "live"
    // }

    const eventData = body.data as Record<string, unknown> || body;
    const event = (body.event as string) || webhookEvent;

    const reference =
      (eventData.reference as string) ||
      (body.reference as string) ||
      (eventData.metadata as Record<string, unknown>)?.internalReference as string;

    const transactionId =
      (eventData.id as string) ||
      (body.transactionId as string) ||
      String(eventData.id || '');

    const status = (
      (eventData.status as string) ||
      (body.status as string) ||
      ''
    ).toString().toUpperCase();

    if (!reference && !transactionId) {
      return NextResponse.json(
        { error: 'Référence de transaction manquante' },
        { status: 400 }
      );
    }

    // Find the payment record
    let payment: Payment | null = null;
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
          if (meta.geniuspayTransactionId === transactionId || meta.transactionId === transactionId) {
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

    // Determine if payment was successful based on event and status
    const isSuccess =
      event === 'payment.success' ||
      ['SUCCESS', 'COMPLETED', 'PAID', 'CONFIRMED', 'APPROVED'].includes(status);

    const isFailure =
      event === 'payment.failed' ||
      event === 'payment.cancelled' ||
      event === 'payment.expired' ||
      ['FAILED', 'CANCELLED', 'CANCELED', 'REJECTED', 'DECLINED', 'EXPIRED'].includes(status);

    if (isSuccess) {
      // ==========================================
      // Update transaction to COMPLETED
      // ==========================================
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          pawapayStatus: status || 'COMPLETED',
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
            ? 'Votre frais d\'inscription a été payé avec succès ! Votre boutique est maintenant active pour 31 jours.'
            : payment.type === 'PREPAID'
              ? 'Votre abonnement du mois suivant a été payé en avance avec succès ! Il s\'activera automatiquement à l\'expiration de votre abonnement actuel.'
              : 'Votre abonnement mensuel a été renouvelé avec succès pour 31 jours !',
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
          pawapayStatus: status || 'FAILED',
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
      event,
    });
  } catch (error) {
    console.error('[GENIUSPAY WEBHOOK] Error:', error);
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
