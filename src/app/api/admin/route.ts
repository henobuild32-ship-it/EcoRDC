import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, hashPassword, generateToken, generateShopSlug } from '@/lib/auth';

// Helper to generate a random temporary password
function generateTempPassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    if (section === 'stats') {
      const [
        users, shops, products, orders, messages,
      ] = await Promise.all([
        db.user.count(),
        db.shop.count(),
        db.product.count(),
        db.order.count(),
        db.message.count(),
      ]);

      const vendorCount = await db.user.count({ where: { role: 'VENDOR' } });
      const clientCount = await db.user.count({ where: { role: 'CLIENT' } });
      const activeUsers = await db.user.count({ where: { isActive: true, isSuspended: false } });
      const suspendedUsers = await db.user.count({ where: { isSuspended: true } });
      const pendingRecommendations = await db.shop.count({ where: { recommendationStatus: 'PENDING' } });
      const recommendedShops = await db.shop.count({ where: { isRecommended: true } });
      const pendingPasswordResets = await db.passwordReset.count({ where: { status: 'PENDING' } });
      const totalRevenue = await db.order.aggregate({ _sum: { totalAmount: true }, where: { status: { in: ['PAID', 'DELIVERED'] } } });
      const pendingOrders = await db.order.count({ where: { status: 'PENDING' } });
      const confirmedOrders = await db.order.count({ where: { status: 'CONFIRMED' } });
      const activeProducts = await db.product.count({ where: { isActive: true } });

      // Today's stats (active today, new registrations, active/suspended shops)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      // Users active today (logged in / had activity today)
      const activeVendorsToday = await db.user.count({
        where: {
          role: 'VENDOR',
          isActive: true,
          isSuspended: false,
          updatedAt: { gte: startOfToday },
        },
      });
      const activeUsersToday = await db.user.count({
        where: {
          isActive: true,
          isSuspended: false,
          updatedAt: { gte: startOfToday },
        },
      });
      // New registrations today
      const newRegistrationsToday = await db.user.count({
        where: { createdAt: { gte: startOfToday } },
      });
      // New registrations this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      const newRegistrationsThisWeek = await db.user.count({
        where: { createdAt: { gte: startOfWeek } },
      });

      // Active shops and suspended shops
      const activeShops = await db.shop.count({ where: { isActive: true } });
      const suspendedShops = await db.shop.count({
        where: { suspensionType: { not: null } },
      });
      const permanentlySuspendedShops = await db.shop.count({
        where: { suspensionType: 'PERMANENT' },
      });
      const temporarilySuspendedShops = await db.shop.count({
        where: { suspensionType: 'TEMPORARY' },
      });

      // Verified shops (with any badge)
      const allShopsForBadges = await db.shop.findMany({ select: { badges: true } });
      const verifiedShopsCount = allShopsForBadges.filter(s => {
        try {
          const b = JSON.parse(s.badges || '[]');
          return Array.isArray(b) && b.length > 0;
        } catch { return false; }
      }).length;

      // Revenue by month (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const recentOrders = await db.order.findMany({
        where: { status: { in: ['PAID', 'DELIVERED'] }, createdAt: { gte: sixMonthsAgo } },
        select: { totalAmount: true, createdAt: true },
      });

      const monthlyRevenue: Record<string, number> = {};
      for (const order of recentOrders) {
        const monthKey = order.createdAt.toISOString().substring(0, 7); // YYYY-MM
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + order.totalAmount;
      }

      // Subscription & payment stats
      const activeSubscriptions = await db.subscription.count({ where: { status: 'ACTIVE' } });
      const expiredSubscriptions = await db.subscription.count({ where: { status: 'EXPIRED' } });
      const inactiveSubscriptions = await db.subscription.count({ where: { status: 'INACTIVE' } });
      const trialSubscriptions = await db.subscription.count({ where: { status: 'TRIAL' } });
      const subscriptionRevenue = await db.payment.aggregate({
        _sum: { amount: true },
        where: { type: { in: ['SUBSCRIPTION', 'RENEWAL'] }, status: 'COMPLETED' },
      });
      const registrationRevenue = await db.payment.aggregate({
        _sum: { amount: true },
        where: { type: 'REGISTRATION', status: 'COMPLETED' },
      });
      const pendingPayments = await db.payment.count({ where: { status: 'PENDING' } });
      const failedPayments = await db.payment.count({ where: { status: 'FAILED' } });

      // Reports stats
      const pendingReports = await db.report.count({ where: { status: 'PENDING' } });
      const resolvedReports = await db.report.count({ where: { status: 'RESOLVED' } });
      const urgentReports = await db.report.count({ where: { priority: 'URGENT', status: { in: ['PENDING', 'REVIEWING'] } } });

      return NextResponse.json({
        stats: {
          users, shops, products, orders, messages,
          vendorCount, clientCount, activeUsers, suspendedUsers,
          pendingRecommendations, recommendedShops, pendingPasswordResets,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          pendingOrders, confirmedOrders, activeProducts,
          monthlyRevenue,
          activeSubscriptions, expiredSubscriptions, inactiveSubscriptions, trialSubscriptions,
          subscriptionRevenue: subscriptionRevenue._sum.amount || 0,
          registrationRevenue: registrationRevenue._sum.amount || 0,
          totalSubscriptionRevenue: subscriptionRevenue._sum.amount || 0,
          totalRegistrationRevenue: registrationRevenue._sum.amount || 0,
          pendingPayments, failedPayments,
          // New enhanced stats
          activeVendorsToday,
          activeUsersToday,
          newRegistrationsToday,
          newRegistrationsThisWeek,
          activeShops,
          suspendedShops,
          permanentlySuspendedShops,
          temporarilySuspendedShops,
          verifiedShopsCount,
          pendingReports,
          resolvedReports,
          urgentReports,
        },
      });
    }

    if (section === 'vendors') {
      const where: Record<string, unknown> = { role: 'VENDOR' };
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
        ];
      }
      const vendors = await db.user.findMany({
        where,
        include: {
          shop: {
            select: {
              id: true, name: true, slug: true, logo: true, category: true,
              city: true, country: true, phone: true, email: true,
              commune: true, hours: true, socials: true, currency: true,
              isRecommended: true, isActive: true, badges: true,
              suspensionType: true, suspensionReason: true, suspendedUntil: true,
              _count: { select: { products: true, followers: true, orders: true } },
            },
          },
          subscription: {
            select: {
              id: true, status: true, startDate: true, expiryDate: true,
              amount: true, freeMonths: true, createdAt: true, updatedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
      const total = await db.user.count({ where });
      return NextResponse.json({ vendors, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }

    if (section === 'vendor-details') {
      // Detailed view of a single vendor: subscription, shop, recent activity
      const vendorId = searchParams.get('vendorId');
      if (!vendorId) return NextResponse.json({ error: 'vendorId requis' }, { status: 400 });

      const vendor = await db.user.findUnique({
        where: { id: vendorId, role: 'VENDOR' },
        include: {
          shop: {
            select: {
              id: true, name: true, slug: true, logo: true, description: true,
              category: true, city: true, address: true, country: true,
              isActive: true, isRecommended: true, badges: true,
              suspensionType: true, suspensionReason: true, suspensionComment: true,
              suspendedAt: true, suspendedUntil: true,
              createdAt: true, updatedAt: true,
              _count: { select: { products: true, followers: true, orders: true } },
            },
          },
          subscription: true,
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          activityLogs: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });
      if (!vendor) return NextResponse.json({ error: 'Vendeur non trouvé' }, { status: 404 });

      // Recent orders for the shop
      let recentOrders: unknown[] = [];
      if (vendor.shop) {
        recentOrders = await db.order.findMany({
          where: { shopId: vendor.shop.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            customer: { select: { id: true, name: true, email: true } },
          },
        });
      }

      return NextResponse.json({ vendor, recentOrders });
    }

    if (section === 'clients') {
      const where: Record<string, unknown> = { role: 'CLIENT' };
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
          { city: { contains: search } },
        ];
      }
      const clients = await db.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, phone: true, avatar: true,
          address: true, city: true, country: true, isActive: true, isSuspended: true,
          createdAt: true,
          _count: { select: { customerOrders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
      const total = await db.user.count({ where });
      return NextResponse.json({ clients, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }

    if (section === 'recommendations') {
      const status = searchParams.get('status') || 'PENDING';
      const where: Record<string, unknown> = { recommendationStatus: status };
      const shops = await db.shop.findMany({
        where,
        include: { owner: { select: { id: true, name: true, email: true } }, _count: { select: { products: true, followers: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ shops });
    }

    if (section === 'password-resets') {
      const status = searchParams.get('status') || 'PENDING';
      const where: Record<string, unknown> = { status };
      const resets = await db.passwordReset.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ resets });
    }

    if (section === 'activity') {
      const where: Record<string, unknown> = {};
      const userId = searchParams.get('userId');
      const action = searchParams.get('action');
      const fromDate = searchParams.get('from');
      const toDate = searchParams.get('to');

      if (userId) where.userId = userId;
      if (action) where.action = action;
      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) (where.createdAt as Record<string, unknown>).gte = new Date(fromDate);
        if (toDate) (where.createdAt as Record<string, unknown>).lte = new Date(toDate);
      }
      if (search) {
        where.OR = [
          { action: { contains: search } },
          { details: { contains: search } },
          { user: { name: { contains: search } } },
        ];
      }

      const logs = await db.activityLog.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      });
      const total = await db.activityLog.count({ where });
      return NextResponse.json({ logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }

    if (section === 'all-shops') {
      // Auto-repair: Ensure all vendors have a shop record (1 Vendor = 1 Shop)
      try {
        const vendorsWithoutShop = await db.user.findMany({
          where: { role: 'VENDOR', shop: null },
        });
        for (const vendor of vendorsWithoutShop) {
          const shopName = `Boutique ${vendor.name}`;
          let baseSlug = generateShopSlug(shopName);
          let slug = baseSlug;
          let suffix = 1;
          while (suffix < 50) {
            const existing = await db.shop.findUnique({ where: { slug } });
            if (!existing) break;
            slug = `${baseSlug}-${suffix}`;
            suffix++;
          }
          await db.shop.create({
            data: {
              name: shopName,
              slug,
              ownerId: vendor.id,
              email: vendor.email,
              phone: vendor.phone,
              city: vendor.city,
              country: vendor.country || 'RD Congo',
              isActive: true,
            },
          });
        }
      } catch {
        // silent auto-repair fail
      }

      const where: Record<string, unknown> = {};
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { category: { contains: search } },
          { city: { contains: search } },
        ];
      }
      const shops = await db.shop.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          products: { select: { id: true } },
          _count: { select: { products: true, followers: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
      const total = await db.shop.count({ where });
      return NextResponse.json({ shops, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }

    if (section === 'all-orders') {
      const where: Record<string, unknown> = {};
      const status = searchParams.get('status');
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { orderNumber: { contains: search } },
          { customer: { name: { contains: search } } },
        ];
      }
      const orders = await db.order.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, email: true } },
          shop: { select: { id: true, name: true, logo: true } },
          items: { include: { product: { select: { id: true, name: true, price: true } } } },
          invoice: { select: { id: true, invoiceNumber: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
      const total = await db.order.count({ where });
      return NextResponse.json({ orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }

    if (section === 'subscriptions') {
      const status = searchParams.get('status');
      const where: Record<string, unknown> = {};
      if (status && status !== 'ALL') where.status = status;
      if (search) {
        where.vendor = {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        };
      }
      const subscriptions = await db.subscription.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true, name: true, email: true, isSuspended: true, isActive: true,
              shop: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
      const total = await db.subscription.count({ where });

      const allSubs = await db.subscription.findMany();
      const activeCount = allSubs.filter(s => s.status === 'ACTIVE').length;
      const expiredCount = allSubs.filter(s => s.status === 'EXPIRED').length;
      const inactiveCount = allSubs.filter(s => s.status === 'INACTIVE').length;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthRevenue = await db.payment.aggregate({
        _sum: { amount: true },
        where: { type: { in: ['SUBSCRIPTION', 'RENEWAL'] }, status: 'COMPLETED', createdAt: { gte: monthStart } },
      });

      return NextResponse.json({
        subscriptions,
        stats: { active: activeCount, expired: expiredCount, inactive: inactiveCount, monthlyRevenue: monthRevenue._sum.amount || 0 },
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    if (section === 'payments') {
      const status = searchParams.get('status');
      const type = searchParams.get('type');
      const vendorId = searchParams.get('vendorId');
      const from = searchParams.get('from');
      const to = searchParams.get('to');

      const where: Record<string, unknown> = {};
      if (status && status !== 'ALL') where.status = status;
      if (type && type !== 'ALL') where.type = type;
      if (vendorId) where.vendorId = vendorId;
      if (from || to) {
        where.createdAt = {};
        if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
        if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
      }
      if (search) {
        where.vendor = {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        };
      }

      const payments = await db.payment.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
      const total = await db.payment.count({ where });

      // Payment stats
      const registrationRev = await db.payment.aggregate({ _sum: { amount: true }, where: { type: 'REGISTRATION', status: 'COMPLETED' } });
      const subscriptionRev = await db.payment.aggregate({ _sum: { amount: true }, where: { type: { in: ['SUBSCRIPTION', 'RENEWAL'] }, status: 'COMPLETED' } });
      const pendingPay = await db.payment.count({ where: { status: 'PENDING' } });
      const failedPay = await db.payment.count({ where: { status: 'FAILED' } });

      return NextResponse.json({
        payments,
        stats: {
          registrationRevenue: registrationRev._sum.amount || 0,
          subscriptionRevenue: subscriptionRev._sum.amount || 0,
          pendingPayments: pendingPay,
          failedPayments: failedPay,
        },
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    if (section === 'reports') {
      const status = searchParams.get('status');
      const type = searchParams.get('type');
      const priority = searchParams.get('priority');
      const where: Record<string, unknown> = {};
      if (status && status !== 'ALL') where.status = status;
      if (type && type !== 'ALL') where.type = type;
      if (priority && priority !== 'ALL') where.priority = priority;
      if (search) {
        where.OR = [
          { reason: { contains: search } },
          { description: { contains: search } },
        ];
      }
      const reports = await db.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, name: true, email: true, avatar: true } },
          resolvedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
      const total = await db.report.count({ where });

      // Stats for reports
      const pendingCount = await db.report.count({ where: { status: 'PENDING' } });
      const reviewingCount = await db.report.count({ where: { status: 'REVIEWING' } });
      const resolvedCount = await db.report.count({ where: { status: 'RESOLVED' } });
      const dismissedCount = await db.report.count({ where: { status: 'DISMISSED' } });
      const urgentCount = await db.report.count({ where: { priority: 'URGENT', status: { in: ['PENDING', 'REVIEWING'] } } });

      return NextResponse.json({
        reports,
        stats: {
          pending: pendingCount,
          reviewing: reviewingCount,
          resolved: resolvedCount,
          dismissed: dismissedCount,
          urgent: urgentCount,
          total: await db.report.count(),
        },
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    if (section === 'verifications') {
      // All shops with their badges for verification management
      const where: Record<string, unknown> = {};
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { category: { contains: search } },
          { city: { contains: search } },
          { owner: { name: { contains: search } } },
        ];
      }
      const shops = await db.shop.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true, isSuspended: true } },
          _count: { select: { products: true, followers: true, orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
      const total = await db.shop.count({ where });

      // Stats: count by badge
      const allShops = await db.shop.findMany({ select: { badges: true } });
      const badgeCounts: Record<string, number> = {
        VERIFIED_SHOP: 0,
        VERIFIED_SUPPLIER: 0,
        PREMIUM_SUPPLIER: 0,
        RECOMMENDED_SELLER: 0,
      };
      for (const s of allShops) {
        try {
          const b = JSON.parse(s.badges || '[]');
          if (Array.isArray(b)) {
            for (const badge of b) {
              if (badgeCounts[badge] !== undefined) badgeCounts[badge]++;
            }
          }
        } catch {
          // skip
        }
      }
      const verifiedCount = allShops.filter(s => {
        try {
          const b = JSON.parse(s.badges || '[]');
          return Array.isArray(b) && b.length > 0;
        } catch { return false; }
      }).length;

      return NextResponse.json({
        shops,
        stats: {
          total: allShops.length,
          verified: verifiedCount,
          unverified: allShops.length - verifiedCount,
          badgeCounts,
        },
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    if (section === 'admin-messages') {
      // List all admin-sent messages (history)
      const where: Record<string, unknown> = {};
      const type = searchParams.get('type');
      const messageType = searchParams.get('messageType');
      if (type && type !== 'ALL') where.type = type;
      if (messageType && messageType !== 'ALL') where.messageType = messageType;
      if (search) {
        where.OR = [
          { title: { contains: search } },
          { message: { contains: search } },
        ];
      }
      const messages = await db.adminMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
      const total = await db.adminMessage.count({ where });

      const stats = {
        total: await db.adminMessage.count(),
        global: await db.adminMessage.count({ where: { type: 'GLOBAL' } }),
        roleTargeted: await db.adminMessage.count({ where: { type: 'ROLE_TARGETED' } }),
        private: await db.adminMessage.count({ where: { type: 'PRIVATE' } }),
        multi: await db.adminMessage.count({ where: { type: 'MULTI' } }),
      };

      return NextResponse.json({
        messages,
        stats,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    if (section === 'users-minimal') {
      // Lightweight list of all users for selection (e.g. multi-target messaging)
      const role = searchParams.get('role');
      const where: Record<string, unknown> = { isActive: true, isSuspended: false };
      if (role && role !== 'ALL') where.role = role;
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
        ];
      }
      const users = await db.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, role: true, avatar: true, city: true,
        },
        orderBy: { name: 'asc' },
        take: 100,
      });
      return NextResponse.json({ users });
    }

    return NextResponse.json({ error: 'Section non reconnue' }, { status: 400 });
  } catch (error) {
    console.error('Admin GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // verify-admin and log-admin-access don't require auth token
    if (action === 'verify-admin') {
      const { code } = body;
      const adminCode = process.env.ADMIN_SECRET_CODE;
      // Use constant-time comparison to mitigate timing attacks
      const a = String(code || '');
      const b = String(adminCode || '');
      const verified = a.length === b.length && a.split('').every((ch, i) => ch === b[i]);
      if (verified) {
        // Find or create a system admin user so activity logs can reference it
        let adminUser = await db.user.findFirst({ where: { role: 'ADMIN' } });
        if (!adminUser) {
          // Create a system admin account with a random unguessable password
          // (the password is never used for login — admin access is via the secret code only)
          const randomPassword = Math.random().toString(36) + Math.random().toString(36) + Date.now().toString(36);
          const hashedPassword = await hashPassword(randomPassword);
          adminUser = await db.user.create({
            data: {
              email: 'admin@ecordc.local',
              password: hashedPassword,
              name: 'Administrateur',
              role: 'ADMIN',
              isActive: true,
              isSuspended: false,
            },
          });
        }

        // Generate an admin JWT token
        const adminToken = generateToken({
          userId: adminUser.id,
          email: adminUser.email,
          role: 'ADMIN',
        });
        return NextResponse.json({
          verified: true,
          token: adminToken,
          user: {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            role: 'ADMIN',
            isActive: true,
            isSuspended: false,
            createdAt: adminUser.createdAt.toISOString(),
          },
        });
      }
      return NextResponse.json({ verified: false }, { status: 401 });
    }

    if (action === 'log-admin-access') {
      // Log the admin access attempt (no auth required - just record it)
      try {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        await db.activityLog.create({
          data: {
            userId: null,
            action: 'ADMIN_ACCESS',
            details: `Accès administrateur depuis IP: ${ip}`,
          },
        });
      } catch {
        // Silently handle logging errors
      }
      return NextResponse.json({ success: true });
    }

    // All other actions require auth
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 });
    }

    if (action === 'suspend-user') {
      const { userId, reason } = body;
      if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 });

      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
      if (user.role === 'ADMIN') return NextResponse.json({ error: 'Impossible de suspendre un administrateur' }, { status: 403 });

      await db.user.update({ where: { id: userId }, data: { isSuspended: true, isActive: false } });

      // Notify user
      await db.notification.create({
        data: {
          userId,
          title: 'Compte suspendu',
          message: reason || 'Votre compte a été suspendu par un administrateur',
          type: 'SYSTEM',
        },
      });

      await db.activityLog.create({ data: { userId: payload.userId, action: 'SUSPEND_USER', details: `Utilisateur ${user.name} (${user.email}) suspendu${reason ? `: ${reason}` : ''}` } });
      return NextResponse.json({ success: true });
    }

    if (action === 'reactivate-user') {
      const { userId } = body;
      if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 });

      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });

      await db.user.update({ where: { id: userId }, data: { isSuspended: false, isActive: true } });

      // Notify user
      await db.notification.create({
        data: {
          userId,
          title: 'Compte réactivé',
          message: 'Votre compte a été réactivé par un administrateur',
          type: 'SYSTEM',
        },
      });

      await db.activityLog.create({ data: { userId: payload.userId, action: 'REACTIVATE_USER', details: `Utilisateur ${user.name} (${user.email}) réactivé` } });
      return NextResponse.json({ success: true });
    }

    if (action === 'delete-user') {
      const { userId } = body;
      if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 });

      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
      if (user.role === 'ADMIN') return NextResponse.json({ error: 'Impossible de supprimer un administrateur' }, { status: 403 });

      await db.user.delete({ where: { id: userId } });
      await db.activityLog.create({ data: { userId: payload.userId, action: 'DELETE_USER', details: `Utilisateur ${user.name} (${user.email}) supprimé` } });
      return NextResponse.json({ success: true });
    }

    if (action === 'recommend-shop') {
      const { shopId, status } = body; // status: APPROVED or REJECTED
      if (!shopId || !status) return NextResponse.json({ error: 'shopId et status requis' }, { status: 400 });

      const shop = await db.shop.findUnique({ where: { id: shopId } });
      if (!shop) return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 });

      await db.shop.update({
        where: { id: shopId },
        data: { recommendationStatus: status, isRecommended: status === 'APPROVED' },
      });

      // Notify vendor
      await db.notification.create({
        data: {
          userId: shop.ownerId,
          title: status === 'APPROVED' ? 'Boutique recommandée' : 'Recommandation refusée',
          message: status === 'APPROVED'
            ? `Votre boutique "${shop.name}" est maintenant recommandée!`
            : `La demande de recommandation pour "${shop.name}" a été refusée.`,
          type: 'SYSTEM',
        },
      });

      await db.activityLog.create({ data: { userId: payload.userId, action: 'RECOMMEND_SHOP', details: `Boutique ${shop.name}: ${status}` } });
      return NextResponse.json({ success: true });
    }

    if (action === 'toggle-recommendation') {
      const { shopId, isRecommended } = body;
      if (!shopId) return NextResponse.json({ error: 'shopId requis' }, { status: 400 });

      const shop = await db.shop.findUnique({ where: { id: shopId } });
      if (!shop) return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 });

      await db.shop.update({
        where: { id: shopId },
        data: {
          isRecommended: isRecommended !== undefined ? isRecommended : !shop.isRecommended,
          recommendationStatus: isRecommended ? 'APPROVED' : 'NONE',
        },
      });

      await db.activityLog.create({
        data: { userId: payload.userId, action: 'TOGGLE_RECOMMENDATION', details: `Boutique ${shop.name}: ${isRecommended ? 'recommandée' : 'non recommandée'}` },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'reset-password') {
      const { resetId } = body;
      if (!resetId) return NextResponse.json({ error: 'resetId requis' }, { status: 400 });

      const reset = await db.passwordReset.findUnique({
        where: { id: resetId },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      if (!reset) return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
      if (reset.status !== 'PENDING') return NextResponse.json({ error: 'Cette demande a déjà été traitée' }, { status: 400 });

      // Generate a random temporary password
      const tempPassword = generateTempPassword(10);
      const hashedPassword = await hashPassword(tempPassword);

      await db.user.update({ where: { id: reset.userId }, data: { password: hashedPassword } });
      await db.passwordReset.update({ where: { id: resetId }, data: { status: 'RESOLVED' } });

      // Notify user
      await db.notification.create({
        data: {
          userId: reset.userId,
          title: 'Mot de passe réinitialisé',
          message: 'Votre mot de passe a été réinitialisé par un administrateur. Veuillez vous connecter avec le nouveau mot de passe fourni.',
          type: 'SYSTEM',
        },
      });

      await db.activityLog.create({
        data: { userId: payload.userId, action: 'RESET_PASSWORD', details: `Mot de passe réinitialisé pour ${reset.user.name} (${reset.user.email})` },
      });

      return NextResponse.json({ success: true, tempPassword, user: reset.user });
    }

    if (action === 'send-global-message') {
      const { title, message, messageType, targetRole } = body;
      if (!title || !message) return NextResponse.json({ error: 'Titre et message requis' }, { status: 400 });

      const msgType = messageType || 'SYSTEM';
      const normalizedType = targetRole && targetRole !== 'ALL' ? 'ROLE_TARGETED' : 'GLOBAL';
      await db.adminMessage.create({
        data: {
          type: normalizedType,
          targetRole: normalizedType === 'ROLE_TARGETED' ? targetRole : 'ALL',
          messageType: msgType,
          title,
          message,
          adminId: payload.userId,
        },
      });

      // Determine recipients
      const userWhere: Record<string, unknown> = { isActive: true, isSuspended: false };
      if (normalizedType === 'ROLE_TARGETED' && targetRole) {
        userWhere.role = targetRole;
      }
      const users = await db.user.findMany({ where: userWhere, select: { id: true } });
      await db.notification.createMany({
        data: users.map(u => ({
          userId: u.id,
          title,
          message,
          type: msgType,
        })),
      });

      await db.activityLog.create({
        data: {
          userId: payload.userId,
          action: 'SEND_GLOBAL_MESSAGE',
          details: `Message ${normalizedType === 'ROLE_TARGETED' ? `(rôle: ${targetRole})` : 'global'} [${msgType}]: ${title}`,
        },
      });
      return NextResponse.json({ success: true, recipients: users.length });
    }

    if (action === 'send-private-message') {
      const { targetId, title, message, messageType } = body;
      if (!targetId || !title || !message) return NextResponse.json({ error: 'targetId, titre et message requis' }, { status: 400 });

      const msgType = messageType || 'SYSTEM';
      await db.adminMessage.create({
        data: {
          type: 'PRIVATE',
          targetId,
          messageType: msgType,
          title,
          message,
          adminId: payload.userId,
        },
      });

      // Create notification
      await db.notification.create({
        data: { userId: targetId, title, message, type: msgType },
      });

      await db.activityLog.create({ data: { userId: payload.userId, action: 'SEND_PRIVATE_MESSAGE', details: `Message privé [${msgType}] à ${targetId}: ${title}` } });
      return NextResponse.json({ success: true });
    }

    if (action === 'send-multi-message') {
      // Send to multiple selected users
      const { targetIds, title, message, messageType } = body;
      if (!Array.isArray(targetIds) || targetIds.length === 0 || !title || !message) {
        return NextResponse.json({ error: 'targetIds (array), titre et message requis' }, { status: 400 });
      }
      const msgType = messageType || 'SYSTEM';

      // Save as a MULTI message (targetIds stored comma-separated in targetId field)
      await db.adminMessage.create({
        data: {
          type: 'MULTI',
          targetId: targetIds.join(','),
          messageType: msgType,
          title,
          message,
          adminId: payload.userId,
        },
      });

      // Create notifications for all selected users
      await db.notification.createMany({
        data: targetIds.map((id: string) => ({
          userId: id,
          title,
          message,
          type: msgType,
        })),
      });

      await db.activityLog.create({
        data: {
          userId: payload.userId,
          action: 'SEND_MULTI_MESSAGE',
          details: `Message multi [${msgType}] à ${targetIds.length} utilisateur(s): ${title}`,
        },
      });
      return NextResponse.json({ success: true, recipients: targetIds.length });
    }

    if (action === 'delete-shop') {
      const { shopId } = body;
      if (!shopId) return NextResponse.json({ error: 'shopId requis' }, { status: 400 });

      const shop = await db.shop.findUnique({ where: { id: shopId } });
      if (!shop) return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 });

      // Soft delete
      await db.shop.update({ where: { id: shopId }, data: { isActive: false } });

      await db.activityLog.create({
        data: { userId: payload.userId, action: 'DELETE_SHOP', details: `Boutique supprimée: ${shop.name}` },
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'grant-free-shop') {
      // Grant a free shop subscription to a vendor for a custom duration
      const { vendorId, durationDays, reason } = body;
      if (!vendorId) return NextResponse.json({ error: 'vendorId requis' }, { status: 400 });
      if (!durationDays || durationDays < 1) return NextResponse.json({ error: 'durationDays doit être >= 1' }, { status: 400 });

      const vendor = await db.user.findUnique({ where: { id: vendorId, role: 'VENDOR' } });
      if (!vendor) return NextResponse.json({ error: 'Vendeur non trouvé' }, { status: 404 });

      const now = new Date();
      const startDate = now;
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + durationDays);

      // Upsert subscription (TRIAL status for free grants)
      const existing = await db.subscription.findUnique({ where: { vendorId } });
      if (existing) {
        // Extend from current expiry if still active, else from now
        const baseDate = existing.expiryDate && new Date(existing.expiryDate) > now ? new Date(existing.expiryDate) : now;
        const newExpiry = new Date(baseDate);
        newExpiry.setDate(newExpiry.getDate() + durationDays);
        await db.subscription.update({
          where: { vendorId },
          data: {
            status: 'TRIAL',
            startDate: existing.startDate || startDate,
            expiryDate: newExpiry,
          },
        });
      } else {
        await db.subscription.create({
          data: {
            vendorId,
            status: 'TRIAL',
            startDate,
            expiryDate,
            amount: 0,
          },
        });
      }

      // Ensure vendor is active
      await db.user.update({
        where: { id: vendorId },
        data: { isSuspended: false, isActive: true },
      });

      // Record an ADMIN_GRANT payment for audit
      await db.payment.create({
        data: {
          vendorId,
          amount: 0,
          currency: 'CDF',
          type: 'SUBSCRIPTION',
          status: 'COMPLETED',
          paymentMethod: 'ADMIN_GRANT',
          description: `Attribution gratuite: ${durationDays} jour(s)${reason ? ` - ${reason}` : ''}`,
        },
      });

      // Notify vendor
      await db.notification.create({
        data: {
          userId: vendorId,
          title: 'Boutique attribuée gratuitement',
          message: `Un administrateur vous a attribué ${durationDays} jour(s) d'accès gratuit à votre boutique. Profitez-en ! À l'expiration, vous devrez souscrire à l'abonnement standard (10 000 FC/mois).`,
          type: 'SYSTEM',
        },
      });

      await db.activityLog.create({
        data: {
          userId: payload.userId,
          action: 'GRANT_FREE_SHOP',
          details: `Boutique gratuite accordée à ${vendor.name} (${vendor.email}) pour ${durationDays} jour(s)${reason ? `: ${reason}` : ''}`,
        },
      });
      return NextResponse.json({ success: true, expiryDate });
    }

    if (action === 'create-vendor') {
      // Admin creates a brand-new vendor account (User + Shop + TRIAL Subscription) in one shot.
      // The admin sets the name, email, password (or lets the system generate one), and optional
      // profile photo. The vendor can then log in with these credentials and access their dashboard
      // during the free trial period. After the trial, they must subscribe (10 000 FC/month).
      const {
        name, email, password, phone, city, country, avatar,
        shopName, shopDescription, shopCategory, shopAddress, shopCity, shopCountry,
        shopPhone, shopEmail, shopCommune, shopHours, shopSocials, shopCurrency,
        durationDays, reason,
      } = body;

      // --- Validation ---
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return NextResponse.json({ error: 'Le nom est requis (2 caractères minimum)' }, { status: 400 });
      }
      if (!email || typeof email !== 'string') {
        return NextResponse.json({ error: 'L\'adresse email est requise' }, { status: 400 });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Format d\'email invalide' }, { status: 400 });
      }
      if (!shopName || typeof shopName !== 'string' || shopName.trim().length < 2) {
        return NextResponse.json({ error: 'Le nom de la boutique est requis (2 caractères minimum)' }, { status: 400 });
      }

      // Password: admin can set a custom one, or we generate a secure temporary password
      let finalPassword: string;
      let passwordWasGenerated = false;
      if (password && typeof password === 'string' && password.length > 0) {
        if (password.length < 6) {
          return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères' }, { status: 400 });
        }
        finalPassword = password;
      } else {
        finalPassword = generateTempPassword(12);
        passwordWasGenerated = true;
      }

      // Check email uniqueness
      const existingUser = await db.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: 'Un compte existe déjà avec cette adresse email' }, { status: 409 });
      }

      // Trial duration: either a number of days (1-365) or 'PERMANENT' for lifetime access
      const isPermanent = durationDays === 'PERMANENT' || durationDays === 'LIFETIME';
      const trialDays = isPermanent ? 0 : Math.min(Math.max(parseInt(durationDays, 10) || 7, 1), 365);

      // --- Create the vendor account ---
      const hashedPassword = await hashPassword(finalPassword);

      const newVendor = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name.trim(),
          phone: phone?.trim() || null,
          city: city?.trim() || null,
          country: country?.trim() || null,
          avatar: avatar || null,
          role: 'VENDOR',
          isActive: true,
          isSuspended: false,
        },
      });

      // --- Create the shop with a unique slug ---
      let baseSlug = generateShopSlug(shopName.trim());
      let uniqueSlug = baseSlug;
      let slugSuffix = 1;
      while (await db.shop.findUnique({ where: { slug: uniqueSlug } })) {
        slugSuffix += 1;
        uniqueSlug = `${baseSlug}-${slugSuffix}`;
      }

      const newShop = await db.shop.create({
        data: {
          name: shopName.trim(),
          slug: uniqueSlug,
          description: shopDescription?.trim() || null,
          category: shopCategory?.trim() || null,
          address: shopAddress?.trim() || null,
          city: shopCity?.trim() || city?.trim() || null,
          country: shopCountry?.trim() || country?.trim() || null,
          phone: shopPhone?.trim() || null,
          email: shopEmail?.trim() || null,
          commune: shopCommune?.trim() || null,
          hours: shopHours?.trim() || null,
          socials: shopSocials?.trim() || null,
          currency: shopCurrency || 'CDF',
          ownerId: newVendor.id,
          isActive: true,
        },
      });

      // --- Create the subscription (TRIAL for limited days, PERMANENT for lifetime) ---
      const now = new Date();
      const expiryDate = new Date(now);
      if (isPermanent) {
        expiryDate.setFullYear(expiryDate.getFullYear() + 100);
      } else {
        expiryDate.setDate(expiryDate.getDate() + trialDays);
      }

      await db.subscription.create({
        data: {
          vendorId: newVendor.id,
          status: isPermanent ? 'PERMANENT' : 'TRIAL',
          startDate: now,
          expiryDate,
          amount: 0,
          freeMonths: 0,
        },
      });

      // --- Audit payment record ---
      await db.payment.create({
        data: {
          vendorId: newVendor.id,
          amount: 0,
          currency: 'CDF',
          type: 'SUBSCRIPTION',
          status: 'COMPLETED',
          paymentMethod: 'ADMIN_GRANT',
          description: isPermanent
            ? `Création de compte vendeur par admin - ACCÈS PERMANENT${reason ? ` - ${reason}` : ''}`
            : `Création de compte vendeur par admin - période d'essai de ${trialDays} jour(s)${reason ? ` - ${reason}` : ''}`,
        },
      });

      // --- Welcome notification for the vendor ---
      await db.notification.create({
        data: {
          userId: newVendor.id,
          title: isPermanent ? 'Bienvenue sur EcoRDC ! Accès permanent 🎉' : 'Bienvenue sur EcoRDC ! 🎉',
          message: isPermanent
            ? `Votre compte vendeur a été créé par l'administration avec un ACCÈS PERMANENT à votre boutique « ${shopName.trim()} ». Vous n'aurez jamais à payer d'abonnement. Bonne chance pour vos ventes !`
            : `Votre compte vendeur a été créé par l'administration. Vous disposez de ${trialDays} jour(s) d'accès gratuit à votre boutique « ${shopName.trim()} ». Après cette période, vous devrez souscrire à l'abonnement standard (10 000 FC/mois) pour continuer à vendre. Bonne chance pour vos ventes !`,
          type: 'SYSTEM',
        },
      });

      // --- Admin activity log ---
      await db.activityLog.create({
        data: {
          userId: payload.userId,
          action: 'CREATE_VENDOR',
          details: isPermanent
            ? `Compte vendeur créé : ${name.trim()} (${email}) - Boutique « ${shopName.trim()} » - ACCÈS PERMANENT`
            : `Compte vendeur créé : ${name.trim()} (${email}) - Boutique « ${shopName.trim()} » - Essai de ${trialDays} jour(s)`,
        },
      });

      return NextResponse.json({
        success: true,
        vendor: {
          id: newVendor.id,
          name: newVendor.name,
          email: newVendor.email,
          phone: newVendor.phone,
          role: newVendor.role,
        },
        shop: {
          id: newShop.id,
          name: newShop.name,
          slug: newShop.slug,
        },
        temporaryPassword: finalPassword,
        passwordWasGenerated,
        trialDays,
        permanent: isPermanent,
        trialExpiryDate: expiryDate,
      });
    }

    if (action === 'suspend-shop') {
      const { shopId, suspensionType, reason, comment, durationDays } = body;
      if (!shopId) return NextResponse.json({ error: 'shopId requis' }, { status: 400 });
      if (!suspensionType || !['TEMPORARY', 'PERMANENT'].includes(suspensionType)) {
        return NextResponse.json({ error: 'suspensionType doit être TEMPORARY ou PERMANENT' }, { status: 400 });
      }
      if (!reason) return NextResponse.json({ error: 'Motif de suspension requis' }, { status: 400 });

      const shop = await db.shop.findUnique({ where: { id: shopId }, include: { owner: { select: { id: true, name: true, email: true } } } });
      if (!shop) return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 });

      const now = new Date();
      const suspendedUntil = suspensionType === 'TEMPORARY' && durationDays
        ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
        : null;

      await db.shop.update({
        where: { id: shopId },
        data: {
          isActive: false,
          suspensionType,
          suspensionReason: reason,
          suspensionComment: comment || null,
          suspendedAt: now,
          suspendedUntil,
        },
      });

      // Make products inactive (hidden)
      await db.product.updateMany({
        where: { shopId },
        data: { isActive: false },
      });

      // Suspend vendor account too
      await db.user.update({
        where: { id: shop.ownerId },
        data: { isSuspended: suspensionType === 'PERMANENT', isActive: suspensionType !== 'PERMANENT' },
      });

      // Notify vendor with detailed message
      const detailMessage = `Votre boutique "${shop.name}" a été ${suspensionType === 'PERMANENT' ? 'définitivement suspendue' : 'temporairement suspendue'}.

Motif: ${reason}
${comment ? `Commentaire: ${comment}` : ''}
${suspendedUntil ? `Jusqu'au: ${suspendedUntil.toLocaleDateString('fr-FR')}` : ''}

Pour toute question, contactez le support EcoRDC.`;

      await db.notification.create({
        data: {
          userId: shop.ownerId,
          title: `Boutique ${suspensionType === 'PERMANENT' ? 'suspendue définitivement' : 'suspendue temporairement'}`,
          message: detailMessage,
          type: 'ALERT',
        },
      });

      await db.activityLog.create({
        data: {
          userId: payload.userId,
          action: 'SUSPEND_SHOP',
          details: `Boutique "${shop.name}" (${shop.owner.email}) suspendue (${suspensionType}) - Motif: ${reason}${comment ? ` | Commentaire: ${comment}` : ''}`,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'unsuspend-shop') {
      const { shopId } = body;
      if (!shopId) return NextResponse.json({ error: 'shopId requis' }, { status: 400 });

      const shop = await db.shop.findUnique({ where: { id: shopId }, include: { owner: { select: { id: true, name: true, email: true } } } });
      if (!shop) return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 });

      await db.shop.update({
        where: { id: shopId },
        data: {
          isActive: true,
          suspensionType: null,
          suspensionReason: null,
          suspensionComment: null,
          suspendedAt: null,
          suspendedUntil: null,
        },
      });

      // Reactivate products
      await db.product.updateMany({
        where: { shopId },
        data: { isActive: true },
      });

      // Reactivate vendor
      await db.user.update({
        where: { id: shop.ownerId },
        data: { isSuspended: false, isActive: true },
      });

      await db.notification.create({
        data: {
          userId: shop.ownerId,
          title: 'Boutique réactivée',
          message: `Votre boutique "${shop.name}" a été réactivée. Vous pouvez de nouveau recevoir des commandes.`,
          type: 'SYSTEM',
        },
      });

      await db.activityLog.create({
        data: {
          userId: payload.userId,
          action: 'UNSUSPEND_SHOP',
          details: `Boutique "${shop.name}" (${shop.owner.email}) réactivée`,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'toggle-shop-badge') {
      const { shopId, badge } = body;
      if (!shopId || !badge) return NextResponse.json({ error: 'shopId et badge requis' }, { status: 400 });
      const validBadges = ['VERIFIED_SHOP', 'VERIFIED_SUPPLIER', 'PREMIUM_SUPPLIER', 'RECOMMENDED_SELLER'];
      if (!validBadges.includes(badge)) {
        return NextResponse.json({ error: 'Badge invalide. Valid: ' + validBadges.join(', ') }, { status: 400 });
      }

      const shop = await db.shop.findUnique({ where: { id: shopId }, include: { owner: { select: { id: true, name: true, email: true } } } });
      if (!shop) return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 });

      let badges: string[] = [];
      try { badges = JSON.parse(shop.badges || '[]'); } catch { badges = []; }
      if (!Array.isArray(badges)) badges = [];

      const has = badges.includes(badge);
      let newBadges: string[];
      let action_label: string;
      if (has) {
        newBadges = badges.filter(b => b !== badge);
        action_label = `Badge retiré: ${badge}`;
      } else {
        newBadges = [...badges, badge];
        action_label = `Badge attribué: ${badge}`;
      }

      await db.shop.update({
        where: { id: shopId },
        data: { badges: JSON.stringify(newBadges) },
      });

      // Notify vendor
      await db.notification.create({
        data: {
          userId: shop.ownerId,
          title: has ? 'Badge retiré' : 'Badge attribué',
          message: has
            ? `Le badge "${badge}" a été retiré de votre boutique "${shop.name}".`
            : `Félicitations! Le badge "${badge}" a été attribué à votre boutique "${shop.name}".`,
          type: 'SYSTEM',
        },
      });

      await db.activityLog.create({
        data: {
          userId: payload.userId,
          action: 'TOGGLE_SHOP_BADGE',
          details: `Boutique "${shop.name}" (${shop.owner.email}): ${action_label}`,
        },
      });
      return NextResponse.json({ success: true, badges: newBadges });
    }

    if (action === 'resolve-report') {
      const { reportId, status, adminResponse } = body;
      if (!reportId) return NextResponse.json({ error: 'reportId requis' }, { status: 400 });
      if (!status || !['RESOLVED', 'DISMISSED', 'REVIEWING'].includes(status)) {
        return NextResponse.json({ error: 'status doit être RESOLVED, DISMISSED ou REVIEWING' }, { status: 400 });
      }

      const report = await db.report.findUnique({ where: { id: reportId }, include: { reporter: { select: { id: true, name: true, email: true } } } });
      if (!report) return NextResponse.json({ error: 'Signalement non trouvé' }, { status: 404 });

      const updateData: Record<string, unknown> = {
        status,
        adminResponse: adminResponse || null,
      };
      if (status === 'RESOLVED' || status === 'DISMISSED') {
        updateData.resolvedById = payload.userId;
        updateData.resolvedAt = new Date();
      }
      await db.report.update({ where: { id: reportId }, data: updateData });

      // Notify reporter
      await db.notification.create({
        data: {
          userId: report.reporterId,
          title: `Signalement ${status === 'RESOLVED' ? 'résolu' : status === 'DISMISSED' ? 'classé sans suite' : 'en cours de traitement'}`,
          message: `Votre signalement a été ${status === 'RESOLVED' ? 'résolu' : status === 'DISMISSED' ? 'classé sans suite' : 'pris en charge'}.${adminResponse ? ` Réponse: ${adminResponse}` : ''}`,
          type: 'SYSTEM',
        },
      });

      await db.activityLog.create({
        data: {
          userId: payload.userId,
          action: 'RESOLVE_REPORT',
          details: `Signalement ${report.id} (${report.type}/${report.reason}) → ${status}${adminResponse ? ` | Réponse: ${adminResponse}` : ''}`,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'create-report') {
      // Admin can also create a report/complaint on behalf of the system
      const { type, targetId, reason, description, priority } = body;
      if (!type || !targetId || !reason) return NextResponse.json({ error: 'type, targetId et reason requis' }, { status: 400 });

      const report = await db.report.create({
        data: {
          type,
          reporterId: payload.userId,
          targetId,
          reason,
          description: description || null,
          priority: priority || 'NORMAL',
        },
      });

      await db.activityLog.create({
        data: {
          userId: payload.userId,
          action: 'CREATE_REPORT',
          details: `Signalement créé: ${type}/${reason} (cible: ${targetId})`,
        },
      });
      return NextResponse.json({ success: true, report });
    }

    if (action === 'log-admin-action') {
      // Generic admin action logger (for actions performed in other API routes that need audit trail)
      const { action: loggedAction, details } = body;
      if (!loggedAction) return NextResponse.json({ error: 'action requise' }, { status: 400 });

      await db.activityLog.create({
        data: {
          userId: payload.userId,
          action: String(loggedAction).toUpperCase(),
          details: details || null,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'ensure-shop') {
      const { vendorId } = body;
      if (!vendorId) return NextResponse.json({ error: 'vendorId requis' }, { status: 400 });

      const vendor = await db.user.findUnique({ where: { id: vendorId } });
      if (!vendor || vendor.role !== 'VENDOR') {
        return NextResponse.json({ error: 'Vendeur non trouvé' }, { status: 404 });
      }

      const existingShop = await db.shop.findUnique({ where: { ownerId: vendor.id } });
      if (existingShop) {
        return NextResponse.json({ error: 'Ce vendeur a déjà une boutique', shopId: existingShop.id }, { status: 409 });
      }

      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + 30);

      const baseSlug = generateShopSlug(vendor.name);
      let slug = baseSlug;
      let suffix = 1;
      while (await db.shop.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${suffix}`;
        suffix++;
      }

      const shop = await db.shop.create({
        data: {
          name: `${vendor.name} - Boutique`,
          slug,
          description: null,
          category: null,
          address: vendor.address || null,
          city: vendor.city || null,
          country: vendor.country || 'RD Congo',
          phone: vendor.phone || null,
          email: vendor.email || null,
          commune: null,
          hours: null,
          socials: null,
          currency: 'CDF',
          ownerId: vendor.id,
          isActive: true,
        },
      });

      await db.subscription.create({
        data: {
          vendorId: vendor.id,
          status: 'TRIAL',
          startDate: now,
          expiryDate,
          amount: 0,
        },
      });

      await db.payment.create({
        data: {
          vendorId: vendor.id,
          amount: 0,
          currency: 'CDF',
          type: 'SUBSCRIPTION',
          status: 'COMPLETED',
          paymentMethod: 'ADMIN_GRANT',
          description: 'Boutique créée par l\'administrateur pour un vendeur existant',
        },
      });

      await db.notification.create({
        data: {
          userId: vendor.id,
          title: 'Boutique créée',
          message: `Une boutique a été créée pour votre compte. Profitez de 30 jours d'essai gratuit !`,
          type: 'SYSTEM',
        },
      });

      await db.activityLog.create({
        data: {
          userId: payload.userId,
          action: 'ENSURE_SHOP',
          details: `Boutique créée pour le vendeur ${vendor.name} (${vendor.email})`,
        },
      });

      return NextResponse.json({ success: true, shop: { id: shop.id, name: shop.name, slug: shop.slug } });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    console.error('Admin POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
