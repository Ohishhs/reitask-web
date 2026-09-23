'use client'

import { useState } from 'react'
import type { Property } from '@/lib/mock-data'
import { supabase } from '@/lib/supabase'

export default function ProjectCreateForm({ properties }: { properties: Property[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({ name: '', propertyId: properties[0]?.id ?? '', startDate: '', dueDate: '', budget: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!supabase) {
      setError('Connect Supabase before creating persistent projects.')
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Your session has expired. Please sign in again.')

      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'operations_manager'])
        .limit(1)
        .maybeSingle()

      if (membershipError) throw membershipError
      if (!membership) throw new Error('You do not have permission to create projects.')
      if (!form.propertyId) throw new Error('Select a property before creating a project.')

      const budget = form.budget ? Number(form.budget) : 0
      if (Number.isNaN(budget) || budget < 0) throw new Error('Budget must be a non-negative number.')

      const { error: insertError } = await supabase.from('projects').insert({
        organization_id: membership.organization_id,
        property_id: form.propertyId,
        name: form.name.trim(),
        status: 'planning',
        starts_on: form.startDate || null,
        due_on: form.dueDate || null,
        start_date: form.startDate || null,
        target_completion_date: form.dueDate || null,
        budget_total: budget,
        actual_cost: 0,
      })

      if (insertError) throw insertError

      setIsOpen(false)
      window.location.reload()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create project.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={() => setIsOpen((current) => !current)} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
        {isOpen ? 'Close' : '+ New project'}
      </button>

      {isOpen ? (
        <form onSubmit={handleSubmit} className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Project name
              <input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Initial renovation" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Property
              <select required value={form.propertyId} onChange={(event) => setForm((current) => ({ ...current, propertyId: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400">
                <option value="">Select a property</option>
                {properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Start date
              <input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Target completion
              <input type="date" min={form.startDate || undefined} value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Planned budget
              <input type="number" min="0" step="0.01" value={form.budget} onChange={(event) => setForm((current) => ({ ...current, budget: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="25000" />
            </label>
          </div>

          {properties.length === 0 ? <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Create a property before creating a project.</p> : null}
          {error ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600">Cancel</button>
            <button type="submit" disabled={saving || properties.length === 0} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Creating...' : 'Create project'}</button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
