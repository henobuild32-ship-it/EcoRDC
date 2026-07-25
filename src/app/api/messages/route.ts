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
    const partnerId = searchParams.get('partnerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (partnerId) {
      // Get messages with specific partner
      const skip = (page - 1) * limit;

      const total = await db.message.count({
        where: {
          OR: [
            { senderId: payload.userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: payload.userId },
          ],
        },
      });

      const messages = await db.message.findMany({
        where: {
          OR: [
            { senderId: payload.userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: payload.userId },
          ],
        },
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
          receiver: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      });

      // Mark as read
      await db.message.updateMany({
        where: { senderId: partnerId, receiverId: payload.userId, isRead: false },
        data: { isRead: true },
      });

      return NextResponse.json({
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // Get conversation list
    const sentMessages = await db.message.findMany({
      where: { senderId: payload.userId },
      select: { receiverId: true, receiver: { select: { id: true, name: true, avatar: true, role: true } }, content: true, createdAt: true, isRead: true, attachment: true },
      orderBy: { createdAt: 'desc' },
    });

    const receivedMessages = await db.message.findMany({
      where: { receiverId: payload.userId },
      select: { senderId: true, sender: { select: { id: true, name: true, avatar: true, role: true } }, content: true, createdAt: true, isRead: true, attachment: true },
      orderBy: { createdAt: 'desc' },
    });

    // Deduplicate partners
    const partners = new Map();
    [...sentMessages, ...receivedMessages].forEach((msg: Record<string, unknown>) => {
      const senderId = msg.senderId as string;
      const partner = senderId === payload.userId ? msg.receiver : msg.sender;
      if (!partners.has((partner as Record<string, unknown>).id)) {
        partners.set((partner as Record<string, unknown>).id, {
          ...(partner as Record<string, unknown>),
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          hasAttachment: !!msg.attachment,
        });
      }
    });

    // Get unread counts
    const unreadCounts = await db.message.groupBy({
      by: ['senderId'],
      where: { receiverId: payload.userId, isRead: false },
      _count: true,
    });

    const unreadMap = new Map(unreadCounts.map((u: Record<string, unknown>) => [u.senderId, u._count]));

    const conversations = Array.from(partners.values()).map((p: Record<string, unknown>) => ({
      ...p,
      unreadCount: unreadMap.get(p.id) || 0,
    }));

    // Sort by last message time
    conversations.sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
      new Date(b.lastMessageTime as string).getTime() - new Date(a.lastMessageTime as string).getTime()
    );

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const body = await request.json();
    const { receiverId, content, attachment } = body;

    if (!receiverId) {
      return NextResponse.json({ error: 'Destinataire requis' }, { status: 400 });
    }

    if (!content && !attachment) {
      return NextResponse.json({ error: 'Contenu ou pièce jointe requis' }, { status: 400 });
    }

    // Verify receiver exists
    const receiver = await db.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      return NextResponse.json({ error: 'Destinataire non trouvé' }, { status: 404 });
    }

    const message = await db.message.create({
      data: {
        senderId: payload.userId,
        receiverId,
        content: content || '',
        attachment: attachment || null,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Create notification
    await db.notification.create({
      data: {
        userId: receiverId,
        title: 'Nouveau message',
        message: `Message de ${payload.name}`,
        type: 'MESSAGE',
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Messages POST error:', error);
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
    const { markAllRead, partnerId, messageIds } = body;

    if (markAllRead) {
      // Mark all unread messages as read
      await db.message.updateMany({
        where: { receiverId: payload.userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (partnerId) {
      // Mark all messages from a specific partner as read
      await db.message.updateMany({
        where: { senderId: partnerId, receiverId: payload.userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (messageIds && Array.isArray(messageIds)) {
      // Mark specific messages as read
      await db.message.updateMany({
        where: {
          id: { in: messageIds },
          receiverId: payload.userId,
        },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    // Mark a single message as read
    const { messageId } = body;
    if (messageId) {
      const message = await db.message.findUnique({ where: { id: messageId } });
      if (!message) {
        return NextResponse.json({ error: 'Message non trouvé' }, { status: 404 });
      }
      if (message.receiverId !== payload.userId) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
      await db.message.update({
        where: { id: messageId },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  } catch (error) {
    console.error('Messages PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
