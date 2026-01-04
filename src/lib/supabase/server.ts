import { createServerClient, parseCookieHeader } from '@supabase/ssr'
import { getRequestHeader, setCookie } from '@tanstack/react-start/server'
import { Database } from './types'

export function createSupabaseServerClient() {
  return createServerClient<Database>(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieHeader = getRequestHeader('Cookie')
          return parseCookieHeader(cookieHeader ?? '').map((c) => ({
            name: c.name,
            value: c.value ?? '',
          }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            setCookie(name, value, options)
          })
        },
      },
    }
  )
}
