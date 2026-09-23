'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function NotificationReadAction({ id, isRead }: { id: string; isRead: boolean }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function markRead() {
    if (!supabase) {
      setError('Supabase is required to update notifications.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Your session has expired. Please sign in again.')
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('recipient_user_id', user.id)

      if (updateError) throw updateError
      window.location.reload()
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : 'Unable to update notification.')
    } finally {
      setSaving(false)
    }
  }

  if (isRead) return <span className="text-xs font-medium text-stone-400">Read</span>

  return (
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-amber-500" />
      <button type="button" onClick={markRead} disabled={saving} className="text-xs font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-60">
        {saving ? 'Saving...' : 'Mark read'}
      </button>
      {error ? <span className="text-xs text-rose-700">{error}</span> : null}
    </div>
  )
}
