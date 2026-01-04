import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import { getWebRequest } from '@tanstack/start/server'
import { Database } from './types'

export function createSupabaseServerClient() {
  const request = getWebRequest()!

  return createServerClient<Database>(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get('Cookie') ?? '')
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Note: This relies on the framework picking up the modified headers or passing them through
            request.headers.append('Set-Cookie', serializeCookieHeader(name, value, options))
          })
        },
      },
    }
  )
}
