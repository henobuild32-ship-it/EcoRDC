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

// Supported GeniusPay payment methods (mobile money + cards)
export const SUPPORTED_PAYMENT_METHODS = [
  { id: 'ORANGE_MONEY', label: 'Orange Money', icon: '🟠', group: 'mobile' },
  { id: 'AIRTEL_MONEY', label: 'Airtel Money', icon: '🔴', group: 'mobile' },
  { id: 'M_PESA', label: 'M-Pesa', icon: '🟢', group: 'mobile' },
  { id: 'MTN_MOMO', label: 'MTN MoMo', icon: '🟡', group: 'mobile' },
  { id: 'MOOV_MONEY', label: 'Moov Money', icon: '🔵', group: 'mobile' },
  { id: 'WAVE', label: 'Wave', icon: '🌊', group: 'mobile' },
  { id: 'VISA', label: 'Carte Visa', icon: '💳', group: 'card' },
  { id: 'MASTERCARD', label: 'Carte Mastercard', icon: '💳', group: 'card' },
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

    // Compute expected signatures in both hex and base64
    const expectedHex = crypto
      .createHmac('sha256', GENIUSPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
    const expectedBase64 = crypto
      .createHmac('sha256', GENIUSPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('base64');

    // Compare as strings first (length check) to avoid timingSafeEqual errors
    if (receivedSig === expectedHex || receivedSig === expectedBase64) {
      return true;
    }

    // Use timingSafeEqual only when lengths match (constant-time comparison)
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
// Generate unique transaction reference
// ==========================================
export function generateTransactionReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `GP-${timestamp}-${random}`;
}

// ==========================================
// Activate or Extend Vendor Subscription
// ==========================================
export async function activateOrExtendSubscription(vendorId: string, paymentType: string, paymentId: string) {
  const subscription = await db.subscription.findUnique({ where: { vendorId } });
  const payment = await db.payment.findUnique({ where: { id: paymentId } });

  const now = new Date();
  // 31-day subscription as per spec
  const expiryDate = new Date(now);
  expiryDate.setDate(expiryDate.getDate() + 31);

  if (!subscription) {
    // Create new subscription with 31-day period
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
    // Activate existing inactive subscription (31 days)
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
    // Extend existing active subscription by 31 days
    // If current subscription hasn't expired, extend from current expiry date
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

  // Re-activate vendor account (in case it was suspended)
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

  // Auto-expire if past expiry date
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

  // Build the request payload for GeniusPay Merchant API
  const payload: Record<string, unknown> = {
    reference,
    amount,
    currency,
    description,
    customer: {
      name: customerName,
      email: customerEmail,
    },
    returnUrl,
    callbackUrl,
    metadata: {
      platform: 'EcoRDC',
      environment: GENIUSPAY_ENV,
    },
  };

  if (customerPhone) {
    payload.customer = { ...payload.customer as object, phone: customerPhone };
  }

  if (paymentMethod) {
    payload.paymentMethod = paymentMethod;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${GENIUSPAY_API_BASE}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GENIUSPAY_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Public-Key': GENIUSPAY_PUBLIC_KEY,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await response.json().catch(() => ({}));

    if (response.ok && (data.checkoutUrl || data.paymentUrl || data.redirectUrl || data.url)) {
      const checkoutUrl = data.checkoutUrl || data.paymentUrl || data.redirectUrl || data.url;
      return {
        checkoutUrl,
        transactionId: data.transactionId || data.id || data.reference || reference,
        success: true,
        sandbox: false,
        rawResponse: data,
      };
    }

    // In production, don't fall back to sandbox simulation
    if (GENIUSPAY_ENV === 'production') {
      console.error('[GENIUSPAY] API returned error:', response.status, data);
      throw new Error(`GeniusPay API error: ${response.status} - ${JSON.stringify(data)}`);
    }

    // Sandbox fallback
    console.log('[GENIUSPAY] API returned non-OK, falling back to sandbox simulation:', response.status, data);
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
    // In production, throw the error
    if (GENIUSPAY_ENV === 'production') {
      throw error;
    }
    // Fall back to sandbox simulation on network errors
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
      console.error('[GENIUSPAY] Secret key not configured in production mode');
      return { status: 'failed' };
    }
    // Sandbox mode - return pending (frontend will use simulate endpoint)
    return { status: 'pending' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${GENIUSPAY_API_BASE}/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GENIUSPAY_SECRET_KEY}`,
        'Accept': 'application/json',
        'X-Public-Key': GENIUSPAY_PUBLIC_KEY,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      const rawStatus = (data.status || data.state || '').toString().toUpperCase();
      let status: 'pending' | 'success' | 'failed' = 'pending';

      if (['SUCCESS', 'COMPLETED', 'PAID', 'CONFIRMED', 'APPROVED'].includes(rawStatus)) {
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
