'use client'

import { useState } from 'react'
import type { Project } from '@/lib/mock-data'
import { supabase } from '@/lib/supabase'

export default function ScopeCreateForm({ projects }: { projects: Project[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({ projectId: projects[0]?.id ?? '', category: '', title: '', description: '', quantity: '1', unit: '', labor: '', materials: '', priority: 'normal' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!supabase) {
      setError('Connect Supabase before creating persistent scope items.')
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Your session has expired. Please sign in again.')
      if (!form.projectId) throw new Error('Select a project before adding scope.')

      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .in('role', ['admin', 'operations_manager'])
        .limit(1)
        .maybeSingle()

      if (membershipError) throw membershipError
      if (!membership) throw new Error('You do not have permission to manage scope.')

      const quantity = Number(form.quantity)
      const labor = form.labor ? Number(form.labor) : 0
      const materials = form.materials ? Number(form.materials) : 0
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Quantity must be greater than zero.')
      if (!Number.isFinite(labor) || labor < 0 || !Number.isFinite(materials) || materials < 0) throw new Error('Cost estimates must be non-negative numbers.')

      const { error: insertError } = await supabase.from('scope_items').insert({
        organization_id: membership.organization_id,
        project_id: form.projectId,
        category: form.category.trim(),
        title: form.title.trim(),
        description: form.description.trim() || null,
        quantity,
        unit: form.unit.trim() || null,
        labor_estimate: labor,
        material_estimate: materials,
        total_estimate: labor + materials,
        priority: form.priority,
        status: 'draft',
        created_by: user.id,
      })

      if (insertError) throw insertError
      setIsOpen(false)
      window.location.reload()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create scope item.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={() => setIsOpen((current) => !current)} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
        {isOpen ? 'Close' : '+ Add scope item'}
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
              <input required value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Plumbing" />
            </label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Scope item
              <input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Repair bathroom plumbing" />
            </label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Description
              <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Describe the expected work." />
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
              Unit
              <input value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Each" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Quantity
              <input required type="number" min="0.01" step="0.01" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm font-medium text-slate-700">
                Labor
                <input type="number" min="0" step="0.01" value={form.labor} onChange={(event) => setForm((current) => ({ ...current, labor: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="0" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Materials
                <input type="number" min="0" step="0.01" value={form.materials} onChange={(event) => setForm((current) => ({ ...current, materials: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="0" />
              </label>
            </div>
          </div>

          {projects.length === 0 ? <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Create a project before adding scope.</p> : null}
          {error ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600">Cancel</button>
            <button type="submit" disabled={saving || projects.length === 0} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Creating...' : 'Create scope item'}</button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
