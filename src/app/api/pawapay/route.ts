import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, generateShopSlug } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

const PAWAPAY_BASE_URL = process.env.PAWAPAY_BASE_URL || 'https://api.sandbox.pawapay.io';
const PAWAPAY_API_TOKEN = process.env.PAWAPAY_API_TOKEN || '';
const PAWAPAY_ENV = process.env.PAWAPAY_ENV || 'sandbox';
const REGISTRATION_FEE = parseFloat(process.env.VENDOR_REGISTRATION_FEE || '10000');
const MONTHLY_SUBSCRIPTION = parseFloat(process.env.VENDOR_MONTHLY_SUBSCRIPTION || '10000');

// Helper: authenticate vendor from Bearer token
// Note: We allow suspended/inactive vendors to authenticate for payments
// so they can renew their subscription and get reactivated
async function authenticateVendor(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'VENDOR') return null;

  const user = await db.user.findUnique({ where: { id: payload.userId } });
  if (!user) return null;

  return user;
}

// Helper: activate or extend vendor subscription, create shop if REGISTRATION
async function activateOrExtendSubscription(vendorId: string, paymentType: string, paymentId: string) {
  const subscription = await db.subscription.findUnique({ where: { vendorId } });
  const payment = await db.payment.findUnique({ where: { id: paymentId } });

  if (!subscription) {
    // Create new subscription (31 days)
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setDate(expiryDate.getDate() + 31);

    await db.subscription.create({
      data: {
        vendorId,
        status: 'ACTIVE',
        startDate: now,
        expiryDate,
        amount: MONTHLY_SUBSCRIPTION,
      },
    });
  } else if (paymentType === 'REGISTRATION') {
    // Activate existing inactive subscription (31 days)
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setDate(expiryDate.getDate() + 31);

    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        startDate: now,
        expiryDate,
        amount: MONTHLY_SUBSCRIPTION,
      },
    });
  } else {
    // Extend existing subscription by 31 days
    const baseDate = subscription.expiryDate && subscription.expiryDate > new Date()
      ? subscription.expiryDate
      : new Date();
    const newExpiryDate = new Date(baseDate);
    newExpiryDate.setDate(newExpiryDate.getDate() + 31);

    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        startDate: subscription.startDate || new Date(),
        expiryDate: newExpiryDate,
      },
    });
  }

  // Ensure vendor is not suspended (re-activate if needed)
  await db.user.update({
    where: { id: vendorId },
    data: { isSuspended: false, isActive: true },
  });

  // If REGISTRATION payment, create the shop from stored metadata
  if (paymentType === 'REGISTRATION' && payment?.metadata) {
    try {
      const metadata = JSON.parse(payment.metadata);
      const existingShop = await db.shop.findUnique({ where: { ownerId: vendorId } });

      if (!existingShop && metadata.shopName) {
        const baseSlug = generateShopSlug(metadata.shopName);
        let slug = baseSlug;
        let suffix = 1;
        while (await db.shop.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${suffix}`;
          suffix++;
        }

        await db.shop.create({
          data: {
            name: metadata.shopName,
            slug,
            description: metadata.shopDescription || null,
            logo: metadata.shopLogo || null,
            category: metadata.shopCategory || null,
            address: metadata.shopAddress || null,
            city: metadata.shopCity || null,
            country: metadata.shopCountry || null,
            ownerId: vendorId,
          },
        });
      }
    } catch (e) {
      console.error('Error creating shop from payment metadata:', e);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // ============================
    // INITIATE PAYMENT
    // ============================
    if (action === 'initiate-payment') {
      const vendor = await authenticateVendor(request);
      if (!vendor) {
        return NextResponse.json({ error: 'Accès vendeur requis' }, { status: 401 });
      }

      const { type, phoneNumber } = body;
      if (!type || !['REGISTRATION', 'SUBSCRIPTION'].includes(type)) {
        return NextResponse.json({ error: 'Type de paiement invalide (REGISTRATION ou SUBSCRIPTION)' }, { status: 400 });
      }

      if (!phoneNumber || !phoneNumber.startsWith('+243')) {
        return NextResponse.json({ error: 'Numéro de téléphone invalide (format +243...)' }, { status: 400 });
      }

      // Check if vendor already has a pending payment of same type
      const existingPending = await db.payment.findFirst({
        where: {
          vendorId: vendor.id,
          type,
          status: 'PENDING',
        },
      });
      if (existingPending) {
        return NextResponse.json({
          error: 'Vous avez déjà un paiement en attente de ce type',
          existingPaymentId: existingPending.id,
          depositId: existingPending.transactionRef,
        }, { status: 400 });
      }

      // For registration, check if already paid
      if (type === 'REGISTRATION') {
        const completedReg = await db.payment.findFirst({
          where: { vendorId: vendor.id, type: 'REGISTRATION', status: 'COMPLETED' },
        });
        if (completedReg) {
          return NextResponse.json({ error: 'Frais d\'inscription déjà payés' }, { status: 400 });
        }
      }

      const depositId = uuidv4();
      const amount = type === 'REGISTRATION' ? REGISTRATION_FEE : MONTHLY_SUBSCRIPTION;
      const reason = type === 'REGISTRATION'
        ? 'EcoRDC - Inscription Vendeur'
        : 'EcoRDC - Abonnement Mensuel';

      // Get or create subscription
      let subscription = await db.subscription.findUnique({ where: { vendorId: vendor.id } });
      if (!subscription) {
        subscription = await db.subscription.create({
          data: {
            vendorId: vendor.id,
            status: 'INACTIVE',
            amount: MONTHLY_SUBSCRIPTION,
          },
        });
      }

      // Try calling PawaPay Payment Page API
      let redirectUrl = '';
      let pawapaySuccess = false;

      try {
        const pawapayController = new AbortController();
        const pawapayTimeout = setTimeout(() => pawapayController.abort(), 5000);
        const pawapayResponse = await fetch(`${PAWAPAY_BASE_URL}/v2/paymentpage`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${PAWAPAY_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            depositId,
            amount: { amount, currency: 'CDF' },
            countryCode: 'COD',
            reason,
            returnUrl: 'https://ecordc.com/payment-callback',
          }),
          signal: pawapayController.signal,
        });
        clearTimeout(pawapayTimeout);

        if (pawapayResponse.ok) {
          const pawapayData = await pawapayResponse.json();
          redirectUrl = pawapayData.redirectUrl || pawapayData.paymentPageUrl || '';
          pawapaySuccess = true;
        } else {
          console.log('PawaPay API returned non-OK status, simulating for sandbox');
        }
      } catch (pawapayError) {
        console.log('PawaPay API call failed, simulating for sandbox:', pawapayError instanceof Error ? pawapayError.message : 'Unknown error');
      }

      // Sandbox fallback: simulate a successful response
      if (!pawapaySuccess) {
        redirectUrl = `https://sandbox.pawapay.io/pay/${depositId}`;
        console.log(`[SANDBOX] Simulated PawaPay payment: depositId=${depositId}, amount=${amount} CDF`);
      }

      // Create payment record
      const payment = await db.payment.create({
        data: {
          vendorId: vendor.id,
          subscriptionId: subscription.id,
          amount,
          currency: 'CDF',
          type,
          status: 'PENDING',
          paymentMethod: 'PAWAPAY',
          transactionRef: depositId,
          pawapayStatus: 'PENDING',
          description: reason,
          metadata: JSON.stringify({ phoneNumber, sandbox: !pawapaySuccess }),
        },
      });

      // Log activity
      await db.activityLog.create({
        data: {
          userId: vendor.id,
          action: 'PAYMENT_INITIATED',
          details: `Paiement ${type} initié: ${amount} CDF (${depositId})`,
        },
      });

      return NextResponse.json({
        redirectUrl,
        depositId,
        paymentId: payment.id,
        amount,
        currency: 'CDF',
        sandbox: !pawapaySuccess,
      });
    }

    // ============================
    // CHECK PAYMENT STATUS
    // ============================
    if (action === 'check-status') {
      const { paymentId, depositId } = body;
      if (!paymentId && !depositId) {
        return NextResponse.json({ error: 'paymentId ou depositId requis' }, { status: 400 });
      }

      // Find payment record
      let payment;
      if (paymentId) {
        payment = await db.payment.findUnique({ where: { id: paymentId } });
      } else {
        payment = await db.payment.findFirst({ where: { transactionRef: depositId } });
      }

      if (!payment) {
        return NextResponse.json({ error: 'Paiement non trouvé' }, { status: 404 });
      }

      // If already completed/failed/cancelled, return current status
      if (payment.status !== 'PENDING') {
        return NextResponse.json({
          status: payment.status,
          pawapayStatus: payment.pawapayStatus,
          paymentId: payment.id,
        });
      }

      // Try checking with PawaPay
      let pawapayStatus = 'PENDING';

      try {
        const statusController = new AbortController();
        const statusTimeout = setTimeout(() => statusController.abort(), 5000);
        const pawapayResponse = await fetch(`${PAWAPAY_BASE_URL}/v2/deposits/${payment.transactionRef}`, {
          headers: {
            'Authorization': `Bearer ${PAWAPAY_API_TOKEN}`,
          },
          signal: statusController.signal,
        });
        clearTimeout(statusTimeout);

        if (pawapayResponse.ok) {
          const pawapayData = await pawapayResponse.json();
          pawapayStatus = pawapayData.status || 'PENDING';
        }
      } catch (pawapayError) {
        console.log('PawaPay status check failed:', pawapayError instanceof Error ? pawapayError.message : 'Unknown error');
      }

      // If PawaPay says COMPLETED, update our records
      if (pawapayStatus === 'COMPLETED') {
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
            action: 'PAYMENT_COMPLETED',
            details: `Paiement ${payment.type} complété: ${payment.amount} CDF`,
          },
        });

        return NextResponse.json({
          status: 'COMPLETED',
          pawapayStatus: 'COMPLETED',
          paymentId: payment.id,
        });
      }

      if (pawapayStatus === 'REJECTED' || pawapayStatus === 'FAILED') {
        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            pawapayStatus,
          },
        });

        return NextResponse.json({
          status: 'FAILED',
          pawapayStatus,
          paymentId: payment.id,
        });
      }

      return NextResponse.json({
        status: payment.status,
        pawapayStatus,
        paymentId: payment.id,
      });
    }

    // ============================
    // PAYMENT CALLBACK
    // ============================
    if (action === 'callback') {
      const { depositId, status } = body;
      if (!depositId || !status) {
        return NextResponse.json({ error: 'depositId et status requis' }, { status: 400 });
      }

      const payment = await db.payment.findFirst({
        where: { transactionRef: depositId },
      });

      if (!payment) {
        return NextResponse.json({ error: 'Paiement non trouvé' }, { status: 404 });
      }

      // Update payment status
      const updateData: Record<string, unknown> = {
        pawapayStatus: status,
      };

      if (status === 'COMPLETED') {
        updateData.status = 'COMPLETED';
      } else if (status === 'REJECTED' || status === 'FAILED') {
        updateData.status = 'FAILED';
      }

      await db.payment.update({
        where: { id: payment.id },
        data: updateData,
      });

      if (status === 'COMPLETED') {
        await activateOrExtendSubscription(payment.vendorId, payment.type, payment.id);

        await db.activityLog.create({
          data: {
            userId: payment.vendorId,
            action: 'PAYMENT_CALLBACK_COMPLETED',
            details: `Paiement ${payment.type} complété via callback: ${payment.amount} CDF`,
          },
        });

        // Notify vendor
        await db.notification.create({
          data: {
            userId: payment.vendorId,
            title: 'Paiement confirmé',
            message: payment.type === 'REGISTRATION'
              ? 'Votre frais d\'inscription a été payé avec succès! Votre boutique est maintenant active.'
              : 'Votre abonnement mensuel a été renouvelé avec succès!',
            type: 'SYSTEM',
          },
        });
      } else if (status === 'REJECTED' || status === 'FAILED') {
        await db.notification.create({
          data: {
            userId: payment.vendorId,
            title: 'Paiement échoué',
            message: `Votre paiement de ${payment.amount} CDF a échoué. Veuillez réessayer.`,
            type: 'SYSTEM',
          },
        });

        await db.activityLog.create({
          data: {
            userId: payment.vendorId,
            action: 'PAYMENT_FAILED',
            details: `Paiement ${payment.type} échoué: ${payment.amount} CDF`,
          },
        });
      }

      return NextResponse.json({ success: true, status });
    }

    // ============================
    // SIMULATE PAYMENT (Sandbox only)
    // ============================
    if (action === 'simulate-payment') {
      if (PAWAPAY_ENV !== 'sandbox') {
        return NextResponse.json({ error: 'Simulation disponible uniquement en mode sandbox' }, { status: 403 });
      }

      const { paymentId } = body;
      if (!paymentId) {
        return NextResponse.json({ error: 'paymentId requis' }, { status: 400 });
      }

      const payment = await db.payment.findUnique({ where: { id: paymentId } });
      if (!payment) {
        return NextResponse.json({ error: 'Paiement non trouvé' }, { status: 404 });
      }

      if (payment.status !== 'PENDING') {
        return NextResponse.json({ error: 'Ce paiement n\'est plus en attente' }, { status: 400 });
      }

      // Force-complete the payment
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          pawapayStatus: 'COMPLETED',
        },
      });

      await activateOrExtendSubscription(payment.vendorId, payment.type, payment.id);

      // Log activity
      await db.activityLog.create({
        data: {
          userId: payment.vendorId,
          action: 'PAYMENT_SIMULATED',
          details: `Paiement ${payment.type} simulé (sandbox): ${payment.amount} CDF`,
        },
      });

      // Notify vendor
      await db.notification.create({
        data: {
          userId: payment.vendorId,
          title: 'Paiement confirmé',
          message: payment.type === 'REGISTRATION'
            ? 'Votre frais d\'inscription a été payé avec succès! Votre boutique est maintenant active.'
            : 'Votre abonnement mensuel a été renouvelé avec succès!',
          type: 'SYSTEM',
        },
      });

      // Get updated subscription info
      const subscription = await db.subscription.findUnique({ where: { vendorId: payment.vendorId } });
      const shop = await db.shop.findUnique({ where: { ownerId: payment.vendorId } });

      return NextResponse.json({
        success: true,
        status: 'COMPLETED',
        paymentId: payment.id,
        subscription: subscription ? {
          id: subscription.id,
          status: subscription.status,
          expiryDate: subscription.expiryDate,
        } : null,
        shop: shop ? {
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
        } : null,
      });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    console.error('PawaPay API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
