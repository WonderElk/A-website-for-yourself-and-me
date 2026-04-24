import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const SUPABASE_URL = 'https://rwibbjneyweeyaamkgkb.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fDqDQ4wjGqn4afnp_ujgMg_4aMoFHy7';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export const POST_IMAGES_BUCKET = 'post-images';
