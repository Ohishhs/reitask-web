import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getSupabaseServerClient() {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) return null

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
        }
      },
    },
  })
}

export async function getCurrentOrganizationRole() {
  const client = await getSupabaseServerClient()
  if (!client) return null

  const { data: { user } } = await client.auth.getUser()
  if (!user) return null

  const { data } = await client
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  return data?.role ?? null
}
