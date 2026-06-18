import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./logger";

let _supabase: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_supabase) return _supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. " +
      "Get these from your Supabase project → Settings → API."
    );
  }

  _supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  logger.info("Supabase admin client initialised");
  return _supabase;
}

export { getClient as getSupabaseClient };
