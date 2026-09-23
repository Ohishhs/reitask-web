'use client'

import { useState } from 'react'
import type { Project } from '@/lib/mock-data'
import type { ContractorSummary } from '@/lib/repository'
import { supabase } from '@/lib/supabase'

export default function WorkOrderCreateForm({ projects, contractors }: { projects: Project[]; contractors: ContractorSummary[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({ projectId: projects[0]?.id ?? '', contractorId: contractors[0]?.id ?? '', scopeTitle: '', trade: '', title: '', description: '', startDate: '', dueDate: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const selectedProject = projects.find((project) => project.id === form.projectId)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!supabase) {
      setError('Connect Supabase before creating persistent work orders.')
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Your session has expired. Please sign in again.')
      if (!form.projectId || !form.contractorId) throw new Error('Select a project and contractor.')
      if (!form.startDate || !form.dueDate) throw new Error('Add a start date and due date.')
      if (form.dueDate < form.startDate) throw new Error('Due date cannot be before the start date.')

      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .in('role', ['admin', 'operations_manager'])
        .limit(1)
        .maybeSingle()

      if (membershipError) throw membershipError
      if (!membership) throw new Error('You do not have permission to manage work orders.')

      const { data: assignment, error: assignmentError } = await supabase
        .from('project_contractors')
        .upsert({ organization_id: membership.organization_id, project_id: form.projectId, contractor_id: form.contractorId }, { onConflict: 'project_id,contractor_id' })
        .select('id')
        .single()

      if (assignmentError) throw assignmentError

      const { data: workOrder, error: workOrderError } = await supabase.from('work_orders').insert({
        organization_id: membership.organization_id,
        project_id: form.projectId,
        project_contractor_id: assignment.id,
        trade: form.trade.trim(),
        title: form.title.trim(),
        description: form.description.trim() || null,
        start_date: form.startDate,
        due_date: form.dueDate,
        status: 'assigned',
        created_by: user.id,
      }).select('id').single()

      if (workOrderError) throw workOrderError

      const scopeItem = selectedProject?.scopeItems.find((item) => item.title === form.scopeTitle)
      if (scopeItem && scopeItem.title !== 'No scope reference') {
        const { data: scopeRows, error: scopeError } = await supabase.from('scope_items').select('id').eq('project_id', form.projectId).eq('title', scopeItem.title).limit(1)
        if (scopeError) throw scopeError
        if (scopeRows?.[0]) {
          const { error: linkError } = await supabase.from('work_order_scope_items').insert({ work_order_id: workOrder.id, scope_item_id: scopeRows[0].id })
          if (linkError) throw linkError
        }
      }

      setIsOpen(false)
      window.location.reload()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create work order.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={() => setIsOpen((current) => !current)} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
        {isOpen ? 'Close' : '+ Create work order'}
      </button>

      {isOpen ? (
        <form onSubmit={handleSubmit} className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Project
              <select required value={form.projectId} onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value, scopeTitle: '' }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400">
                <option value="">Select a project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Contractor
              <select required value={form.contractorId} onChange={(event) => setForm((current) => ({ ...current, contractorId: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400">
                <option value="">Select a contractor</option>
                {contractors.map((contractor) => <option key={contractor.id} value={contractor.id}>{contractor.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Trade
              <input required value={form.trade} onChange={(event) => setForm((current) => ({ ...current, trade: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Plumbing" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Scope reference
              <select value={form.scopeTitle} onChange={(event) => setForm((current) => ({ ...current, scopeTitle: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400">
                <option value="">No scope reference</option>
                {selectedProject?.scopeItems.map((item) => <option key={item.title} value={item.title}>{item.title}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Work order title
              <input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Repair kitchen supply lines" />
            </label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Description
              <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Describe the assigned work." />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Start date
              <input required type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Due date
              <input required type="date" min={form.startDate || undefined} value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" />
            </label>
          </div>

          {projects.length === 0 || contractors.length === 0 ? <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Create a project and contractor before creating a work order.</p> : null}
          {error ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600">Cancel</button>
            <button type="submit" disabled={saving || projects.length === 0 || contractors.length === 0} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Creating...' : 'Assign work order'}</button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
