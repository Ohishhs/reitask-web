'use client'

import { useState } from 'react'
import type { Project } from '@/lib/mock-data'
import { supabase } from '@/lib/supabase'

export default function ChangeOrderCreateForm({ projects }: { projects: Project[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({ projectId: projects[0]?.id ?? '', workOrderId: '', reason: '', description: '', costImpact: '', scheduleImpact: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const selectedProject = projects.find((project) => project.id === form.projectId)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!supabase) {
      setError('Connect Supabase before creating persistent change orders.')
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Your session has expired. Please sign in again.')
      if (!form.projectId) throw new Error('Select a project before submitting a change order.')

      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (membershipError) throw membershipError
      if (!membership) throw new Error('You are not assigned to an organization.')

      const costImpact = form.costImpact ? Number(form.costImpact) : 0
      const scheduleImpact = form.scheduleImpact ? Number(form.scheduleImpact) : 0
      if (!Number.isFinite(costImpact) || !Number.isFinite(scheduleImpact)) throw new Error('Cost and schedule impact must be numbers.')
      if (scheduleImpact < 0) throw new Error('Schedule impact cannot be negative.')

      const { error: insertError } = await supabase.from('change_orders').insert({
        organization_id: membership.organization_id,
        project_id: form.projectId,
        work_order_id: form.workOrderId || null,
        requested_by: user.id,
        reason: form.reason.trim(),
        description: form.description.trim(),
        cost_impact: costImpact,
        schedule_impact_days: scheduleImpact,
        status: 'submitted',
      })

      if (insertError) throw insertError
      setIsOpen(false)
      window.location.reload()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit change order.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={() => setIsOpen((current) => !current)} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
        {isOpen ? 'Close' : '+ New change order'}
      </button>

      {isOpen ? (
        <form onSubmit={handleSubmit} className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Project
              <select required value={form.projectId} onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value, workOrderId: '' }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400">
                <option value="">Select a project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Work order
              <select value={form.workOrderId} onChange={(event) => setForm((current) => ({ ...current, workOrderId: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400">
                <option value="">Project-level change</option>
                {selectedProject?.workOrders.map((workOrder) => <option key={workOrder.id} value={workOrder.id}>{workOrder.title}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Reason
              <input required value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Unexpected site condition" />
            </label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Description
              <textarea required value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Describe the requested scope change." />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Cost impact
              <input type="number" step="0.01" value={form.costImpact} onChange={(event) => setForm((current) => ({ ...current, costImpact: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="0" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Schedule impact (days)
              <input type="number" min="0" step="1" value={form.scheduleImpact} onChange={(event) => setForm((current) => ({ ...current, scheduleImpact: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="0" />
            </label>
          </div>

          {projects.length === 0 ? <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Create a project before submitting a change order.</p> : null}
          {error ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600">Cancel</button>
            <button type="submit" disabled={saving || projects.length === 0} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Submitting...' : 'Submit change order'}</button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
