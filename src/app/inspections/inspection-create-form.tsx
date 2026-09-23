'use client'

import { useState } from 'react'
import type { Project } from '@/lib/mock-data'
import { supabase } from '@/lib/supabase'

export default function InspectionCreateForm({ projects }: { projects: Project[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({ projectId: projects[0]?.id ?? '', inspectionDate: new Date().toISOString().slice(0, 10), notes: '', area: '', issueTitle: '', issueDescription: '', severity: 'MEDIUM' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!supabase) {
      setError('Connect Supabase before creating persistent inspections.')
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Your session has expired. Please sign in again.')
      if (!form.projectId) throw new Error('Select a project before creating an inspection.')

      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .in('role', ['admin', 'operations_manager'])
        .limit(1)
        .maybeSingle()

      if (membershipError) throw membershipError
      if (!membership) throw new Error('You do not have permission to create inspections.')

      const { data: inspection, error: insertError } = await supabase.from('inspections').insert({
        organization_id: membership.organization_id,
        project_id: form.projectId,
        inspector_user_id: user.id,
        inspection_date: form.inspectionDate,
        status: 'draft',
        notes: form.notes.trim() || null,
      }).select('id').single()

      if (insertError) throw insertError
      if (form.area.trim()) {
        const { data: area, error: areaError } = await supabase
          .from('inspection_areas')
          .insert({ inspection_id: inspection.id, name: form.area.trim() })
          .select('id')
          .single()

        if (areaError) throw areaError
        if (form.issueTitle.trim()) {
          const { error: issueError } = await supabase.from('inspection_issues').insert({
            inspection_area_id: area.id,
            title: form.issueTitle.trim(),
            description: form.issueDescription.trim() || form.issueTitle.trim(),
            severity: form.severity,
          })
          if (issueError) throw issueError
        }
      }
      setIsOpen(false)
      window.location.reload()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create inspection.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={() => setIsOpen((current) => !current)} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
        {isOpen ? 'Close' : '+ New inspection'}
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
              Inspection date
              <input required type="date" value={form.inspectionDate} onChange={(event) => setForm((current) => ({ ...current, inspectionDate: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" />
            </label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Notes
              <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={3} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Record the initial site observations." />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Area
              <input value={form.area} onChange={(event) => setForm((current) => ({ ...current, area: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Kitchen" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Issue title
              <input value={form.issueTitle} onChange={(event) => setForm((current) => ({ ...current, issueTitle: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Cabinet damage" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Severity
              <select value={form.severity} onChange={(event) => setForm((current) => ({ ...current, severity: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Issue description
              <textarea value={form.issueDescription} onChange={(event) => setForm((current) => ({ ...current, issueDescription: event.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Describe the observed condition." />
            </label>
          </div>

          {projects.length === 0 ? <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Create a project before creating an inspection.</p> : null}
          {error ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600">Cancel</button>
            <button type="submit" disabled={saving || projects.length === 0} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Creating...' : 'Create draft inspection'}</button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
