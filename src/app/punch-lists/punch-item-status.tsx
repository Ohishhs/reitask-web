'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PunchItemStatus({ id, status }: { id: string; status: string }) {
  const [value, setValue] = useState(status === 'Complete' ? 'completed' : status === 'In progress' ? 'in_progress' : 'open')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function saveStatus() {
    if (!supabase) {
      setError('Supabase is required to update punch items.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('punch_items')
        .update({ status: value, completion_date: value === 'completed' ? new Date().toISOString().slice(0, 10) : null })
        .eq('id', id)

      if (updateError) throw updateError
      window.location.reload()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update punch item.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-200 pt-4">
      <select value={value} onChange={(event) => setValue(event.target.value)} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-slate-700">
        <option value="open">Open</option>
        <option value="in_progress">In progress</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <button type="button" onClick={saveStatus} disabled={saving} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Update status'}</button>
      {error ? <span className="text-sm text-rose-700">{error}</span> : null}
    </div>
  )
}
