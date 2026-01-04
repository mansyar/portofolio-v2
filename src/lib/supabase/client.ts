import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.PUBLIC_SUPABASE_ANON_KEY!
  )
}
