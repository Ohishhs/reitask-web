'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ProgressUpdateForm({ workOrderId }: { workOrderId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({ completion: '0', status: 'Work in progress', notes: '', blocker: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!supabase) {
      setError('Connect Supabase before submitting progress updates.')
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Your session has expired. Please sign in again.')

      const completion = Number(form.completion)
      if (!Number.isInteger(completion) || completion < 0 || completion > 100) throw new Error('Completion must be a whole number from 0 to 100.')

      const { data: workOrder, error: workOrderError } = await supabase
        .from('work_orders')
        .select('project_contractor:project_contractors(contractor_id)')
        .eq('id', workOrderId)
        .single()

      if (workOrderError) throw workOrderError
      const assignments = workOrder.project_contractor as { contractor_id: string }[] | null
      const contractorId = assignments?.[0]?.contractor_id
      if (!contractorId) throw new Error('This work order has no assigned contractor.')

      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (membershipError) throw membershipError
      if (!membership) throw new Error('You are not assigned to an organization.')

      const { error: insertError } = await supabase.from('progress_updates').insert({
        organization_id: membership.organization_id,
        work_order_id: workOrderId,
        contractor_id: contractorId,
        submitted_by: user.id,
        status_text: form.status.trim(),
        completion_percentage: completion,
        notes: form.notes.trim() || null,
        blocker_notes: form.blocker.trim() || null,
      })

      if (insertError) throw insertError

      const { error: updateError } = await supabase.from('work_orders').update({
        completion_percentage: completion,
        status: completion === 100 ? 'submitted_for_review' : 'in_progress',
      }).eq('id', workOrderId)

      if (updateError) throw updateError
      setIsOpen(false)
      window.location.reload()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit progress.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Execution log</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">Progress update</div>
        </div>
        <button type="button" onClick={() => setIsOpen((current) => !current)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          {isOpen ? 'Close' : 'Submit update'}
        </button>
      </div>

      {isOpen ? (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Completion percentage
            <input required type="number" min="0" max="100" step="1" value={form.completion} onChange={(event) => setForm((current) => ({ ...current, completion: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Status note
            <input required value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Work in progress" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Notes
            <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={3} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="What changed since the last update?" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Blocker
            <textarea value={form.blocker} onChange={(event) => setForm((current) => ({ ...current, blocker: event.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Optional blocker or site issue" />
          </label>
          {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          <button type="submit" disabled={saving} className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Submitting...' : 'Submit progress'}</button>
        </form>
      ) : null}
    </div>
  )
}
