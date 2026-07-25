import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = { userId: payload.userId };
    if (type) where.type = type;

    const total = await db.notification.count({ where });
    const totalPages = Math.ceil(total / limit);

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const unreadCount = await db.notification.count({
      where: { userId: payload.userId, isRead: false },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const body = await request.json();
    const { markAllRead, notificationId } = body;

    if (notificationId) {
      // Mark individual notification as read
      const notification = await db.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification || notification.userId !== payload.userId) {
        return NextResponse.json({ error: 'Notification non trouvée' }, { status: 404 });
      }

      await db.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      return NextResponse.json({ success: true });
    }

    if (markAllRead) {
      const result = await db.notification.updateMany({
        where: { userId: payload.userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, count: result.count });
    }

    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  } catch (error) {
    console.error('Notifications PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const clearAll = searchParams.get('clearAll');
    const clearRead = searchParams.get('clearRead');

    if (clearAll === 'true') {
      // Delete all notifications for this user
      const result = await db.notification.deleteMany({
        where: { userId: payload.userId },
      });
      return NextResponse.json({ success: true, count: result.count });
    }

    if (clearRead === 'true') {
      // Delete all read notifications
      const result = await db.notification.deleteMany({
        where: { userId: payload.userId, isRead: true },
      });
      return NextResponse.json({ success: true, count: result.count });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'ID notification requis' }, { status: 400 });
    }

    const notification = await db.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== payload.userId) {
      return NextResponse.json({ error: 'Notification non trouvée' }, { status: 404 });
    }

    await db.notification.delete({ where: { id: notificationId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
