'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ChangeOrderDecision({ id, status }: { id: string; status: string }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const resolvedStatus = status.toLowerCase()
  const isDecided = resolvedStatus === 'approved' || resolvedStatus === 'rejected'

  async function decide(nextStatus: 'approved' | 'rejected') {
    if (!supabase) {
      setError('Supabase is required to approve change orders.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Your session has expired. Please sign in again.')

      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .in('role', ['admin', 'operations_manager'])
        .limit(1)
        .maybeSingle()

      if (membershipError) throw membershipError
      if (!membership) throw new Error('You do not have permission to decide change orders.')

      const { error: updateError } = await supabase.from('change_orders').update({
        status: nextStatus,
        approved_by: nextStatus === 'approved' ? user.id : null,
        approved_at: nextStatus === 'approved' ? new Date().toISOString() : null,
      }).eq('id', id)

      if (updateError) throw updateError
      window.location.reload()
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : 'Unable to update change order.')
    } finally {
      setSaving(false)
    }
  }

  if (isDecided) return null

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-200 pt-4">
      <button type="button" onClick={() => decide('approved')} disabled={saving} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">Approve</button>
      <button type="button" onClick={() => decide('rejected')} disabled={saving} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-60">Reject</button>
      {error ? <span className="text-sm text-rose-700">{error}</span> : null}
    </div>
  )
}
