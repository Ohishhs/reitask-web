'use client'

import { useState } from 'react'
import type { Project } from '@/lib/mock-data'
import type { ContractorSummary } from '@/lib/repository'
import { supabase } from '@/lib/supabase'

export default function PunchItemCreateForm({ projects, contractors }: { projects: Project[]; contractors: ContractorSummary[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({ projectId: projects[0]?.id ?? '', workOrderId: '', contractorId: '', description: '', location: '', priority: 'normal', dueDate: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const selectedProject = projects.find((project) => project.id === form.projectId)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!supabase) {
      setError('Connect Supabase before creating persistent punch items.')
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Your session has expired. Please sign in again.')
      if (!form.projectId) throw new Error('Select a project before adding a punch item.')

      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .in('role', ['admin', 'operations_manager'])
        .limit(1)
        .maybeSingle()

      if (membershipError) throw membershipError
      if (!membership) throw new Error('You do not have permission to manage punch lists.')

      const { error: insertError } = await supabase.from('punch_items').insert({
        organization_id: membership.organization_id,
        project_id: form.projectId,
        work_order_id: form.workOrderId || null,
        description: form.description.trim(),
        location: form.location.trim() || null,
        assigned_contractor_id: form.contractorId || null,
        priority: form.priority,
        status: 'open',
        due_date: form.dueDate || null,
      })

      if (insertError) throw insertError
      setIsOpen(false)
      window.location.reload()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create punch item.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={() => setIsOpen((current) => !current)} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
        {isOpen ? 'Close' : '+ Add punch item'}
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
                <option value="">No work order link</option>
                {selectedProject?.workOrders.map((workOrder) => <option key={workOrder.id} value={workOrder.id}>{workOrder.title}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Description
              <input required value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Touch up bedroom paint" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Location
              <input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Bedroom 2" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Assigned contractor
              <select value={form.contractorId} onChange={(event) => setForm((current) => ({ ...current, contractorId: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400">
                <option value="">Unassigned</option>
                {contractors.map((contractor) => <option key={contractor.id} value={contractor.id}>{contractor.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Priority
              <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Due date
              <input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" />
            </label>
          </div>

          {projects.length === 0 ? <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Create a project before adding punch items.</p> : null}
          {error ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600">Cancel</button>
            <button type="submit" disabled={saving || projects.length === 0} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Creating...' : 'Create punch item'}</button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
