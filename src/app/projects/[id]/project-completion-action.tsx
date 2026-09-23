'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ProjectCompletionAction({ projectId, status }: { projectId: string; status: string }) {
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const isCompleted = status === 'Completed'

  async function completeProject() {
    setError('')
    if (!supabase) {
      setError('Connect Supabase before completing projects.')
      return
    }

    setSaving(true)

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
      if (!membership) throw new Error('You do not have permission to complete projects.')

      const { data: openPunchItems, error: punchError } = await supabase
        .from('punch_items')
        .select('id')
        .eq('project_id', projectId)
        .in('status', ['open', 'in_progress'])

      if (punchError) throw punchError
      if (openPunchItems && openPunchItems.length > 0) throw new Error(`${openPunchItems.length} punch item${openPunchItems.length === 1 ? '' : 's'} still require correction.`)

      const { error: updateError } = await supabase.from('projects').update({ status: 'completed' }).eq('id', projectId)
      if (updateError) throw updateError
      window.location.reload()
    } catch (completionError) {
      setError(completionError instanceof Error ? completionError.message : 'Unable to complete project.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Closeout</div>
      <p className="mt-2 text-sm leading-6 text-stone-600">A project can be completed after all punch items are closed.</p>
      <button type="button" onClick={completeProject} disabled={saving || isCompleted} className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
        {isCompleted ? 'Project completed' : saving ? 'Checking punch list...' : 'Mark project completed'}
      </button>
      {error ? <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
    </div>
  )
}
