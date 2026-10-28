import { createClient } from '@supabase/supabase-js';

export async function isHqAuthorized(request: Request): Promise<boolean> {
  const secret = process.env.HQ_CRON_SECRET;
  const providedSecret = request.headers.get('x-hq-secret');
  if (secret && providedSecret && providedSecret === secret) return true;

  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return false;

  const token = authorization.slice('Bearer '.length);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.getUser(token);
  return !error && Boolean(data.user);
}
