'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function QcResultAction({ id, status }: { id: string; status: string }) {
  const initialValue = status === 'Approved' ? 'pass' : status === 'Open' ? 'fail' : status === 'In review' ? 'reinspection_required' : 'pending'
  const [value, setValue] = useState(initialValue)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function saveResult() {
    if (!supabase) {
      setError('Supabase is required to update QC results.')
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
      if (!membership) throw new Error('You do not have permission to update QC results.')

      const { error: updateError } = await supabase.from('qc_inspections').update({ result: value }).eq('id', id)
      if (updateError) throw updateError
      window.location.reload()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update QC result.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-200 pt-4">
      <select value={value} onChange={(event) => setValue(event.target.value)} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-slate-700">
        <option value="pending">Pending</option>
        <option value="pass">Pass</option>
        <option value="fail">Fail</option>
        <option value="reinspection_required">Reinspection required</option>
      </select>
      <button type="button" onClick={saveResult} disabled={saving} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Update result'}</button>
      {error ? <span className="text-sm text-rose-700">{error}</span> : null}
    </div>
  )
}
