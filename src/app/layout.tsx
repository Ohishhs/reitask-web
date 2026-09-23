import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getCurrentOrganizationRole } from '@/lib/supabase-server'

export const metadata: Metadata = {
  title: 'ReiTask',
  description: 'Renovation operations workspace',
}

const navItems = [
  { href: '/', label: 'Dashboard', roles: ['admin', 'operations_manager', 'contractor', 'owner'] },
  { href: '/properties', label: 'Properties', roles: ['admin', 'operations_manager', 'owner'] },
  { href: '/projects', label: 'Projects', roles: ['admin', 'operations_manager', 'contractor', 'owner'] },
  { href: '/inspections', label: 'Inspections', roles: ['admin', 'operations_manager'] },
  { href: '/scopes', label: 'Scopes', roles: ['admin', 'operations_manager', 'owner'] },
  { href: '/work-orders', label: 'Work Orders', roles: ['admin', 'operations_manager', 'contractor'] },
  { href: '/contractors', label: 'Contractors', roles: ['admin', 'operations_manager'] },
  { href: '/change-orders', label: 'Change Orders', roles: ['admin', 'operations_manager', 'contractor', 'owner'] },
  { href: '/qc', label: 'QC', roles: ['admin', 'operations_manager', 'owner'] },
  { href: '/punch-lists', label: 'Punch Lists', roles: ['admin', 'operations_manager', 'contractor', 'owner'] },
  { href: '/budgets', label: 'Budgets', roles: ['admin', 'operations_manager', 'owner'] },
  { href: '/notifications', label: 'Notifications', roles: ['admin', 'operations_manager', 'contractor', 'owner'] },
]

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const role = await getCurrentOrganizationRole()
  const visibleNavItems = navItems.filter((item) => !role || item.roles.includes(role))

  return (
    <html lang="en">
      <body className="bg-stone-100 text-slate-800 antialiased">
        <div className="mx-auto flex min-h-screen max-w-[1600px]">
          <aside className="hidden w-72 shrink-0 border-r border-stone-200 bg-stone-50 p-6 lg:flex lg:flex-col">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">R</div>
              <div className="text-lg font-semibold tracking-tight text-slate-900">ReiTask</div>
            </div>

            <div className="mb-6 rounded-xl border border-stone-200 bg-white p-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">Workspace</div>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-800">ReiTask Demo</div>
                  <div className="text-[11px] text-stone-500">Operations workspace</div>
                </div>
                <div className="rounded-lg bg-stone-100 px-2 py-1 text-[10px] font-medium text-stone-600">Ops</div>
              </div>
            </div>

            <nav className="space-y-1.5 text-sm">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-stone-600 transition hover:bg-stone-200/80 hover:text-slate-900"
                >
                  <span>{item.label}</span>
                  {item.href === '/' ? <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-white">12</span> : null}
                </Link>
              ))}
            </nav>
          </aside>

          <div className="flex-1">
            <header className="border-b border-stone-200 bg-stone-50/80 px-5 py-4 sm:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-stone-500">ReiTask Demo / <span className="font-semibold text-slate-700">Operations</span></div>
                <div className="flex items-center gap-3">
                  <button className="rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700">Notifications</button>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 font-semibold text-amber-900">JS</div>
                </div>
              </div>
            </header>

            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
