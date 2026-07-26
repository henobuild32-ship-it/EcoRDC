import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword, generateToken, verifyToken, generateShopSlug } from '@/lib/auth';
import { randomUUID } from 'crypto';

const REGISTRATION_FEE = parseFloat(process.env.VENDOR_REGISTRATION_FEE || '10000');

// Helper to format user response with shop info and subscription
async function formatUserResponse(user: {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  role: string;
  isActive: boolean;
  isSuspended: boolean;
  createdAt: Date;
}) {
  const baseUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    avatar: user.avatar,
    address: user.address,
    city: user.city,
    country: user.country,
    role: user.role,
    isActive: user.isActive,
    isSuspended: user.isSuspended,
    createdAt: user.createdAt,
  };

  if (user.role === 'VENDOR') {
    const [shop, subscription] = await Promise.all([
      db.shop.findUnique({
        where: { ownerId: user.id },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logo: true,
          coverImage: true,
          category: true,
          address: true,
          city: true,
          country: true,
          phone: true,
          email: true,
          commune: true,
          hours: true,
          socials: true,
          currency: true,
          isRecommended: true,
          recommendationStatus: true,
          isActive: true,
          createdAt: true,
        },
      }),
      db.subscription.findUnique({
        where: { vendorId: user.id },
        select: {
          id: true,
          status: true,
          startDate: true,
          expiryDate: true,
          amount: true,
          freeMonths: true,
          createdAt: true,
        },
      }),
    ]);

    // Calculate days until expiry
    let daysUntilExpiry: number | null = null;
    if (subscription?.expiryDate) {
      daysUntilExpiry = Math.ceil((subscription.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    }

    return { ...baseUser, shop, subscription: subscription ? { ...subscription, daysUntilExpiry } : null };
  }

  return baseUser;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'register') {
      const {
        email, password, name, phone, role,
        avatar, address, city, country,
        // Vendor-specific fields
        shopName, shopDescription, shopCategory, shopLogo,
        shopAddress, shopCity, shopCountry,
      } = body;

      if (!email || !password || !name) {
        return NextResponse.json({ error: 'Email, mot de passe et nom sont requis' }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();

      if (password.length < 6) {
        return NextResponse.json({ error: 'Le mot de passe doit avoir au moins 6 caractères' }, { status: 400 });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return NextResponse.json({ error: 'Format d\'email invalide' }, { status: 400 });
      }

      const existing = await db.user.findUnique({ where: { email: cleanEmail } });
      if (existing) {
        return NextResponse.json({ error: 'Un compte existe déjà avec cette adresse email' }, { status: 409 });
      }

      // For vendors, shopName is required
      if (role === 'VENDOR' && !shopName) {
        return NextResponse.json({ error: 'Le nom de la boutique est requis pour les vendeurs' }, { status: 400 });
      }

      const hashedPassword = await hashPassword(password);
      const user = await db.user.create({
        data: {
          email: cleanEmail,
          password: hashedPassword,
          name,
          phone: phone || null,
          avatar: avatar || null,
          address: address || null,
          city: city || null,
          country: country || null,
          role: role || 'CLIENT',
        },
      });

        // If vendor, create trial subscription + shop immediately (no payment required)
        if (role === 'VENDOR') {
          const effectiveShopName = shopName || `Boutique ${name}`;
          const now = new Date();
          const expiryDate = new Date(now);
          expiryDate.setDate(expiryDate.getDate() + 30);

          // Generate unique slug efficiently
          let baseSlug = generateShopSlug(effectiveShopName);
          let slug = baseSlug;
          let suffix = 1;
          const maxAttempts = 50;
          while (suffix < maxAttempts) {
            const existing = await db.shop.findUnique({ where: { slug } });
            if (!existing) break;
            slug = `${baseSlug}-${suffix}`;
            suffix++;
          }
          if (suffix >= maxAttempts) {
            slug = `${baseSlug}-${Date.now()}`;
          }

          // Use a transaction to atomically create all vendor records
          try {
            const [createdSubscription, createdShop] = await db.$transaction([
              db.subscription.create({
                data: {
                  vendorId: user.id,
                  status: 'TRIAL',
                  startDate: now,
                  expiryDate,
                  amount: 0,
                },
              }),
              db.shop.create({
                data: {
                  name: effectiveShopName,
                  slug,
                  description: shopDescription || null,
                  logo: shopLogo || null,
                  category: shopCategory || null,
                  address: shopAddress || address || null,
                  city: shopCity || city || null,
                  country: shopCountry || country || 'RD Congo',
                  phone: phone || null,
                  email: email || null,
                  commune: body.shopCommune || null,
                  hours: body.shopHours || null,
                  socials: body.shopSocials || null,
                  currency: body.shopCurrency || 'CDF',
                  ownerId: user.id,
                  isActive: true,
                },
              }),
            ]);

            // Record free trial payment + notification + activity
            await Promise.all([
              db.payment.create({
                data: {
                  vendorId: user.id,
                  subscriptionId: createdSubscription.id,
                  amount: 0,
                  currency: 'CDF',
                  type: 'SUBSCRIPTION',
                  status: 'COMPLETED',
                  paymentMethod: 'ADMIN_GRANT',
                  description: 'Essai gratuit 30 jours - Inscription vendeur',
                },
              }),
              db.notification.create({
                data: {
                  userId: user.id,
                  title: 'Bienvenue sur EcoRDC !',
                  message: `Votre boutique "${shopName}" est maintenant active pour 30 jours. Après cette période, vous devrez souscrire à l'abonnement (10 000 FC/mois).`,
                  type: 'SYSTEM',
                },
              }),
              db.activityLog.create({
                data: { userId: user.id, action: 'REGISTER', details: `Inscription vendeur - Essai gratuit 30 jours - Boutique "${shopName}" créée` },
              }),
            ]);
          } catch (createError) {
            // Rollback entire user creation if shop/subscription creation fails
            await db.user.delete({ where: { id: user.id } }).catch((e) => {
              console.error('Failed to rollback user creation:', e);
            });
            console.error('Vendor registration create error:', createError);
            return NextResponse.json({ error: 'Erreur lors de la création de la boutique' }, { status: 500 });
          }

          const token = generateToken({ userId: user.id, email: user.email, role: user.role });
          const userResponse = await formatUserResponse(user);

          return NextResponse.json({
            user: userResponse,
            token,
          });
        }

      const token = generateToken({ userId: user.id, email: user.email, role: user.role });

      await db.activityLog.create({
        data: { userId: user.id, action: 'REGISTER', details: `Inscription ${role}` },
      });

      const userResponse = await formatUserResponse(user);

      return NextResponse.json({
        user: userResponse,
        token,
      });
    }

    if (action === 'login') {
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();
      const user = await db.user.findUnique({ where: { email: cleanEmail } });
      if (!user) {
        return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
      }

      if (user.isSuspended || !user.isActive) {
        return NextResponse.json({ error: 'Compte suspendu ou désactivé' }, { status: 403 });
      }

      const valid = await verifyPassword(password, user.password);
      if (!valid) {
        return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
      }

      const token = generateToken({ userId: user.id, email: user.email, role: user.role });

      await db.activityLog.create({
        data: { userId: user.id, action: 'LOGIN', details: 'Connexion réussie' },
      });

      const userResponse = await formatUserResponse(user);

      return NextResponse.json({
        user: userResponse,
        token,
      });
    }

    if (action === 'me') {
      const { token } = body;
      if (!token) {
        return NextResponse.json({ error: 'Token requis' }, { status: 401 });
      }

      const payload = verifyToken(token);
      if (!payload) {
        return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
      }

      const user = await db.user.findUnique({ where: { id: payload.userId } });
      if (!user || user.isSuspended || !user.isActive) {
        return NextResponse.json({ error: 'Utilisateur non trouvé ou suspendu' }, { status: 401 });
      }

      // Check subscription expiry for vendors
      if (user.role === 'VENDOR') {
        const subscription = await db.subscription.findUnique({ where: { vendorId: user.id } });
        if (subscription && (subscription.status === 'ACTIVE' || subscription.status === 'TRIAL') && subscription.expiryDate && subscription.expiryDate < new Date()) {
          // Expire subscription and suspend vendor
          await db.subscription.update({
            where: { id: subscription.id },
            data: { status: 'EXPIRED' },
          });
          await db.user.update({
            where: { id: user.id },
            data: { isSuspended: true, isActive: false },
          });
          await db.notification.create({
            data: {
              userId: user.id,
              title: 'Abonnement expiré',
              message: 'Votre abonnement a expiré. Votre boutique est suspendue. Veuillez renouveler votre abonnement.',
              type: 'SYSTEM',
            },
          });
          return NextResponse.json({ error: 'Compte suspendu ou désactivé' }, { status: 403 });
        }
      }

      const userResponse = await formatUserResponse(user);

      return NextResponse.json({
        user: userResponse,
      });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
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
    const { name, email, phone, avatar, address, city, country } = body;

    // If email is being changed, check uniqueness
    if (email) {
      const existingUser = await db.user.findFirst({
        where: { email, NOT: { id: payload.userId } },
      });
      if (existingUser) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (country !== undefined) updateData.country = country;

    const user = await db.user.update({
      where: { id: payload.userId },
      data: updateData,
    });

    await db.activityLog.create({
      data: { userId: payload.userId, action: 'UPDATE_PROFILE', details: 'Mise à jour du profil' },
    });

    const userResponse = await formatUserResponse(user);

    return NextResponse.json({
      user: userResponse,
    });
  } catch (error) {
    console.error('Auth PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    await db.user.update({
      where: { id: payload.userId },
      data: { isActive: false },
    });

    await db.activityLog.create({
      data: { userId: payload.userId, action: 'DELETE_ACCOUNT', details: 'Compte supprimé' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Auth DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
