'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Attachment = {
  id: string
  file_name: string
  storage_path: string
  content_type: string | null
  byte_size: number | null
  created_at: string
}

function formatBytes(bytes: number | null) {
  if (!bytes) return 'Unknown size'
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AttachmentList({ projectId }: { projectId: string }) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadAttachments() {
      if (!supabase) {
        setLoading(false)
        return
      }

      const { data, error: queryError } = await supabase
        .from('attachments')
        .select('id, file_name, storage_path, content_type, byte_size, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (queryError) setError(queryError.message)
      else setAttachments((data as Attachment[] | null) ?? [])
      setLoading(false)
    }

    void loadAttachments()
  }, [projectId])

  async function downloadAttachment(attachment: Attachment) {
    if (!supabase) return
    const { data, error: signedUrlError } = await supabase.storage.from('attachments').createSignedUrl(attachment.storage_path, 60)
    if (signedUrlError) {
      setError(signedUrlError.message)
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Library</div>
      <div className="mt-2 text-lg font-semibold text-slate-900">Uploaded files</div>
      {loading ? <p className="mt-4 text-sm text-stone-500">Loading files...</p> : null}
      {!loading && attachments.length === 0 ? <p className="mt-4 text-sm text-stone-500">No files uploaded yet.</p> : null}
      <div className="mt-4 space-y-2">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-slate-800">{attachment.file_name}</div>
              <div className="text-xs text-stone-500">{formatBytes(attachment.byte_size)} · {new Date(attachment.created_at).toLocaleDateString()}</div>
            </div>
            <button type="button" onClick={() => downloadAttachment(attachment)} className="shrink-0 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">Download</button>
          </div>
        ))}
      </div>
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  )
}
