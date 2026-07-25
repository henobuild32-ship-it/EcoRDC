import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, UPLOADS_BUCKET, getPublicUrl } from '@/lib/supabase-storage';
import { randomUUID } from 'crypto';

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

const MAX_FILE_SIZE = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const ext = ALLOWED_MIME[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: `Type non supporté: ${file.type}. Acceptés: JPG, PNG, WebP, GIF, SVG` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 8 Mo)' },
        { status: 400 }
      );
    }

    const filename = `${randomUUID()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error } = await supabaseAdmin.storage
      .from(UPLOADS_BUCKET)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json(
        { error: `Erreur upload: ${error.message}` },
        { status: 500 }
      );
    }

    const url = getPublicUrl(filename);
    return NextResponse.json({ url, filename, size: file.size, type: file.type });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du téléchargement' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'upload',
    status: 'ok',
    backend: 'supabase-storage',
    maxSize: '8MB',
    acceptedTypes: Object.keys(ALLOWED_MIME),
  });
}
