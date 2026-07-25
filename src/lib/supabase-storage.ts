import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const UPLOADS_BUCKET = 'uploads';

export function getPublicUrl(path: string): string {
  const { data } = supabaseAdmin.storage
    .from(UPLOADS_BUCKET)
    .getPublicUrl(path);
  return data.publicUrl;
}
