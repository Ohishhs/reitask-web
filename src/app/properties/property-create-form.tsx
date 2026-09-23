'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const initialForm = {
  name: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  propertyType: 'single_family',
}

export default function PropertyCreateForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!supabase) {
      setError('Connect Supabase before creating persistent properties.')
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
      if (!membership) throw new Error('You do not have permission to create properties.')

      const { error: insertError } = await supabase.from('properties').insert({
        organization_id: membership.organization_id,
        name: form.name.trim(),
        address: form.address.trim(),
        address_line_1: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),
        postal_code: form.postalCode.trim(),
        property_type: form.propertyType,
      })

      if (insertError) throw insertError

      setForm(initialForm)
      setIsOpen(false)
      window.location.reload()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create property.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
      >
        {isOpen ? 'Close' : '+ Add property'}
      </button>

      {isOpen ? (
        <form onSubmit={handleSubmit} className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Property name
              <input required value={form.name} onChange={(event) => updateField('name', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="123 Main Street" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Address
              <input required value={form.address} onChange={(event) => updateField('address', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="123 Main Street" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              City
              <input required value={form.city} onChange={(event) => updateField('city', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="Austin" />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm font-medium text-slate-700">
                State
                <input required maxLength={2} value={form.state} onChange={(event) => updateField('state', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 uppercase outline-none focus:border-slate-400" placeholder="TX" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                ZIP
                <input value={form.postalCode} onChange={(event) => updateField('postalCode', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400" placeholder="78701" />
              </label>
            </div>
            <label className="text-sm font-medium text-slate-700">
              Property type
              <select value={form.propertyType} onChange={(event) => updateField('propertyType', event.target.value)} className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none focus:border-slate-400">
                <option value="single_family">Single family</option>
                <option value="multi_family">Multifamily</option>
                <option value="townhome">Townhome</option>
                <option value="condominium">Condominium</option>
                <option value="commercial">Commercial</option>
              </select>
            </label>
          </div>

          {error ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Creating...' : 'Create property'}</button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
