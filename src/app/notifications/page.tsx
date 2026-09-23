import { fetchNotifications } from '@/lib/repository'
import NotificationReadAction from './notification-read-action'

export default async function NotificationsPage() {
  const notifications = await fetchNotifications()

  return (
    <main className="min-h-screen bg-stone-100 p-6 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">Updates</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Notifications</h1>
        </div>

        <div className="space-y-4">
          {notifications.map((notification) => (
            <div key={notification.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-stone-400">{notification.type}</div>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">{notification.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{notification.detail}</p>
                </div>
                <div className="flex flex-col items-end gap-2 text-xs font-medium text-stone-500">
                  <span>{notification.time}</span>
                  <NotificationReadAction id={notification.id} isRead={notification.isRead} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
