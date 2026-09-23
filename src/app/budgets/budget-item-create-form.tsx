'use client'

import { useState } from 'react'
import type { Project } from '@/lib/mock-data'
import { supabase } from '@/lib/supabase'

export default function BudgetItemCreateForm({ projects }: { projects: Project[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({ projectId: projects[0]?.id ?? '', category: '', description: '', estimated: '', committed: '', actual: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!supabase) {
      setError('Connect Supabase before creating persistent budget items.')
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Your session has expired. Please sign in again.')
      if (!form.projectId) throw new Error('Select a project before adding a budget item.')

      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .in('role', ['admin', 'operations_manager'])
        .limit(1)
        .maybeSingle()

      if (membershipError) throw membershipError
      if (!membership) throw new Error('You do not have permission to manage budgets.')

      const estimated = Number(form.estimated)
      const committed = form.committed ? Number(form.committed) : 0
      const actual = form.actual ? Number(form.actual) : 0
      if (!Number.isFinite(estimated) || estimated < 0 || !Number.isFinite(committed) || committed < 0 || !Number.isFinite(actual) || actual < 0) {
        throw new Error('Budget amounts must be non-negative numbers.')
      }

      const { error: insertError } = await supabase.from('budget_items').insert({
        organization_id: membership.organization_id,
        project_id: form.projectId,
        category: form.category.trim(),
        description: form.description.trim() || null,
        estimated_cost: estimated,
        committed_cost: committed,
        actual_cost: actual,
        remaining_budget: estimated - actual,
      })

      if (insertError) throw insertError
      setIsOpen(false)
      window.location.reload()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create budget item.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={() => setIsOpen((current) => !current)} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
        {isOpen ? 'Close' : '+ Add budget item'}
      </button>

      {isOpen ? (
        <form onSubmit={handleSubmit} className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Project
              <select required value={form.projectId} onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400">
                <option value="">Select a project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Category
              <input required value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Materials" />
            </label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Description
              <input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Kitchen cabinets" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Estimated cost
              <input required type="number" min="0" step="0.01" value={form.estimated} onChange={(event) => setForm((current) => ({ ...current, estimated: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="2400" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Committed cost
              <input type="number" min="0" step="0.01" value={form.committed} onChange={(event) => setForm((current) => ({ ...current, committed: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="0" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Actual cost
              <input type="number" min="0" step="0.01" value={form.actual} onChange={(event) => setForm((current) => ({ ...current, actual: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="0" />
            </label>
          </div>

          {projects.length === 0 ? <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Create a project before adding budget items.</p> : null}
          {error ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600">Cancel</button>
            <button type="submit" disabled={saving || projects.length === 0} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Creating...' : 'Create budget item'}</button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
