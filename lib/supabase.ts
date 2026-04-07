import { createBrowserClient, createServerClient, isBrowser, parse } from '@supabase/ssr'
import { type CookieOptions } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function createClientServer(cookies: { getAll: () => { name: string; value: string }[] }) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookies.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookies.set(name, value, options as CookieOptions)
            })
          } catch {
            // Called from Server Component
          }
        },
      },
    }
  )
}