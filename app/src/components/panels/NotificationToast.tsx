import { useMindMapStore, useNotifications } from '../../store/mindmap'

export function NotificationToast() {
  const notifications = useNotifications()
  const store = useMindMapStore()

  if (!notifications.length) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 9999,
      }}
    >
      {notifications.map(n => (
        <div
          key={n.id}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            background:
              n.kind === 'error' ? '#fee2e2' :
              n.kind === 'warn' ? '#fef9c3' : '#dbeafe',
            color:
              n.kind === 'error' ? '#991b1b' :
              n.kind === 'warn' ? '#854d0e' : '#1e40af',
            border: '1px solid',
            borderColor:
              n.kind === 'error' ? '#fca5a5' :
              n.kind === 'warn' ? '#fde047' : '#93c5fd',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            maxWidth: 320,
          }}
          onClick={() => store.dismissNotification(n.id)}
        >
          {n.message}
        </div>
      ))}
    </div>
  )
}
