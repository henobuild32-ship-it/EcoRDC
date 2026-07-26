import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, generateShopSlug } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const search = searchParams.get('search');
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const recommended = searchParams.get('recommended');
    const myShop = searchParams.get('myShop');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get current user's shop
    if (myShop === 'true') {
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
      const payload = verifyToken(token);
      if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

      const shop = await db.shop.findUnique({
        where: { ownerId: payload.userId },
        include: {
          owner: { select: { id: true, name: true, email: true, phone: true } },
          products: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
          },
          _count: { select: { products: true, followers: true } },
        },
      });
      if (!shop) {
        if (payload.role === 'VENDOR') {
          const vendorUser = await db.user.findUnique({ where: { id: payload.userId } });
          if (vendorUser) {
            const shopName = `Boutique ${vendorUser.name}`;
            let baseSlug = generateShopSlug(shopName);
            let slug = baseSlug;
            let suffix = 1;
            while (suffix < 50) {
              const existing = await db.shop.findUnique({ where: { slug } });
              if (!existing) break;
              slug = `${baseSlug}-${suffix}`;
              suffix++;
            }
            const autoCreatedShop = await db.shop.create({
              data: {
                name: shopName,
                slug,
                ownerId: vendorUser.id,
                email: vendorUser.email,
                phone: vendorUser.phone,
                city: vendorUser.city,
                country: vendorUser.country || 'RD Congo',
                isActive: true,
              },
              include: {
                owner: { select: { id: true, name: true, email: true, phone: true } },
                products: { where: { isActive: true } },
                _count: { select: { products: true, followers: true } },
              },
            });
            return NextResponse.json({ shop: autoCreatedShop });
          }
        }
        return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 });
      }
      return NextResponse.json({ shop });
    }

    // Get single shop by slug
    if (slug) {
      const shop = await db.shop.findFirst({
        where: { OR: [{ slug }, { id: slug }] },
        include: {
          owner: { select: { id: true, name: true, email: true, phone: true } },
          products: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            include: {
              shop: { select: { id: true, name: true, logo: true, slug: true } },
            },
          },
          promotions: { where: { isActive: true } },
          _count: { select: { products: true, followers: true } },
        },
      });
      if (!shop) {
        return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 });
      }
      return NextResponse.json({ shop });
    }

    // Build filter conditions — include all shops (active and inactive) so admin sees everything
    const where: Record<string, unknown> = {};

    // Only apply isActive filter when NOT fetching for admin context
    const forClient = searchParams.get('client') === 'true' || recommended === 'true';
    if (forClient) {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (category) {
      where.category = category;
    }

    if (recommended === 'true') {
      where.isRecommended = true;
    }

    // Count total for pagination
    const total = await db.shop.count({ where });
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const shops = await db.shop.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true } },
        products: { where: { isActive: true }, select: { id: true } },
        _count: { select: { products: true, followers: true } },
      },
      orderBy: [
        { isRecommended: 'desc' },
        { name: 'asc' },
      ],
      skip,
      take: limit,
    });

    return NextResponse.json(
      {
        shops,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
        },
      }
    );
  } catch (error) {
    console.error('Shops GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const { name, description, logo, category, address, city, country } = body;
    if (!name) return NextResponse.json({ error: 'Nom de boutique requis' }, { status: 400 });

    const existingShop = await db.shop.findUnique({ where: { ownerId: payload.userId } });
    if (existingShop) return NextResponse.json({ error: 'Vous avez déjà une boutique' }, { status: 409 });

    // Generate unique slug
    const baseSlug = generateShopSlug(name);
    let slug = baseSlug;
    let suffix = 1;
    while (await db.shop.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    const shop = await db.shop.create({
      data: {
        name,
        slug,
        description: description || null,
        logo: logo || null,
        category: category || null,
        address: address || null,
        city: city || null,
        country: country || null,
        ownerId: payload.userId,
      },
    });

    await db.activityLog.create({
      data: { userId: payload.userId, action: 'CREATE_SHOP', details: `Boutique: ${name}` },
    });

    return NextResponse.json({ shop }, { status: 201 });
  } catch (error) {
    console.error('Shops POST error:', error);
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
    const { shopId, name, description, logo, coverImage, category, address, city, country, phone, email, commune, hours, socials, currency, recommendationRequest } = body;

    const shop = await db.shop.findUnique({ where: { id: shopId } });
    if (!shop) return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 });

    if (payload.role !== 'ADMIN' && shop.ownerId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (name) {
      updateData.name = name;
      // Regenerate slug if name changes
      const baseSlug = generateShopSlug(name);
      let slug = baseSlug;
      let suffix = 1;
      while (await db.shop.findFirst({ where: { slug, NOT: { id: shopId } } })) {
        slug = `${baseSlug}-${suffix}`;
        suffix++;
      }
      updateData.slug = slug;
    }
    if (description !== undefined) updateData.description = description;
    if (logo !== undefined) updateData.logo = logo;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (category !== undefined) updateData.category = category;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (country !== undefined) updateData.country = country;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (commune !== undefined) updateData.commune = commune;
    if (hours !== undefined) updateData.hours = hours;
    if (socials !== undefined) updateData.socials = socials;
    if (currency !== undefined) updateData.currency = currency;

    if (recommendationRequest) {
      updateData.recommendationStatus = 'PENDING';
    }

    const updated = await db.shop.update({
      where: { id: shopId },
      data: updateData,
    });

    return NextResponse.json({ shop: updated });
  } catch (error) {
    console.error('Shops PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('id');

    if (!shopId) return NextResponse.json({ error: 'ID boutique requis' }, { status: 400 });

    const shop = await db.shop.findUnique({ where: { id: shopId } });
    if (!shop) return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 });

    // Soft delete - mark as inactive
    await db.shop.update({
      where: { id: shopId },
      data: { isActive: false },
    });

    await db.activityLog.create({
      data: { userId: payload.userId, action: 'DELETE_SHOP', details: `Boutique supprimée: ${shop.name}` },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Shops DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
