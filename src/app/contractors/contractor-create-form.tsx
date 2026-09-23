'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ContractorCreateForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', trades: '', serviceArea: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!supabase) {
      setError('Connect Supabase before creating persistent contractors.')
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
      if (!membership) throw new Error('You do not have permission to manage contractors.')

      const trades = form.trades.split(',').map((trade) => trade.trim()).filter(Boolean)
      const { error: insertError } = await supabase.from('contractors').insert({
        organization_id: membership.organization_id,
        company_name: form.companyName.trim(),
        contact_name: form.contactName.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        trades,
        service_area: form.serviceArea.trim() || null,
        status: 'active',
      })

      if (insertError) throw insertError
      setIsOpen(false)
      window.location.reload()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create contractor.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={() => setIsOpen((current) => !current)} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
        {isOpen ? 'Close' : '+ Add contractor'}
      </button>

      {isOpen ? (
        <form onSubmit={handleSubmit} className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Company name
              <input required value={form.companyName} onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="ABC Plumbing" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Contact name
              <input value={form.contactName} onChange={(event) => setForm((current) => ({ ...current, contactName: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Alex Rivera" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Email
              <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="alex@example.com" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Phone
              <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="512-555-0100" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Trades
              <input required value={form.trades} onChange={(event) => setForm((current) => ({ ...current, trades: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Plumbing, HVAC" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Service area
              <input value={form.serviceArea} onChange={(event) => setForm((current) => ({ ...current, serviceArea: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Austin metro" />
            </label>
          </div>

          {error ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Creating...' : 'Create contractor'}</button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
