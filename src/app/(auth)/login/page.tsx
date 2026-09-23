'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase, getSupabaseSessionHint } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('jordan@reitask.com')
  const [password, setPassword] = useState('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (supabase) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

        if (signInError) {
          throw signInError
        }

        router.push('/')
        return
      }

      if (!email || !password) {
        throw new Error('Email and password are required.')
      }

      localStorage.setItem('reitask_demo_session', JSON.stringify({ email, name: 'Jordan Smith' }))
      router.push('/')
    } catch (signInError) {
      const message = signInError instanceof Error ? signInError.message : 'Unable to sign in right now.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 p-6">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">R</div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">ReiTask</h1>
          <p className="mt-2 text-sm text-stone-500">Sign in to the operations workspace</p>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-center text-[11px] uppercase tracking-[0.14em] text-stone-500">
          {getSupabaseSessionHint()}
        </div>
      </div>
    </main>
  )
}
