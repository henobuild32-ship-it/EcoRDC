import { db } from '@/lib/db';
import { generateShopSlug } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// ==========================================
// GeniusPay Configuration
// ==========================================
// Documentation: https://geniuspay.ci/docs/api
// Headers: X-API-Key (public key), X-API-Secret (secret key)
// Currencies: XOF (default), EUR, USD
// Minimum amount: 200 XOF
// ==========================================

export const GENIUSPAY_SECRET_KEY = process.env.GENIUSPAY_SECRET_KEY || '';
export const GENIUSPAY_PUBLIC_KEY = process.env.GENIUSPAY_PUBLIC_KEY || '';
export const GENIUSPAY_API_BASE = process.env.GENIUSPAY_API_BASE || 'https://geniuspay.ci/api/v1/merchant';
export const GENIUSPAY_ENV = process.env.GENIUSPAY_ENV || 'production';
export const GENIUSPAY_WEBHOOK_SECRET = process.env.GENIUSPAY_WEBHOOK_SECRET || '';
export const REGISTRATION_FEE = parseFloat(process.env.VENDOR_REGISTRATION_FEE || '10000');
export const MONTHLY_SUBSCRIPTION = parseFloat(process.env.VENDOR_MONTHLY_SUBSCRIPTION || '10000');

// GeniusPay payment method codes (matching API docs)
// For RD Congo: orange_money, airtel_money, m_pesa (Vodacom)
export const SUPPORTED_PAYMENT_METHODS = [
  { id: 'orange_money', label: 'Orange Money', icon: '🟠', group: 'mobile' },
  { id: 'airtel_money', label: 'Airtel Money', icon: '🔴', group: 'mobile' },
  { id: 'm_pesa', label: 'M-Pesa (Vodacom)', icon: '🟢', group: 'mobile' },
  { id: 'mtn_money', label: 'MTN MoMo', icon: '🟡', group: 'mobile' },
  { id: 'moov_money', label: 'Moov Money', icon: '🔵', group: 'mobile' },
  { id: 'wave', label: 'Wave', icon: '🌊', group: 'mobile' },
  { id: 'card', label: 'Carte bancaire', icon: '💳', group: 'card' },
] as const;

// ==========================================
// Webhook Signature Verification (HMAC-SHA256)
// ==========================================
// GeniusPay webhook signature format:
// signature = HMAC-SHA256(timestamp + "." + json_payload, secret)
// Headers: X-Webhook-Signature, X-Webhook-Timestamp
// ==========================================

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp?: string
): boolean {
  if (!GENIUSPAY_WEBHOOK_SECRET) {
    console.error('[GENIUSPAY] WEBHOOK_SECRET not configured');
    return false;
  }

  try {
    const receivedSig = signature.trim();
    if (!receivedSig) {
      console.error('[GENIUSPAY] Empty signature received');
      return false;
    }

    // GeniusPay format: HMAC-SHA256(timestamp + "." + payload, secret)
    // If timestamp is provided, use it; otherwise just hash the payload
    let dataToSign = payload;
    if (timestamp) {
      dataToSign = timestamp + '.' + payload;
    }

    // Calculate expected signature in hex format
    const expectedHex = crypto
      .createHmac('sha256', GENIUSPAY_WEBHOOK_SECRET)
      .update(dataToSign)
      .digest('hex');

    // Also try base64 format (some gateways use this)
    const expectedBase64 = crypto
      .createHmac('sha256', GENIUSPAY_WEBHOOK_SECRET)
      .update(dataToSign)
      .digest('base64');

    // Check if signature matches either format
    if (receivedSig === expectedHex || receivedSig === expectedBase64) {
      return true;
    }

    // Timing-safe comparison for hex format
    const expectedBuf = Buffer.from(expectedHex, 'utf8');
    const receivedBuf = Buffer.from(receivedSig, 'utf8');

    if (expectedBuf.length === receivedBuf.length) {
      try {
        return crypto.timingSafeEqual(expectedBuf, receivedBuf);
      } catch {
        // Buffers have different lengths, fall through
      }
    }

    console.error('[GENIUSPAY] Signature mismatch');
    return false;
  } catch (error) {
    console.error('[GENIUSPAY] Webhook signature verification error:', error);
    return false;
  }
}

// Verify timestamp to prevent replay attacks (5 minute window)
export function verifyWebhookTimestamp(timestamp: string): boolean {
  try {
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts)) {
      console.error('[GENIUSPAY] Invalid timestamp format');
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const diff = Math.abs(now - ts);

    // Allow 5 minutes window (300 seconds)
    if (diff > 300) {
      console.error(`[GENIUSPAY] Timestamp too old: ${diff} seconds`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[GENIUSPAY] Timestamp verification error:', error);
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
// Handles 4 scenarios:
// 1. New registration: Activate subscription for 31 days
// 2. Expired subscription: Renew from today for 31 days
// 3. Active subscription renewal: Extend from current expiry date
// 4. Prepaid (paid in advance): Store for later activation when current expires
// ==========================================

export async function activateOrExtendSubscription(vendorId: string, paymentType: string, paymentId: string) {
  const subscription = await db.subscription.findUnique({ where: { vendorId } });
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  let paymentMetadata: Record<string, unknown> = {};

  if (payment?.metadata) {
    try {
      paymentMetadata = JSON.parse(payment.metadata);
    } catch (error) {
      console.error('[SUBSCRIPTION] Invalid payment metadata:', error);
    }
  }

  const now = new Date();
  const newPeriodDays = 31;
  const newExpiryDate = new Date(now);
  newExpiryDate.setDate(newExpiryDate.getDate() + newPeriodDays);

  // Determine if this is a prepaid payment (paid in advance)
  const isPrepaid = paymentType === 'PREPAID' || paymentMetadata.prepaid === true;

  if (!subscription) {
    // Create new subscription
    await db.subscription.create({
      data: {
        vendorId,
        status: 'ACTIVE',
        startDate: now,
        expiryDate: newExpiryDate,
        amount: MONTHLY_SUBSCRIPTION,
      },
    });
  } else if (isPrepaid && subscription.status === 'ACTIVE' && subscription.expiryDate && subscription.expiryDate > now) {
    // ==========================================
    // PREPAID: Store for later activation
    // ==========================================
    // The vendor paid in advance while their current subscription is still active.
    // Store the prepaid expiry date. When the current subscription expires,
    // the system will automatically activate the prepaid period.
    // ==========================================

    const baseExpiry = (subscription.prepaidExpiryDate && subscription.prepaidExpiryDate > subscription.expiryDate)
      ? subscription.prepaidExpiryDate
      : subscription.expiryDate;
    const prepaidExpiry = new Date(baseExpiry);
    prepaidExpiry.setDate(prepaidExpiry.getDate() + newPeriodDays);

    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        prepaidExpiryDate: prepaidExpiry,
      },
    });

    console.log(`[SUBSCRIPTION] Prepaid period stored for vendor ${vendorId}. Current expiry: ${subscription.expiryDate.toISOString()}, Prepaid expiry: ${prepaidExpiry.toISOString()}`);
  } else if (paymentType === 'REGISTRATION' || subscription.status === 'INACTIVE' || subscription.status === 'EXPIRED') {
    // ==========================================
    // REGISTRATION / INACTIVE / EXPIRED: Activate from now
    // ==========================================
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        startDate: now,
        expiryDate: newExpiryDate,
        amount: MONTHLY_SUBSCRIPTION,
        prepaidExpiryDate: null,
      },
    });
  } else {
    // ==========================================
    // RENEWAL: Extend from current expiry date
    // ==========================================
    const baseDate = subscription.expiryDate && subscription.expiryDate > now
      ? subscription.expiryDate
      : now;
    const extendedExpiryDate = new Date(baseDate);
    extendedExpiryDate.setDate(extendedExpiryDate.getDate() + newPeriodDays);

    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        startDate: subscription.startDate || now,
        expiryDate: extendedExpiryDate,
      },
    });
  }

  // Activate vendor account
  await db.user.update({
    where: { id: vendorId },
    data: { isSuspended: false, isActive: true },
  });

  // Create shop from payment metadata (for REGISTRATION payments)
  if (paymentType === 'REGISTRATION' && Object.keys(paymentMetadata).length > 0) {
    try {
      const existingShop = await db.shop.findUnique({ where: { ownerId: vendorId } });

      if (!existingShop && typeof paymentMetadata.shopName === 'string') {
        const baseSlug = generateShopSlug(paymentMetadata.shopName);
        let slug = baseSlug;
        let suffix = 1;
        while (await db.shop.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${suffix}`;
          suffix++;
        }

        await db.shop.create({
          data: {
            name: paymentMetadata.shopName,
            slug,
            description: typeof paymentMetadata.shopDescription === 'string' ? paymentMetadata.shopDescription : null,
            logo: typeof paymentMetadata.shopLogo === 'string' ? paymentMetadata.shopLogo : null,
            category: typeof paymentMetadata.shopCategory === 'string' ? paymentMetadata.shopCategory : null,
            address: typeof paymentMetadata.shopAddress === 'string' ? paymentMetadata.shopAddress : null,
            city: typeof paymentMetadata.shopCity === 'string' ? paymentMetadata.shopCity : null,
            country: typeof paymentMetadata.shopCountry === 'string' ? paymentMetadata.shopCountry : null,
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
// Documentation: https://geniuspay.ci/docs/api
// Headers: X-API-Key (public key), X-API-Secret (secret key)
// Currencies: XOF (default), EUR, USD
// Minimum amount: 200 XOF
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

  // ==========================================
  // Currency Conversion for RD Congo
  // ==========================================
  // GeniusPay API accepts: XOF (West African CFA), EUR, USD
  // For RD Congo (CDF), we convert to XOF at a realistic rate
  // Rate: 1 XOF ≈ 3.5 CDF (approximate, 2025)
  // ==========================================

  const apiCurrency = process.env.GENIUSPAY_CURRENCY || 'XOF';
  let apiAmount = amount;

  if (currency === 'CDF' && apiCurrency === 'XOF') {
    // Convert CDF to XOF: 10,000 CDF ≈ 2,857 XOF (rate: 1 XOF = 3.5 CDF)
    // Round to nearest 100 XOF for cleaner amounts
    const conversionRate = parseFloat(process.env.CDF_TO_XOF_RATE || '0.286');
    apiAmount = Math.round(amount * conversionRate / 100) * 100;
    console.log(`[GENIUSPAY] Converting ${amount} CDF → ${apiAmount} XOF`);
  } else if (currency === 'CDF' && apiCurrency === 'USD') {
    // Fallback to USD if configured
    const conversionRate = parseFloat(process.env.CDF_TO_USD_RATE || '0.0004');
    apiAmount = Math.round(amount * conversionRate * 100) / 100;
    console.log(`[GENIUSPAY] Converting ${amount} CDF → ${apiAmount} USD`);
  }

  // Ensure minimum amount (200 XOF per GeniusPay docs)
  if (apiCurrency === 'XOF' && apiAmount < 200) {
    apiAmount = 200;
  }

  // Build the GeniusPay API payload per official documentation
  // https://geniuspay.ci/docs/api
  const payload: Record<string, unknown> = {
    amount: apiAmount,
    currency: apiCurrency,
    description: description.substring(0, 500), // Max 500 chars
    customer: {
      name: customerName,
      email: customerEmail,
      country: 'CD', // RD Congo
    },
    success_url: returnUrl,
    error_url: returnUrl.replace('payment=return', 'payment=error'),
    metadata: {
      platform: 'EcoRDC',
      environment: GENIUSPAY_ENV,
      internalReference: reference,
      originalAmount: amount,
      originalCurrency: currency,
    },
  };

  if (customerPhone) {
    (payload.customer as Record<string, unknown>).phone = customerPhone;
  }

  // If paymentMethod is specified, use direct mode via PawaPay for RD Congo
  // If omitted, GeniusPay shows checkout page (recommended)
  if (paymentMethod && paymentMethod !== 'ALL') {
    // For RD Congo, route ALL mobile money through PawaPay with mmo_provider
    // This is the correct pattern per GeniusPay docs:
    // payment_method: 'pawapay' + mmo_provider: 'ORANGE_COD' | 'AIRTEL_COD' | 'VODACOM_MPESA_COD'
    const rdCongoProviders: Record<string, string> = {
      'orange_money': 'ORANGE_COD',
      'airtel_money': 'AIRTEL_COD',
      'm_pesa': 'VODACOM_MPESA_COD',
      'mtn_money': 'MTN_MOMO_COD',
      'moov_money': 'MOOV_COD',
    };

    const mmoProvider = rdCongoProviders[paymentMethod];
    if (mmoProvider) {
      // Use PawaPay with explicit mmo_provider for RD Congo mobile money
      payload.payment_method = 'pawapay';
      payload.mmo_provider = mmoProvider;
    } else if (paymentMethod === 'wave') {
      payload.payment_method = 'wave';
    } else if (paymentMethod === 'card') {
      payload.payment_method = 'card';
    } else {
      payload.payment_method = paymentMethod;
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    console.log('[GENIUSPAY] Creating payment:', JSON.stringify({
      amount: payload.amount,
      currency: payload.currency,
      payment_method: payload.payment_method || 'checkout',
      customer: { name: customerName, email: customerEmail }
    }));

    // Call GeniusPay API with correct headers
    // Headers: X-API-Key (public), X-API-Secret (secret)
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

    // Extract checkout URL from response
    // Format: { success: true, data: { checkout_url, reference, ... } }
    const rawData = data.data || data;
    const rawUrl = rawData.checkout_url || rawData.checkoutUrl || rawData.payment_url || rawData.url;

    if (response.ok && rawUrl) {
      return {
        checkoutUrl: rawUrl,
        transactionId: rawData.reference || rawData.id || reference,
        success: true,
        sandbox: rawData.environment === 'sandbox',
        rawResponse: data,
      };
    }

    // In production, don't fall back to sandbox - throw error
    if (GENIUSPAY_ENV === 'production') {
      console.error('[GENIUSPAY] API error:', response.status, data);
      const errorMsg = data.error?.message || data.message || JSON.stringify(data);
      throw new Error(`GeniusPay API error: ${response.status} - ${errorMsg}`);
    }

    // Sandbox fallback for development
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
// Documentation: GET /api/v1/merchant/payments/{reference}
// Returns transaction details including status
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
    const timeout = setTimeout(() => controller.abort(), 10000);

    // GeniusPay API: GET /payments/{reference}
    // The reference is the MTX-XXXXXX format returned during creation
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

    if (response.ok && data.success) {
      // Response format: { success: true, data: { reference, status, ... } }
      const tx = data.data || data;
      const rawStatus = (tx.status || tx.state || '').toString().toUpperCase();

      // Map GeniusPay statuses to our internal statuses
      // GeniusPay statuses: pending, processing, completed, failed, cancelled, expired
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
