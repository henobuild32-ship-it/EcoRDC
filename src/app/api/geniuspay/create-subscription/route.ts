import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import {
  createGeniusPayCheckout,
  generateTransactionReference,
  REGISTRATION_FEE,
  MONTHLY_SUBSCRIPTION,
  SUPPORTED_PAYMENT_METHODS,
  GENIUSPAY_ENV,
} from '@/lib/geniuspay';

// ==========================================
// POST /api/geniuspay/create-subscription
// ==========================================
// Creates a transaction, saves it to the database, sends the payment
// request to GeniusPay, and returns the GeniusPay Checkout URL.
// ==========================================

async function authenticateVendor(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'VENDOR') return null;

  const user = await db.user.findUnique({ where: { id: payload.userId } });
  if (!user) return null;

  // Allow suspended/inactive vendors to pay (so they can renew)
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const vendor = await authenticateVendor(request);
    if (!vendor) {
      return NextResponse.json(
        { error: 'Accès vendeur requis. Veuillez vous connecter en tant que vendeur.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, paymentMethod, phoneNumber } = body;

    // Extract the bearer token to pass to the sandbox checkout page
    // so it can confirm the payment on behalf of the vendor
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') || '';

    // Validate payment type
    if (!type || !['REGISTRATION', 'SUBSCRIPTION'].includes(type)) {
      return NextResponse.json(
        { error: 'Type de paiement invalide. Utilisez REGISTRATION ou SUBSCRIPTION.' },
        { status: 400 }
      );
    }

    // Validate payment method if provided
    if (paymentMethod) {
      const validMethod = SUPPORTED_PAYMENT_METHODS.find(m => m.id === paymentMethod);
      if (!validMethod) {
        return NextResponse.json(
          { error: 'Moyen de paiement non supporté.' },
          { status: 400 }
        );
      }
    }

    // For registration, check if already paid
    if (type === 'REGISTRATION') {
      const completedReg = await db.payment.findFirst({
        where: { vendorId: vendor.id, type: 'REGISTRATION', status: 'COMPLETED' },
      });
      if (completedReg) {
        return NextResponse.json(
          { error: 'Frais d\'inscription déjà payés. Vous pouvez vous abonner mensuellement.' },
          { status: 400 }
        );
      }
    }

    // Check for existing pending payment of same type
    const existingPending = await db.payment.findFirst({
      where: {
        vendorId: vendor.id,
        type,
        status: 'PENDING',
        paymentMethod: 'GENIUSPAY',
      },
    });
    if (existingPending) {
      // Check if it's stale (>30 min old), if so cancel it
      const ageMinutes = (Date.now() - existingPending.createdAt.getTime()) / (1000 * 60);
      if (ageMinutes > 30) {
        await db.payment.update({
          where: { id: existingPending.id },
          data: { status: 'CANCELLED', pawapayStatus: 'EXPIRED' },
        });
      } else {
        return NextResponse.json({
          error: 'Vous avez déjà un paiement en attente de ce type. Veuillez le finaliser ou attendre.',
          existingPaymentId: existingPending.id,
          transactionRef: existingPending.transactionRef,
        }, { status: 400 });
      }
    }

    // Determine amount based on type
    const amount = type === 'REGISTRATION' ? REGISTRATION_FEE : MONTHLY_SUBSCRIPTION;
    const currency = 'CDF';
    const reason = type === 'REGISTRATION'
      ? 'EcoRDC - Inscription Vendeur'
      : 'EcoRDC - Abonnement Mensuel (30 jours)';

    // Get or create subscription record
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

    // Generate unique transaction reference
    const reference = generateTransactionReference();

    // Build URLs
    const origin = request.nextUrl.origin;
    const callbackUrl = `${origin}/api/geniuspay/webhook`;

    // Create GeniusPay checkout session
    const checkout = await createGeniusPayCheckout({
      reference,
      amount,
      currency,
      description: reason,
      customerName: vendor.name,
      customerEmail: vendor.email,
      customerPhone: phoneNumber || vendor.phone || undefined,
      paymentMethod: paymentMethod || undefined,
      returnUrl: `${origin}/?payment=return&reference=${reference}`,
      callbackUrl: `${origin}/api/geniuspay/webhook`,
    });

    // For sandbox mode, build a local checkout URL that opens our GeniusPay-style
    // checkout page with all the transaction details and the vendor's token.
    // This URL is opened in a new tab by the frontend.
    if (checkout.sandbox) {
      const checkoutParams = new URLSearchParams({
        reference,
        paymentId: '', // will be set after payment record creation
        tx_id: checkout.transactionId,
        amount: String(amount),
        currency,
        type,
        method: paymentMethod || '',
        token: authToken || '',
      });
      checkout.checkoutUrl = `${origin}/checkout?${checkoutParams.toString()}`;
    }

    // Create payment record in database
    const payment = await db.payment.create({
      data: {
        vendorId: vendor.id,
        subscriptionId: subscription.id,
        amount,
        currency,
        type,
        status: 'PENDING',
        paymentMethod: 'GENIUSPAY',
        transactionRef: reference,
        pawapayStatus: 'PENDING', // reuse field for GeniusPay status tracking
        description: `${reason} - ${paymentMethod || 'Tous moyens'}`,
        metadata: JSON.stringify({
          geniuspayTransactionId: checkout.transactionId,
          paymentMethod: paymentMethod || 'ALL',
          phoneNumber: phoneNumber || null,
          sandbox: checkout.sandbox,
          checkoutUrl: checkout.checkoutUrl,
          platform: 'geniuspay',
        }),
      },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId: vendor.id,
        action: 'GENIUSPAY_PAYMENT_INITIATED',
        details: `Paiement GeniusPay ${type} initié: ${amount} ${currency} - Réf: ${reference}`,
      },
    });

    // For sandbox mode, update the checkout URL with the real paymentId
    // so the checkout page can confirm the payment via /api/geniuspay/simulate
    let finalCheckoutUrl = checkout.checkoutUrl;
    if (checkout.sandbox) {
      const url = new URL(finalCheckoutUrl);
      url.searchParams.set('paymentId', payment.id);
      finalCheckoutUrl = url.toString();
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: finalCheckoutUrl,
      transactionId: checkout.transactionId,
      reference,
      paymentId: payment.id,
      amount,
      currency,
      type,
      paymentMethod: paymentMethod || 'ALL',
      sandbox: checkout.sandbox,
      environment: GENIUSPAY_ENV,
    });
  } catch (error) {
    console.error('GeniusPay create-subscription error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du paiement. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}

// GET endpoint to list supported payment methods
export async function GET() {
  return NextResponse.json({
    paymentMethods: SUPPORTED_PAYMENT_METHODS,
    registrationFee: REGISTRATION_FEE,
    monthlySubscription: MONTHLY_SUBSCRIPTION,
    currency: 'CDF',
    environment: GENIUSPAY_ENV,
  });
}
