import { db } from '@/lib/db';
import { generateShopSlug } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// ==========================================
// GeniusPay Configuration
// ==========================================
export const GENIUSPAY_SECRET_KEY = process.env.GENIUSPAY_SECRET_KEY || '';
export const GENIUSPAY_PUBLIC_KEY = process.env.GENIUSPAY_PUBLIC_KEY || '';
export const GENIUSPAY_API_BASE = process.env.GENIUSPAY_API_BASE || 'https://geniuspay.ci/api/v1/merchant';
export const GENIUSPAY_ENV = process.env.GENIUSPAY_ENV || 'production';
export const GENIUSPAY_WEBHOOK_SECRET = process.env.GENIUSPAY_WEBHOOK_SECRET || '';
export const REGISTRATION_FEE = parseFloat(process.env.VENDOR_REGISTRATION_FEE || '10000');
export const MONTHLY_SUBSCRIPTION = parseFloat(process.env.VENDOR_MONTHLY_SUBSCRIPTION || '10000');

// GeniusPay payment method codes (lowercase, matching API docs)
export const SUPPORTED_PAYMENT_METHODS = [
  { id: 'orange_money', label: 'Orange Money', icon: '🟠', group: 'mobile' },
  { id: 'airtel_money', label: 'Airtel Money', icon: '🔴', group: 'mobile' },
  { id: 'm_pesa', label: 'M-Pesa', icon: '🟢', group: 'mobile' },
  { id: 'mtn_money', label: 'MTN MoMo', icon: '🟡', group: 'mobile' },
  { id: 'moov_money', label: 'Moov Money', icon: '🔵', group: 'mobile' },
  { id: 'wave', label: 'Wave', icon: '🌊', group: 'mobile' },
  { id: 'card', label: 'Carte bancaire', icon: '💳', group: 'card' },
] as const;

// ==========================================
// Webhook Signature Verification (HMAC-SHA256)
// ==========================================
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!GENIUSPAY_WEBHOOK_SECRET) {
    console.error('GENIUSPAY_WEBHOOK_SECRET not configured');
    return false;
  }

  try {
    const receivedSig = signature.trim();
    if (!receivedSig) return false;

    const expectedHex = crypto
      .createHmac('sha256', GENIUSPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
    const expectedBase64 = crypto
      .createHmac('sha256', GENIUSPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('base64');

    if (receivedSig === expectedHex || receivedSig === expectedBase64) {
      return true;
    }

    const expectedBuf = Buffer.from(expectedHex, 'utf8');
    const receivedBuf = Buffer.from(receivedSig, 'utf8');

    if (expectedBuf.length === receivedBuf.length) {
      return crypto.timingSafeEqual(expectedBuf, receivedBuf);
    }

    return false;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

// ==========================================
// Generate unique transaction reference (MTX format per GeniusPay spec)
// ==========================================
export function generateTransactionReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'MTX-';
  for (let i = 0; i < 10; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

// ==========================================
// Activate or Extend Vendor Subscription
// ==========================================
export async function activateOrExtendSubscription(vendorId: string, paymentType: string, paymentId: string) {
  const subscription = await db.subscription.findUnique({ where: { vendorId } });
  const payment = await db.payment.findUnique({ where: { id: paymentId } });

  const now = new Date();
  const expiryDate = new Date(now);
  expiryDate.setDate(expiryDate.getDate() + 31);

  if (!subscription) {
    await db.subscription.create({
      data: {
        vendorId,
        status: 'ACTIVE',
        startDate: now,
        expiryDate,
        amount: MONTHLY_SUBSCRIPTION,
      },
    });
  } else if (paymentType === 'REGISTRATION' || subscription.status === 'INACTIVE') {
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
    const baseDate = subscription.expiryDate && subscription.expiryDate > now
      ? subscription.expiryDate
      : now;
    const newExpiryDate = new Date(baseDate);
    newExpiryDate.setDate(newExpiryDate.getDate() + 31);

    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        startDate: subscription.startDate || now,
        expiryDate: newExpiryDate,
      },
    });
  }

  await db.user.update({
    where: { id: vendorId },
    data: { isSuspended: false, isActive: true },
  });

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

// ==========================================
// Check if vendor has active subscription
// ==========================================
export async function getVendorSubscriptionStatus(vendorId: string) {
  const subscription = await db.subscription.findUnique({ where: { vendorId } });

  if (!subscription) {
    return {
      hasSubscription: false,
      isActive: false,
      status: 'NONE',
      expiryDate: null,
      daysRemaining: 0,
    };
  }

  let currentStatus = subscription.status;
  if (subscription.status === 'ACTIVE' && subscription.expiryDate && subscription.expiryDate < new Date()) {
    await db.subscription.update({
      where: { id: subscription.id },
      data: { status: 'EXPIRED' },
    });
    currentStatus = 'EXPIRED';
  }

  const daysRemaining = subscription.expiryDate
    ? Math.max(0, Math.ceil((subscription.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    hasSubscription: true,
    isActive: currentStatus === 'ACTIVE',
    status: currentStatus,
    expiryDate: subscription.expiryDate,
    startDate: subscription.startDate,
    daysRemaining,
  };
}

// ==========================================
// Create GeniusPay Checkout Session
// ==========================================
export async function createGeniusPayCheckout(params: {
  reference: string;
  amount: number;
  currency: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  paymentMethod?: string;
  returnUrl: string;
  callbackUrl: string;
}): Promise<{ checkoutUrl: string; transactionId: string; success: boolean; sandbox: boolean; rawResponse?: unknown }> {
  const {
    reference,
    amount,
    currency,
    description,
    customerName,
    customerEmail,
    customerPhone,
    paymentMethod,
    returnUrl,
    callbackUrl,
  } = params;

  // If no secret key configured, use sandbox simulation
  if (!GENIUSPAY_SECRET_KEY) {
    if (GENIUSPAY_ENV === 'production') {
      throw new Error('[GENIUSPAY] Secret key not configured in production mode');
    }
    console.log('[GENIUSPAY] No secret key configured, using sandbox simulation');
    const simulatedTxId = uuidv4();
    return {
      checkoutUrl: `${returnUrl}?status=pending&reference=${reference}&tx_id=${simulatedTxId}&sandbox=1`,
      transactionId: simulatedTxId,
      success: true,
      sandbox: true,
    };
  }

  // GeniusPay API strictly accepts 'USD', 'XOF', 'EUR'.
  // If input currency is CDF (Congolese Franc), map it to GENIUSPAY_CURRENCY (default USD)
  // and set an appropriate API amount (e.g. 4 USD for 10,000 FC).
  const apiCurrency = (process.env.GENIUSPAY_CURRENCY || (currency === 'CDF' ? 'USD' : currency)).toUpperCase();
  let apiAmount = amount;
  if (currency === 'CDF' && apiCurrency === 'USD') {
    apiAmount = parseFloat(process.env.GENIUSPAY_USD_AMOUNT || '4');
  } else if (currency === 'CDF' && apiCurrency === 'XOF') {
    apiAmount = parseFloat(process.env.GENIUSPAY_XOF_AMOUNT || '2500');
  }

  // Build the GeniusPay API payload per docs
  const payload: Record<string, unknown> = {
    amount: apiAmount,
    currency: apiCurrency,
    description,
    customer: {
      name: customerName,
      email: customerEmail,
      country: 'CD',
    },
    success_url: returnUrl,
    error_url: returnUrl.replace('payment=return', 'payment=error'),
    metadata: {
      platform: 'EcoRDC',
      environment: GENIUSPAY_ENV,
      reference,
      originalAmount: amount,
      originalCurrency: currency,
    },
  };

  if (customerPhone) {
    (payload.customer as Record<string, unknown>).phone = customerPhone;
  }

  if (paymentMethod) {
    payload.payment_method = paymentMethod;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    console.log('[GENIUSPAY] Creating payment:', JSON.stringify({ ...payload, customer: '...' }));

    const response = await fetch(`${GENIUSPAY_API_BASE}/payments`, {
      method: 'POST',
      headers: {
        'X-API-Key': GENIUSPAY_PUBLIC_KEY,
        'X-API-Secret': GENIUSPAY_SECRET_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await response.json().catch(() => ({}));
    console.log('[GENIUSPAY] API response:', response.status, JSON.stringify(data).substring(0, 500));

    const rawUrl = data.checkout_url || data.checkoutUrl || data.payment_url || data.url || data.data?.checkout_url || data.data?.url || data.data?.payment_url;
    if (response.ok && rawUrl) {
      return {
        checkoutUrl: rawUrl,
        transactionId: data.reference || data.id || data.data?.reference || data.data?.id || reference,
        success: true,
        sandbox: false,
        rawResponse: data,
      };
    }

    // In production, don't fall back to sandbox
    if (GENIUSPAY_ENV === 'production') {
      console.error('[GENIUSPAY] API error:', response.status, data);
      throw new Error(`GeniusPay API error: ${response.status} - ${JSON.stringify(data)}`);
    }

    // Sandbox fallback
    console.log('[GENIUSPAY] API error, sandbox fallback:', response.status, data);
    const simulatedTxId = uuidv4();
    return {
      checkoutUrl: `${returnUrl}?status=pending&reference=${reference}&tx_id=${simulatedTxId}&sandbox=1`,
      transactionId: simulatedTxId,
      success: true,
      sandbox: true,
      rawResponse: data,
    };
  } catch (error) {
    console.error('[GENIUSPAY] Checkout creation error:', error);
    if (GENIUSPAY_ENV === 'production') {
      throw error;
    }
    const simulatedTxId = uuidv4();
    return {
      checkoutUrl: `${returnUrl}?status=pending&reference=${reference}&tx_id=${simulatedTxId}&sandbox=1`,
      transactionId: simulatedTxId,
      success: true,
      sandbox: true,
    };
  }
}

// ==========================================
// Check GeniusPay Transaction Status
// ==========================================
export async function checkGeniusPayStatus(transactionId: string): Promise<{
  status: 'pending' | 'success' | 'failed';
  rawStatus?: string;
  rawResponse?: unknown;
}> {
  if (!GENIUSPAY_SECRET_KEY) {
    if (GENIUSPAY_ENV === 'production') {
      return { status: 'failed' };
    }
    return { status: 'pending' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${GENIUSPAY_API_BASE}/payments/${transactionId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': GENIUSPAY_PUBLIC_KEY,
        'X-API-Secret': GENIUSPAY_SECRET_KEY,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      const tx = data.data || data;
      const rawStatus = (tx.status || tx.state || '').toString().toUpperCase();
      let status: 'pending' | 'success' | 'failed' = 'pending';

      if (['COMPLETED', 'SUCCESS', 'PAID', 'CONFIRMED', 'APPROVED'].includes(rawStatus)) {
        status = 'success';
      } else if (['FAILED', 'CANCELLED', 'CANCELED', 'REJECTED', 'DECLINED', 'EXPIRED'].includes(rawStatus)) {
        status = 'failed';
      }

      return { status, rawStatus, rawResponse: data };
    }

    return { status: 'pending', rawResponse: data };
  } catch (error) {
    console.error('[GENIUSPAY] Status check error:', error);
    return { status: 'pending' };
  }
}
