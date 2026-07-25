import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: 'Votre demande sera traitée après validation par un administrateur.' });
    }

    await db.passwordReset.create({
      data: { userId: user.id, status: 'PENDING' },
    });

    return NextResponse.json({ message: 'Votre demande sera traitée après validation par un administrateur.' });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
