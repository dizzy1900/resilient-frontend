import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Safe client wrapper.
 *
 * In some preview environments, `import.meta.env.VITE_SUPABASE_URL` may be empty briefly,
 * which causes `@supabase/supabase-js` to throw on module import.
 *
 * The values below are *public* (URL + publishable/anon key) and are safe to ship to the browser.
 * We still prefer env vars when present.
 */
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ??
  "https://ldvneffsoqhkngmrpdai.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxkdm5lZmZzb3Foa25nbXJwZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNzgyNjcsImV4cCI6MjA4NTY1NDI2N30.5464Fv3JFizWtm0GTf4dX2Fi4oiG7n9_lfI98wxrfoE";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
