import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const addresses = await db.address.findMany({
      where: { userId: payload.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Addresses GET error:', error);
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
    const { firstName, lastName, phone, province, city, commune, quartier, avenue, numero, reference, instructions, isDefault } = body;

    if (!firstName || !lastName || !phone || !city) {
      return NextResponse.json({ error: 'firstName, lastName, phone et city sont requis' }, { status: 400 });
    }

    if (isDefault) {
      await db.address.updateMany({
        where: { userId: payload.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await db.address.create({
      data: {
        userId: payload.userId,
        firstName,
        lastName,
        phone,
        province,
        city,
        commune,
        quartier,
        avenue,
        numero,
        reference,
        instructions,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    console.error('Addresses POST error:', error);
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
    const { addressId, firstName, lastName, phone, province, city, commune, quartier, avenue, numero, reference, instructions, isDefault } = body;

    if (!addressId) {
      return NextResponse.json({ error: 'addressId requis' }, { status: 400 });
    }

    const existing = await db.address.findUnique({ where: { id: addressId } });
    if (!existing || existing.userId !== payload.userId) {
      return NextResponse.json({ error: 'Adresse non trouvée' }, { status: 404 });
    }

    if (isDefault) {
      await db.address.updateMany({
        where: { userId: payload.userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    const address = await db.address.update({
      where: { id: addressId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(province !== undefined && { province }),
        ...(city !== undefined && { city }),
        ...(commune !== undefined && { commune }),
        ...(quartier !== undefined && { quartier }),
        ...(avenue !== undefined && { avenue }),
        ...(numero !== undefined && { numero }),
        ...(reference !== undefined && { reference }),
        ...(instructions !== undefined && { instructions }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return NextResponse.json({ address });
  } catch (error) {
    console.error('Addresses PUT error:', error);
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
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    const existing = await db.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== payload.userId) {
      return NextResponse.json({ error: 'Adresse non trouvée' }, { status: 404 });
    }

    await db.address.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Addresses DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
