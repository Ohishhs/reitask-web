'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const maxFileSize = 10 * 1024 * 1024

export default function AttachmentUploadForm({ projectId, workOrderId }: { projectId: string; workOrderId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function uploadAttachment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!supabase) {
      setError('Connect Supabase before uploading attachments.')
      return
    }
    if (!file) {
      setError('Choose a file first.')
      return
    }
    if (file.size > maxFileSize) {
      setError('Files must be 10 MB or smaller.')
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
        .limit(1)
        .maybeSingle()

      if (membershipError) throw membershipError
      if (!membership) throw new Error('You are not assigned to an organization.')

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `${membership.organization_id}/${projectId}/work-orders/${workOrderId}/${crypto.randomUUID()}-${safeName}`
      const { error: uploadError } = await supabase.storage.from('attachments').upload(storagePath, file, { contentType: file.type || undefined, upsert: false })
      if (uploadError) throw uploadError

      const { error: metadataError } = await supabase.from('attachments').insert({
        organization_id: membership.organization_id,
        project_id: projectId,
        uploaded_by: user.id,
        bucket_id: 'attachments',
        storage_path: storagePath,
        file_name: file.name,
        content_type: file.type || null,
        byte_size: file.size,
      })

      if (metadataError) {
        await supabase.storage.from('attachments').remove([storagePath])
        throw metadataError
      }

      setFile(null)
      setMessage('Attachment uploaded.')
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload attachment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Files</div>
      <div className="mt-2 text-lg font-semibold text-slate-900">Work-order attachments</div>
      <form onSubmit={uploadAttachment} className="mt-4 space-y-3">
        <input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="block w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white" />
        <button type="submit" disabled={saving} className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Uploading...' : 'Upload file'}</button>
      </form>
      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  )
}
