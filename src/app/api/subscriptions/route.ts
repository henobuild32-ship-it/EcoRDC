import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

const MONTHLY_SUBSCRIPTION = parseFloat(process.env.VENDOR_MONTHLY_SUBSCRIPTION || '10000');

// Helper: authenticate vendor from Bearer token
// Note: We allow suspended/inactive vendors to authenticate for subscription management
// so they can view their subscription and make payments to reactivate
async function authenticateVendor(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'VENDOR') return null;

  const user = await db.user.findUnique({ where: { id: payload.userId } });
  if (!user) return null;

  return user;
}

// Helper: authenticate admin from Bearer token
async function authenticateAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;

  return payload;
}

// Helper: calculate days until expiry
function daysUntilExpiry(expiryDate: Date | null): number | null {
  if (!expiryDate) return null;
  const now = new Date();
  const diff = expiryDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export async function GET(request: NextRequest) {
  try {
    const vendor = await authenticateVendor(request);
    if (!vendor) {
      return NextResponse.json({ error: 'Accès vendeur requis' }, { status: 401 });
    }

    // Get subscription
    let subscription = await db.subscription.findUnique({
      where: { vendorId: vendor.id },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!subscription) {
      // Create a default inactive subscription if it doesn't exist
      subscription = await db.subscription.create({
        data: {
          vendorId: vendor.id,
          status: 'INACTIVE',
          amount: MONTHLY_SUBSCRIPTION,
        },
        include: {
          payments: true,
        },
      });
    }

    // Check if subscription has expired
    const daysLeft = daysUntilExpiry(subscription.expiryDate);
    if (subscription.status === 'ACTIVE' && daysLeft !== null && daysLeft < 0) {
      // Check if there's a prepaid period to activate
      if (subscription.prepaidExpiryDate && subscription.prepaidExpiryDate > new Date()) {
        const prepaidExpiryDate = subscription.prepaidExpiryDate;

        await db.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'ACTIVE',
            startDate: new Date(),
            expiryDate: prepaidExpiryDate,
            prepaidExpiryDate: null,
          },
        });

        subscription.status = 'ACTIVE';
        subscription.startDate = new Date();
        subscription.expiryDate = prepaidExpiryDate;
        subscription.prepaidExpiryDate = null;

        await db.notification.create({
          data: {
            userId: vendor.id,
            title: 'Abonnement pr?pay? activ?',
            message: 'Votre abonnement pr?pay? a ?t? activ? automatiquement. Bonne continuation !',
            type: 'SYSTEM',
          },
        });
      } else {
        await db.subscription.update({
          where: { id: subscription.id },
          data: { status: 'EXPIRED', prepaidExpiryDate: null },
        });

        subscription.status = 'EXPIRED';
        subscription.prepaidExpiryDate = null;

        await db.notification.create({
          data: {
            userId: vendor.id,
            title: 'Abonnement expir?',
            message: 'Votre abonnement a expir?. Veuillez renouveler votre abonnement pour continuer ? vendre.',
            type: 'SYSTEM',
          },
        });
      }
    }

    // Get payment history
    const paymentHistory = await db.payment.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Calculate days remaining and total days in period
    let daysRemaining = 0;
    let totalDaysInPeriod = 31;
    if (subscription.status === 'ACTIVE' && subscription.expiryDate && subscription.startDate) {
      const now = new Date();
      const expiry = new Date(subscription.expiryDate);
      const start = new Date(subscription.startDate);
      daysRemaining = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      totalDaysInPeriod = Math.max(1, Math.ceil((expiry.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        startDate: subscription.startDate,
        expiryDate: subscription.expiryDate,
        prepaidExpiryDate: subscription.prepaidExpiryDate,
        hasPrepaid: !!subscription.prepaidExpiryDate,
        amount: subscription.amount,
        freeMonths: subscription.freeMonths,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
        daysRemaining,
        totalDaysInPeriod,
        payments: paymentHistory.map(p => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          type: p.type,
          status: p.status,
          paymentMethod: p.paymentMethod,
          transactionRef: p.transactionRef,
          description: p.description,
          createdAt: p.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Subscription GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // ============================
    // CHECK EXPIRATIONS (Cron job)
    // ============================
    if (action === 'check-expirations') {
      // Find all ACTIVE subscriptions that have expired
      const now = new Date();
      const expiredSubscriptions = await db.subscription.findMany({
        where: {
          status: 'ACTIVE',
          expiryDate: { lt: now },
        },
        include: {
          vendor: { select: { id: true, name: true, email: true } },
        },
      });

      let expiredCount = 0;
      let prepaidActivatedCount = 0;

      for (const sub of expiredSubscriptions) {
        if (sub.prepaidExpiryDate && sub.prepaidExpiryDate > now) {
          await db.subscription.update({
            where: { id: sub.id },
            data: {
              status: 'ACTIVE',
              startDate: now,
              expiryDate: sub.prepaidExpiryDate,
              prepaidExpiryDate: null,
            },
          });

          await db.notification.create({
            data: {
              userId: sub.vendorId,
              title: 'Abonnement pr?pay? activ?',
              message: 'Votre abonnement pr?pay? a ?t? activ? automatiquement. Bonne continuation !',
              type: 'SYSTEM',
            },
          });

          await db.activityLog.create({
            data: {
              userId: sub.vendorId,
              action: 'SUBSCRIPTION_PREPAID_ACTIVATED',
              details: `Abonnement pr?pay? activ? pour ${sub.vendor.name} (${sub.vendor.email})`,
            },
          });

          prepaidActivatedCount++;
          continue;
        }

        await db.subscription.update({
          where: { id: sub.id },
          data: { status: 'EXPIRED', prepaidExpiryDate: null },
        });

        await db.notification.create({
          data: {
            userId: sub.vendorId,
            title: 'Abonnement expir?',
            message: 'Votre abonnement a expir?. Veuillez renouveler votre abonnement pour continuer ? vendre.',
            type: 'SYSTEM',
          },
        });

        await db.activityLog.create({
          data: {
            userId: sub.vendorId,
            action: 'SUBSCRIPTION_EXPIRED',
            details: `Abonnement expir? pour ${sub.vendor.name} (${sub.vendor.email})`,
          },
        });

        expiredCount++;
      }

      return NextResponse.json({
        success: true,
        expiredCount,
        prepaidActivatedCount,
        message: `${expiredCount} abonnement(s) expir?(s), ${prepaidActivatedCount} pr?paiement(s) activ?(s)`,
      });
    }


    // ============================
    // ADMIN ACTIONS
    // ============================
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Accès administrateur requis' }, { status: 403 });
    }

    if (action === 'grant-free-months') {
      const { vendorId, months } = body;
      if (!vendorId || !months || months < 1) {
        return NextResponse.json({ error: 'vendorId et months (>= 1) requis' }, { status: 400 });
      }

      const vendor = await db.user.findUnique({ where: { id: vendorId } });
      if (!vendor || vendor.role !== 'VENDOR') {
        return NextResponse.json({ error: 'Vendeur non trouvé' }, { status: 404 });
      }

      let subscription = await db.subscription.findUnique({ where: { vendorId } });
      if (!subscription) {
        subscription = await db.subscription.create({
          data: {
            vendorId,
            status: 'ACTIVE',
            startDate: new Date(),
            expiryDate: new Date(),
            amount: MONTHLY_SUBSCRIPTION,
          },
        });
      }

      // Extend expiry by N free months
      const baseDate = subscription.expiryDate && subscription.expiryDate > new Date()
        ? subscription.expiryDate
        : new Date();
      const newExpiryDate = new Date(baseDate);
      newExpiryDate.setMonth(newExpiryDate.getMonth() + months);

      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          expiryDate: newExpiryDate,
          freeMonths: subscription.freeMonths + months,
        },
      });

      // Create ADMIN_GRANT payment record
      await db.payment.create({
        data: {
          vendorId,
          subscriptionId: subscription.id,
          amount: 0,
          currency: 'CDF',
          type: 'SUBSCRIPTION',
          status: 'COMPLETED',
          paymentMethod: 'ADMIN_GRANT',
          description: `Octroi de ${months} mois gratuit(s) par l'administrateur`,
        },
      });

      // Re-activate vendor if suspended
      await db.user.update({
        where: { id: vendorId },
        data: { isSuspended: false, isActive: true },
      });

      // Notify vendor
      await db.notification.create({
        data: {
          userId: vendorId,
          title: 'Mois gratuits accordés',
          message: `L'administrateur vous a accordé ${months} mois gratuit(s). Votre abonnement expire le ${newExpiryDate.toLocaleDateString('fr-FR')}.`,
          type: 'SYSTEM',
        },
      });

      // Log activity
      await db.activityLog.create({
        data: {
          userId: admin.userId,
          action: 'GRANT_FREE_MONTHS',
          details: `${months} mois gratuits accordés à ${vendor.name} (${vendor.email})`,
        },
      });

      return NextResponse.json({
        success: true,
        newExpiryDate,
        freeMonthsGranted: months,
      });
    }

    if (action === 'extend-subscription') {
      const { vendorId, months } = body;
      if (!vendorId || !months || months < 1) {
        return NextResponse.json({ error: 'vendorId et months (>= 1) requis' }, { status: 400 });
      }

      const vendor = await db.user.findUnique({ where: { id: vendorId } });
      if (!vendor || vendor.role !== 'VENDOR') {
        return NextResponse.json({ error: 'Vendeur non trouvé' }, { status: 404 });
      }

      let subscription = await db.subscription.findUnique({ where: { vendorId } });
      if (!subscription) {
        subscription = await db.subscription.create({
          data: {
            vendorId,
            status: 'ACTIVE',
            startDate: new Date(),
            expiryDate: new Date(),
            amount: MONTHLY_SUBSCRIPTION,
          },
        });
      }

      // Extend expiry by N months
      const baseDate = subscription.expiryDate && subscription.expiryDate > new Date()
        ? subscription.expiryDate
        : new Date();
      const newExpiryDate = new Date(baseDate);
      newExpiryDate.setMonth(newExpiryDate.getMonth() + months);

      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          expiryDate: newExpiryDate,
        },
      });

      // Re-activate vendor
      await db.user.update({
        where: { id: vendorId },
        data: { isSuspended: false, isActive: true },
      });

      // Notify vendor
      await db.notification.create({
        data: {
          userId: vendorId,
          title: 'Abonnement prolongé',
          message: `Votre abonnement a été prolongé de ${months} mois. Nouvelle date d'expiration: ${newExpiryDate.toLocaleDateString('fr-FR')}.`,
          type: 'SYSTEM',
        },
      });

      // Log activity
      await db.activityLog.create({
        data: {
          userId: admin.userId,
          action: 'EXTEND_SUBSCRIPTION',
          details: `Abonnement de ${vendor.name} prolongé de ${months} mois`,
        },
      });

      return NextResponse.json({
        success: true,
        newExpiryDate,
        monthsExtended: months,
      });
    }

    if (action === 'reactivate-vendor') {
      const { vendorId } = body;
      if (!vendorId) {
        return NextResponse.json({ error: 'vendorId requis' }, { status: 400 });
      }

      const vendor = await db.user.findUnique({ where: { id: vendorId } });
      if (!vendor || vendor.role !== 'VENDOR') {
        return NextResponse.json({ error: 'Vendeur non trouvé' }, { status: 404 });
      }

      // Re-activate vendor
      await db.user.update({
        where: { id: vendorId },
        data: { isSuspended: false, isActive: true },
      });

      // Create or reset subscription
      let subscription = await db.subscription.findUnique({ where: { vendorId } });

      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      if (subscription) {
        await db.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'ACTIVE',
            startDate: now,
            expiryDate,
          },
        });
      } else {
        subscription = await db.subscription.create({
          data: {
            vendorId,
            status: 'ACTIVE',
            startDate: now,
            expiryDate,
            amount: MONTHLY_SUBSCRIPTION,
          },
        });
      }

      // Notify vendor
      await db.notification.create({
        data: {
          userId: vendorId,
          title: 'Compte réactivé',
          message: 'Votre compte vendeur a été réactivé par l\'administrateur. Votre abonnement est actif.',
          type: 'SYSTEM',
        },
      });

      // Log activity
      await db.activityLog.create({
        data: {
          userId: admin.userId,
          action: 'REACTIVATE_VENDOR',
          details: `Vendeur ${vendor.name} (${vendor.email}) réactivé`,
        },
      });

      return NextResponse.json({
        success: true,
        subscription: {
          id: subscription.id,
          status: 'ACTIVE',
          expiryDate,
        },
      });
    }

    if (action === 'modify-status') {
      const { vendorId, status } = body;
      if (!vendorId || !status) {
        return NextResponse.json({ error: 'vendorId et status requis' }, { status: 400 });
      }

      if (!['INACTIVE', 'ACTIVE', 'EXPIRED', 'TRIAL'].includes(status)) {
        return NextResponse.json({ error: 'Statut invalide (INACTIVE, ACTIVE, EXPIRED, TRIAL)' }, { status: 400 });
      }

      const subscription = await db.subscription.findUnique({ where: { vendorId } });
      if (!subscription) {
        return NextResponse.json({ error: 'Abonnement non trouvé pour ce vendeur' }, { status: 404 });
      }

      await db.subscription.update({
        where: { id: subscription.id },
        data: { status },
      });

      // If setting to EXPIRED, notify vendor
      if (status === 'EXPIRED') {
        await db.notification.create({
          data: {
            userId: vendorId,
            title: 'Abonnement expiré',
            message: 'Votre abonnement a été marqué comme expiré par l\'administrateur. Veuillez le renouveler.',
            type: 'SYSTEM',
          },
        });
      } else if (status === 'ACTIVE' || status === 'TRIAL') {
        await db.user.update({
          where: { id: vendorId },
          data: { isSuspended: false, isActive: true },
        });
      }

      // Log activity
      const vendor = await db.user.findUnique({ where: { id: vendorId } });
      await db.activityLog.create({
        data: {
          userId: admin.userId,
          action: 'MODIFY_SUBSCRIPTION_STATUS',
          details: `Statut d'abonnement de ${vendor?.name || vendorId} changé à ${status}`,
        },
      });

      return NextResponse.json({ success: true, newStatus: status });
    }

    if (action === 'get-all-subscriptions') {
      const page = parseInt(body.page || '1');
      const limit = parseInt(body.limit || '20');
      const statusFilter = body.statusFilter;

      const where: Record<string, unknown> = {};
      if (statusFilter) where.status = statusFilter;

      const subscriptions = await db.subscription.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              isActive: true,
              isSuspended: true,
              shop: {
                select: { id: true, name: true, slug: true, logo: true, category: true, city: true },
              },
            },
          },
          _count: { select: { payments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await db.subscription.count({ where });

      // Add daysUntilExpiry for each subscription
      const subscriptionsWithDays = subscriptions.map(sub => ({
        ...sub,
        daysUntilExpiry: daysUntilExpiry(sub.expiryDate),
      }));

      return NextResponse.json({
        subscriptions: subscriptionsWithDays,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    if (action === 'get-payments') {
      const page = parseInt(body.page || '1');
      const limit = parseInt(body.limit || '20');
      const statusFilter = body.statusFilter;
      const typeFilter = body.typeFilter;

      const where: Record<string, unknown> = {};
      if (statusFilter) where.status = statusFilter;
      if (typeFilter) where.type = typeFilter;

      const payments = await db.payment.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              shop: {
                select: { id: true, name: true, slug: true, logo: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await db.payment.count({ where });

      return NextResponse.json({
        payments,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    console.error('Subscription POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
